import { StandupRepository, StoredWeeklyReport } from '@/domain/repositories/StandupRepository';
import { WeeklyReport } from '@/domain/entities/WeeklyReport';
import { TeamMember } from '@/domain/entities/TeamMember';
import { StandupEntry } from '@/domain/entities/StandupEntry';
import { WeeklyReportSummary, MemberSummary } from '@/domain/value-objects/WeeklyReportSummary';
import { supabase } from '@/lib/supabase';

/**
 * Supabase implementation of StandupRepository
 * Handles all database operations for standup data
 */
export class SupabaseStandupRepository implements StandupRepository {
  private readonly VANCOUVER_TIMEZONE = 'America/Vancouver';

  /**
   * Get today's standup entries
   */
  async getTodayStandup(): Promise<TeamMember[]> {
    try {
      const today = this.getVancouverDate();
      const standupEntry = await this.getOrCreateStandupEntry(today);

      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select(`
          *,
          standup_updates!inner(
            yesterday,
            today,
            blockers,
            updated_at,
            created_at
          )
        `)
        .eq('standup_updates.standup_entry_id', standupEntry.id)
        .gte('standup_updates.created_at', `${today}T00:00:00-08:00`)
        .lt('standup_updates.created_at', `${today}T23:59:59-08:00`);

      if (membersError) throw membersError;

      const membersWithUpdates = members?.map(member => 
        this.transformUpdateToTeamMember(member.standup_updates[0], member)
      ) || [];

      return membersWithUpdates;
    } catch (error) {
      console.error('Failed to get today\'s standup:', error);
      throw error;
    }
  }

  /**
   * Get standup history
   */
  async getStandupHistory(limit: number = 50): Promise<StandupEntry[]> {
    try {
      const today = this.getVancouverDate();
      
      const { data: updates, error: updatesError } = await supabase
        .from('standup_updates')
        .select(`
          *,
          standup_entries!inner(
            id,
            date
          ),
          team_members!inner(
            id,
            name,
            role,
            avatar
          )
        `)
        .lt('created_at', `${today}T00:00:00-08:00`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (updatesError) throw updatesError;
      
      if (!updates || updates.length === 0) {
        return [];
      }

      // Group by submission date
      const updatesByDate = new Map<string, typeof updates>();
      
      updates.forEach(update => {
        const submissionDate = this.extractDateFromTimestamp(update.created_at);
        if (submissionDate) {
          if (!updatesByDate.has(submissionDate)) {
            updatesByDate.set(submissionDate, []);
          }
          updatesByDate.get(submissionDate)!.push(update);
        }
      });

      const history: StandupEntry[] = Array.from(updatesByDate.entries())
        .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
        .slice(0, 10)
        .map(([date, dateUpdates]) => new StandupEntry(
          `date-${date}`,
          date,
          dateUpdates.map((update) => 
            this.transformUpdateToTeamMember(update, update.team_members)
          ),
          dateUpdates[0]?.created_at || date
        ));

      return history;
    } catch (error) {
      console.error('Failed to get standup history:', error);
      throw error;
    }
  }

  /**
   * Save a team member's update
   */
  async saveTeamMemberUpdate(member: TeamMember): Promise<void> {
    try {
      const today = this.getVancouverDate();
      const standupEntry = await this.getOrCreateStandupEntry(today);

      // Check if team member exists
      const { data: existingMembers } = await supabase
        .from('team_members')
        .select('*')
        .eq('id', member.id);

      const existingMember = existingMembers?.[0];

      if (!existingMember) {
        // Create new team member
        const { error: memberError } = await supabase
          .from('team_members')
          .insert({
            id: member.id,
            name: member.name,
            role: member.role,
            avatar: member.avatar
          });

        if (memberError) throw memberError;
      } else {
        // Update existing team member
        const { error: memberError } = await supabase
          .from('team_members')
          .update({
            name: member.name,
            role: member.role,
            avatar: member.avatar
          })
          .eq('id', member.id);

        if (memberError) throw memberError;
      }

      // Check if update already exists for today
      const { data: existingUpdates } = await supabase
        .from('standup_updates')
        .select('*')
        .eq('standup_entry_id', standupEntry.id)
        .eq('team_member_id', member.id);

      const existingUpdate = existingUpdates?.[0];

      if (existingUpdate) {
        // Update existing standup update
        const { error: updateError } = await supabase
          .from('standup_updates')
          .update({
            yesterday: member.yesterday,
            today: member.today,
            blockers: member.blockers
          })
          .eq('id', existingUpdate.id);

        if (updateError) throw updateError;
      } else {
        // Create new standup update
        const { error: updateError } = await supabase
          .from('standup_updates')
          .insert({
            standup_entry_id: standupEntry.id,
            team_member_id: member.id,
            yesterday: member.yesterday,
            today: member.today,
            blockers: member.blockers
          });

        if (updateError) throw updateError;
      }
    } catch (error) {
      console.error('Failed to save team member update:', error);
      throw error;
    }
  }

  /**
   * Get yesterday's update count
   */
  async getYesterdayUpdateCount(): Promise<number> {
    try {
      const targetDate = this.getPreviousBusinessDay();

      const { data: updates } = await supabase
        .from('standup_updates')
        .select(`
          *,
          standup_entries(*)
        `);

      if (updates) {
        const targetDateUpdates = updates.filter(update => 
          update.standup_entries?.date === targetDate
        );
        return targetDateUpdates.length;
      }
      return 0;
    } catch (error) {
      console.error('Failed to get yesterday update count:', error);
      return 0;
    }
  }

  /**
   * Get team engagement for the current week
   */
  async getTeamEngagement(): Promise<number> {
    try {
      const weekStart = this.getWeekStartDate();

      const { data: weekEntries } = await supabase
        .from('standup_entries')
        .select('id')
        .gte('date', weekStart);

      if (weekEntries?.length) {
        const entryIds = weekEntries.map(entry => entry.id);

        const { data: uniqueMembers } = await supabase
          .from('standup_updates')
          .select('team_member_id')
          .in('standup_entry_id', entryIds);

        if (uniqueMembers) {
          const uniqueMemberIds = [...new Set(uniqueMembers.map(m => m.team_member_id))];
          return uniqueMemberIds.length;
        }
      }
      return 0;
    } catch (error) {
      console.error('Failed to get team engagement:', error);
      return 0;
    }
  }

  /**
   * Generate a weekly report
   */
  async generateWeeklyReport(weekStart: string, weekEnd: string): Promise<WeeklyReport> {
    try {
      // Fetch all standup entries for the week
      const { data: weekEntries, error: entriesError } = await supabase
        .from('standup_entries')
        .select('id, date')
        .gte('date', weekStart)
        .lte('date', weekEnd)
        .order('date', { ascending: true });

      if (entriesError) throw entriesError;

      if (!weekEntries || weekEntries.length === 0) {
        return new WeeklyReport(
          weekStart,
          weekEnd,
          [],
          new WeeklyReportSummary([], [], [], 'No standup data available for this week.', [], {})
        );
      }

      const entryIds = weekEntries.map(entry => entry.id);

      // Fetch all updates for the week
      const { data: updates, error: updatesError } = await supabase
        .from('standup_updates')
        .select(`
          *,
          standup_entries!inner(
            id,
            date
          ),
          team_members!inner(
            id,
            name,
            role,
            avatar
          )
        `)
        .in('standup_entry_id', entryIds)
        .order('created_at', { ascending: true });

      if (updatesError) throw updatesError;

      // Group updates by date
      const updatesByDate = new Map<string, typeof updates>();
      
      updates?.forEach(update => {
        const date = update.standup_entries?.date;
        if (date) {
          if (!updatesByDate.has(date)) {
            updatesByDate.set(date, []);
          }
          updatesByDate.get(date)!.push(update);
        }
      });

      // Convert to StandupEntry format
      const entries: StandupEntry[] = Array.from(updatesByDate.entries())
        .map(([date, dateUpdates]) => new StandupEntry(
          `weekly-${date}`,
          date,
          dateUpdates.map((update) => 
            this.transformUpdateToTeamMember(update, update.team_members)
          ),
          dateUpdates[0]?.created_at || date
        ))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Create basic summary
      const summary = this.generateBasicSummary(entries);

      return new WeeklyReport(weekStart, weekEnd, entries, summary);
    } catch (error) {
      console.error('Failed to generate weekly report:', error);
      throw error;
    }
  }

  /**
   * Get stored weekly reports
   */
  async getStoredWeeklyReports(limit: number = 10): Promise<StoredWeeklyReport[]> {
    try {
      const { data: reports, error } = await supabase
        .from('weekly_reports')
        .select('*')
        .order('generated_at', { ascending: false })
        .limit(limit);

      if (error) {
        if (error.code === 'PGRST205') {
          console.log('Weekly reports table not found. This feature requires database setup.');
          return [];
        }
        throw error;
      }

      return reports?.map(report => ({
        id: report.id,
        weekStart: report.week_start,
        weekEnd: report.week_end,
        totalUpdates: report.total_updates,
        uniqueMembers: report.unique_members,
        reportData: report.report_data ? WeeklyReport.fromJSON(report.report_data) : new WeeklyReport('', '', [], new WeeklyReportSummary([], [], [], '', [], {})),
        generatedAt: report.generated_at,
        status: report.status,
        error: report.error,
        createdAt: report.created_at,
        updatedAt: report.updated_at
      })).filter(report => report.reportData) || [];
    } catch (error) {
      console.error('Failed to get stored weekly reports:', error);
      return [];
    }
  }

  /**
   * Save a weekly report
   */
  async saveWeeklyReport(report: WeeklyReport): Promise<void> {
    try {
      const { error } = await supabase
        .from('weekly_reports')
        .upsert({
          week_start: report.weekStart,
          week_end: report.weekEnd,
          total_updates: report.getTotalUpdates(),
          unique_members: report.getUniqueMembers(),
          report_data: report.toJSON(),
          status: 'generated',
          generated_at: new Date().toISOString()
        }, {
          onConflict: 'week_start,week_end'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to save weekly report:', error);
      throw error;
    }
  }

  // Private helper methods
  private getVancouverDate(date: Date = new Date()): string {
    return date.toLocaleDateString('en-CA', {
      timeZone: this.VANCOUVER_TIMEZONE
    });
  }

  private getPreviousBusinessDay(): string {
    const today = new Date();
    const dayOfWeek = today.getDay();
    
    let targetDate: Date;
    
    if (dayOfWeek === 1) { // Monday
      targetDate = new Date(today);
      targetDate.setDate(today.getDate() - 3);
    } else if (dayOfWeek === 0) { // Sunday
      targetDate = new Date(today);
      targetDate.setDate(today.getDate() - 2);
    } else { // Tuesday through Saturday
      targetDate = new Date(today);
      targetDate.setDate(today.getDate() - 1);
    }
    
    return this.getVancouverDate(targetDate);
  }

  private getWeekStartDate(): string {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysToMonday);
    
    return this.getVancouverDate(monday);
  }

  private extractDateFromTimestamp(timestamp: string): string {
    return timestamp.split('T')[0];
  }

  private async getOrCreateStandupEntry(date: string) {
    const { data: entries, error: entryError } = await supabase
      .from('standup_entries')
      .select('*')
      .eq('date', date);

    if (entryError) throw entryError;

    let standupEntry = entries?.[0];

    if (!standupEntry) {
      const { data: newEntry, error: createError } = await supabase
        .from('standup_entries')
        .insert({ date })
        .select()
        .single();

      if (createError) throw createError;
      standupEntry = newEntry;
    }

    return standupEntry;
  }

  private transformUpdateToTeamMember(update: Record<string, unknown>, member: Record<string, unknown>): TeamMember {
    return new TeamMember(
      member.id as string,
      member.name as string,
      member.role as string,
      member.avatar as string,
      (update.yesterday as string) || '',
      (update.today as string) || '',
      (update.blockers as string) || '',
      (update.created_at as string) || (member.updated_at as string) || new Date().toISOString()
    );
  }

  private generateBasicSummary(entries: StandupEntry[]): WeeklyReportSummary {
    const allAccomplishments: string[] = [];
    const allOngoingWork: string[] = [];
    const allBlockers: string[] = [];
    const memberSummaries: Record<string, MemberSummary> = {};

    // Collect unique team members
    const uniqueMembers = new Map<string, { role: string; accomplishments: string[]; ongoingWork: string[]; blockers: string[] }>();

    entries.forEach(entry => {
      entry.teamMembers.forEach(member => {
        if (!uniqueMembers.has(member.name)) {
          uniqueMembers.set(member.name, {
            role: member.role,
            accomplishments: [],
            ongoingWork: [],
            blockers: []
          });
        }

        const memberData = uniqueMembers.get(member.name)!;

        if (member.yesterday && member.yesterday.trim()) {
          allAccomplishments.push(`${member.name}: ${member.yesterday}`);
          memberData.accomplishments.push(member.yesterday);
        }
        if (member.today && member.today.trim()) {
          allOngoingWork.push(`${member.name}: ${member.today}`);
          memberData.ongoingWork.push(member.today);
        }
        if (member.blockers && member.blockers.trim()) {
          allBlockers.push(`${member.name}: ${member.blockers}`);
          memberData.blockers.push(member.blockers);
        }
      });
    });

    // Generate member summaries
    uniqueMembers.forEach((data, memberName) => {
      memberSummaries[memberName] = new MemberSummary(
        data.role,
        data.accomplishments.slice(0, 5),
        `Completed ${data.accomplishments.length} tasks, with ${data.ongoingWork.length} ongoing items`,
        data.blockers,
        data.ongoingWork.length > 0 ? data.ongoingWork[data.ongoingWork.length - 1] : 'No specific focus identified'
      );
    });

    return new WeeklyReportSummary(
      allAccomplishments.slice(0, 10),
      allOngoingWork.slice(0, 10),
      allBlockers.slice(0, 10),
      `Generated basic summary for ${entries.length} days with ${allAccomplishments.length} accomplishments, ${allOngoingWork.length} ongoing tasks, and ${allBlockers.length} blockers.`,
      [],
      memberSummaries
    );
  }
}
