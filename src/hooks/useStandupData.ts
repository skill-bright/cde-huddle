import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TeamMember, StandupEntry, WeeklyReport, WeeklyReportFilters, StoredWeeklyReport } from '../types';
import { generateWeeklySummary } from '../utils/aiUtils';
import { startWeeklyReportScheduler, generateWeeklyReportManually } from '../utils/scheduler';

// ============================================================================
// DATE UTILITIES
// ============================================================================

const VANCOUVER_TIMEZONE = 'America/Vancouver';

/**
 * Get a date in Vancouver timezone as YYYY-MM-DD string
 */
const getVancouverDate = (date: Date = new Date()) => {
  return date.toLocaleDateString('en-CA', {
    timeZone: VANCOUVER_TIMEZONE
  });
};

/**
 * Get the previous business day date
 * - Monday → Friday (3 days back)
 * - Sunday → Friday (2 days back) 
 * - Other days → Yesterday (1 day back)
 */
const getPreviousBusinessDay = () => {
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
  
  return getVancouverDate(targetDate);
};

/**
 * Get the start of current week (Monday) in Vancouver timezone
 */
const getWeekStartDate = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysToMonday);
  
  return getVancouverDate(monday);
};

/**
 * Extract date part (YYYY-MM-DD) from a timestamp string
 */
const extractDateFromTimestamp = (timestamp: string) => {
  return timestamp.split('T')[0];
};

// ============================================================================
// DATABASE UTILITIES
// ============================================================================

/**
 * Get or create a standup entry for a specific date
 */
const getOrCreateStandupEntry = async (date: string) => {
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
};

/**
 * Transform database update to TeamMember format
 */
const transformUpdateToTeamMember = (update: { yesterday?: string; today?: string; blockers?: string; created_at?: string }, member: { id: string; name: string; role: string; avatar: string; updated_at?: string }): TeamMember => ({
  id: member.id,
  name: member.name,
  role: member.role,
  avatar: member.avatar,
  yesterday: update.yesterday || '',
  today: update.today || '',
  blockers: update.blockers || '',
  lastUpdated: update.created_at || member.updated_at || new Date().toISOString()
});



// ============================================================================
// MAIN HOOK
// ============================================================================

export function useStandupData() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [standupHistory, setStandupHistory] = useState<StandupEntry[]>([]);
  const [yesterdayCount, setYesterdayCount] = useState(0);
  const [teamEngagement, setTeamEngagement] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Weekly report state
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [weeklyReportLoading, setWeeklyReportLoading] = useState(false);
  const [weeklyReportError, setWeeklyReportError] = useState<string | null>(null);
  const [storedWeeklyReports, setStoredWeeklyReports] = useState<StoredWeeklyReport[]>([]);
  const [storedReportsLoading, setStoredReportsLoading] = useState(false);

  // ============================================================================
  // FETCH FUNCTIONS
  // ============================================================================

  const fetchTodayStandup = async () => {
    try {
      const today = getVancouverDate();
      const standupEntry = await getOrCreateStandupEntry(today);

      // Fetch team members with today's updates
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
        transformUpdateToTeamMember(member.standup_updates[0], member)
      ) || [];

      setTeamMembers(membersWithUpdates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch standup data');
    }
  };

  const fetchYesterdayCount = async () => {
    try {
      const targetDate = getPreviousBusinessDay();

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
        setYesterdayCount(targetDateUpdates.length);
      } else {
        setYesterdayCount(0);
      }
    } catch {
      setYesterdayCount(0);
    }
  };

  const fetchTeamEngagement = async () => {
    try {
      const weekStart = getWeekStartDate();

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
          setTeamEngagement(uniqueMemberIds.length);
        } else {
          setTeamEngagement(0);
        }
      } else {
        setTeamEngagement(0);
      }
    } catch {
      setTeamEngagement(0);
    }
  };

  const fetchStandupHistory = async () => {
    try {
      const today = getVancouverDate();
      
      // Fetch updates with their associated standup entries and team members
      // Exclude today's updates from history
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
        .limit(50);

      if (updatesError) {
        throw updatesError;
      }
      
      if (!updates || updates.length === 0) {
        setStandupHistory([]);
        return;
      }

      // Group by the actual submission date (when the update was created)
      const updatesByDate = new Map<string, typeof updates>();
      
      updates.forEach(update => {
        const submissionDate = extractDateFromTimestamp(update.created_at);
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
        .map(([date, dateUpdates]) => ({
          id: `date-${date}`,
          date,
          teamMembers: dateUpdates.map((update) => ({
            id: update.team_member_id,
            name: update.team_members?.name || `Team Member ${update.team_member_id.slice(0, 8)}`,
            role: update.team_members?.role || 'Developer',
            avatar: update.team_members?.avatar || '',
            yesterday: update.yesterday || '',
            today: update.today || '',
            blockers: update.blockers || '',
            lastUpdated: update.created_at || update.updated_at
          })),
          createdAt: dateUpdates[0]?.created_at || date
        }));

      setStandupHistory(history);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch standup history');
    }
  };

  // ============================================================================
  // SAVE FUNCTION
  // ============================================================================

  const saveMember = async (member: TeamMember) => {
    try {
      const today = getVancouverDate();
      const standupEntry = await getOrCreateStandupEntry(today);

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

      // Refresh data
      await Promise.all([
        fetchTodayStandup(),
        fetchYesterdayCount(),
        fetchTeamEngagement(),
        fetchStandupHistory()
      ]);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to save member');
    }
  };

  // ============================================================================
  // WEEKLY REPORT FUNCTIONS
  // ============================================================================

  const generateWeeklyReport = async (filters: WeeklyReportFilters = { includeAI: true }) => {
    try {
      setWeeklyReportLoading(true);
      setWeeklyReportError(null);

      // Determine week range
      const weekStart = filters.weekStart || getWeekStartDate();
      const weekEnd = filters.weekEnd || getVancouverDate();

      // Fetch all standup entries for the week
      const { data: weekEntries, error: entriesError } = await supabase
        .from('standup_entries')
        .select('id, date')
        .gte('date', weekStart)
        .lte('date', weekEnd)
        .order('date', { ascending: true });

      if (entriesError) throw entriesError;

      if (!weekEntries || weekEntries.length === 0) {
        setWeeklyReport({
          weekStart,
          weekEnd,
          totalUpdates: 0,
          uniqueMembers: 0,
          entries: [],
                  summary: {
          keyAccomplishments: [],
          ongoingWork: [],
          blockers: [],
          teamInsights: 'No standup data available for this week.',
          recommendations: [],
          memberSummaries: {}
        }
        });
        return;
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
        .map(([date, dateUpdates]) => ({
          id: `weekly-${date}`,
          date,
          teamMembers: dateUpdates.map((update) => ({
            id: update.team_member_id,
            name: update.team_members?.name || `Team Member ${update.team_member_id.slice(0, 8)}`,
            role: update.team_members?.role || 'Developer',
            avatar: update.team_members?.avatar || '',
            yesterday: update.yesterday || '',
            today: update.today || '',
            blockers: update.blockers || '',
            lastUpdated: update.created_at || update.updated_at
          })),
          createdAt: dateUpdates[0]?.created_at || date
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Calculate statistics
      const totalUpdates = updates?.length || 0;
      
      // Count unique members by their actual identity (name + role combination)
      const uniqueMembersSet = new Set<string>();
      updates?.forEach(update => {
        const memberName = update.team_members?.name || `Team Member ${update.team_member_id.slice(0, 8)}`;
        const memberRole = update.team_members?.role || 'Developer';
        uniqueMembersSet.add(`${memberName} (${memberRole})`);
      });
      const uniqueMembers = uniqueMembersSet.size;

      // Generate AI summary if requested
      let summary;
      if (filters.includeAI && entries.length > 0) {
        try {
          summary = await generateWeeklySummary({
            weekStart,
            weekEnd,
            entries,
            customPrompt: filters.customPrompt
          });
        } catch (aiError) {
          console.error('AI summary generation failed:', aiError);
          summary = {
            keyAccomplishments: [],
            ongoingWork: [],
            blockers: [],
            teamInsights: 'AI summary generation failed. Please review the data manually.',
            recommendations: [],
            memberSummaries: {}
          };
        }
      } else {
        // Generate basic summary without AI
        summary = generateBasicSummary(entries);
      }

      const report: WeeklyReport = {
        weekStart,
        weekEnd,
        totalUpdates,
        uniqueMembers,
        entries,
        summary
      };

      setWeeklyReport(report);
    } catch (err) {
      setWeeklyReportError(err instanceof Error ? err.message : 'Failed to generate weekly report');
    } finally {
      setWeeklyReportLoading(false);
    }
  };

  const generateBasicSummary = (entries: StandupEntry[]) => {
    const allAccomplishments: string[] = [];
    const allOngoingWork: string[] = [];
    const allBlockers: string[] = [];

    entries.forEach(entry => {
      entry.teamMembers.forEach(member => {
        if (member.yesterday && member.yesterday.trim()) {
          allAccomplishments.push(`${member.name}: ${member.yesterday}`);
        }
        if (member.today && member.today.trim()) {
          allOngoingWork.push(`${member.name}: ${member.today}`);
        }
        if (member.blockers && member.blockers.trim()) {
          allBlockers.push(`${member.name}: ${member.blockers}`);
        }
      });
    });

    return {
      keyAccomplishments: allAccomplishments.slice(0, 10), // Limit to top 10
      ongoingWork: allOngoingWork.slice(0, 10),
      blockers: allBlockers.slice(0, 10),
      teamInsights: `Generated basic summary for ${entries.length} days with ${allAccomplishments.length} accomplishments, ${allOngoingWork.length} ongoing tasks, and ${allBlockers.length} blockers.`,
      recommendations: [],
      memberSummaries: {}
    };
  };

  const getPreviousWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - daysToMonday - 7);
    
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
    
    return {
      weekStart: getVancouverDate(lastMonday),
      weekEnd: getVancouverDate(lastSunday)
    };
  };

  const fetchStoredWeeklyReports = async () => {
    try {
      setStoredReportsLoading(true);
      
      const { data: reports, error } = await supabase
        .from('weekly_reports')
        .select('*')
        .order('generated_at', { ascending: false })
        .limit(10);

      if (error) {
        // Check if the error is due to missing table
        if (error.code === 'PGRST205') {
          console.log('Weekly reports table not found. This feature requires database setup.');
          setStoredWeeklyReports([]);
          return;
        }
        throw error;
      }

      const formattedReports: StoredWeeklyReport[] = reports?.map(report => ({
        id: report.id,
        weekStart: report.week_start,
        weekEnd: report.week_end,
        totalUpdates: report.total_updates,
        uniqueMembers: report.unique_members,
        reportData: report.report_data,
        generatedAt: report.generated_at,
        status: report.status,
        error: report.error,
        createdAt: report.created_at,
        updatedAt: report.updated_at
      })) || [];

      setStoredWeeklyReports(formattedReports);
    } catch (err) {
      console.error('Failed to fetch stored weekly reports:', err);
      setStoredWeeklyReports([]);
    } finally {
      setStoredReportsLoading(false);
    }
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          fetchTodayStandup(),
          fetchYesterdayCount(),
          fetchTeamEngagement(),
          fetchStandupHistory(),
          fetchStoredWeeklyReports()
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    
    // Start the weekly report scheduler
    startWeeklyReportScheduler();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchTodayStandup(),
        fetchYesterdayCount(),
        fetchTeamEngagement(),
        fetchStandupHistory()
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  return {
    teamMembers,
    standupHistory,
    yesterdayCount,
    teamEngagement,
    loading,
    error,
    saveMember,
    refreshData,
    // Weekly report functions
    weeklyReport,
    weeklyReportLoading,
    weeklyReportError,
    setWeeklyReport,
    generateWeeklyReport,
    generateWeeklyReportManually,
    getPreviousWeekDates,
    // Stored weekly reports
    storedWeeklyReports,
    storedReportsLoading,
    fetchStoredWeeklyReports,
  };
}