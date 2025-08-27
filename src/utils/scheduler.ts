import { supabase } from '../lib/supabase';

const VANCOUVER_TIMEZONE = 'America/Vancouver';



/**
 * Get the current time in Vancouver timezone
 */
const getVancouverTime = () => {
  return new Date().toLocaleString('en-US', {
    timeZone: VANCOUVER_TIMEZONE
  });
};

/**
 * Check if it's Friday at 12 PM PST
 */
const isFridayAtNoon = () => {
  const vancouverTime = new Date(getVancouverTime());
  const dayOfWeek = vancouverTime.getDay(); // 0 = Sunday, 5 = Friday
  const hour = vancouverTime.getHours();
  const minute = vancouverTime.getMinutes();
  
  return dayOfWeek === 5 && hour === 12 && minute === 0;
};

/**
 * Get the start and end dates for the current week (Monday to Sunday)
 */
const getCurrentWeekDates = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysToMonday);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  return {
    weekStart: monday.toISOString().split('T')[0],
    weekEnd: sunday.toISOString().split('T')[0]
  };
};

/**
 * Generate a basic weekly report without AI
 */
const generateBasicWeeklyReport = async (weekStart: string, weekEnd: string): Promise<unknown> => {
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
      return {
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
      };
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
    const entries = Array.from(updatesByDate.entries())
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

    // Generate basic summary
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

    const summary = {
      keyAccomplishments: allAccomplishments.slice(0, 10),
      ongoingWork: allOngoingWork.slice(0, 10),
      blockers: allBlockers.slice(0, 10),
      teamInsights: `Auto-generated basic summary for ${entries.length} days with ${allAccomplishments.length} accomplishments, ${allOngoingWork.length} ongoing tasks, and ${allBlockers.length} blockers.`,
      recommendations: [],
      memberSummaries: {}
    };

    return {
      weekStart,
      weekEnd,
      totalUpdates,
      uniqueMembers,
      entries,
      summary
    };
  } catch (error) {
    console.error('Error generating basic weekly report:', error);
    throw error;
  }
};

/**
 * Save the generated report to the database
 */
const saveWeeklyReport = async (report: unknown): Promise<void> => {
  try {
    const { error } = await supabase
      .from('weekly_reports')
      .insert({
        week_start: report.weekStart,
        week_end: report.weekEnd,
        total_updates: report.totalUpdates,
        unique_members: report.uniqueMembers,
        report_data: report,
        generated_at: new Date().toISOString(),
        status: 'generated'
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error saving weekly report:', error);
    throw error;
  }
};

/**
 * Check if a report already exists for the given week
 */
const checkExistingReport = async (weekStart: string, weekEnd: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('weekly_reports')
      .select('id')
      .eq('week_start', weekStart)
      .eq('week_end', weekEnd)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking existing report:', error);
    return false;
  }
};

/**
 * Main function to check and generate weekly report
 */
export const checkAndGenerateWeeklyReport = async (): Promise<void> => {
  try {
    // Check if it's Friday at 12 PM PST
    if (!isFridayAtNoon()) {
      return;
    }

    const { weekStart, weekEnd } = getCurrentWeekDates();
    
    // Check if report already exists for this week
    const reportExists = await checkExistingReport(weekStart, weekEnd);
    if (reportExists) {
      console.log('Weekly report already exists for this week');
      return;
    }

    console.log('Generating automatic weekly report...');
    
    // Generate the report
    const report = await generateBasicWeeklyReport(weekStart, weekEnd);
    
    // Save to database
    await saveWeeklyReport(report);
    
    console.log('Weekly report generated and saved successfully');
    
    // Optionally send notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Weekly Report Generated', {
        body: `Weekly report for ${weekStart} to ${weekEnd} has been generated automatically.`,
        icon: '/favicon.ico'
      });
    }
  } catch (error) {
    console.error('Error in automatic weekly report generation:', error);
    
    // Save error to database
    try {
      const { weekStart, weekEnd } = getCurrentWeekDates();
      await supabase
        .from('weekly_reports')
        .insert({
          week_start: weekStart,
          week_end: weekEnd,
          generated_at: new Date().toISOString(),
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
    } catch (saveError) {
      console.error('Error saving failed report:', saveError);
    }
  }
};

/**
 * Start the scheduler
 */
export const startWeeklyReportScheduler = (): void => {
  // Check immediately when the app starts
  checkAndGenerateWeeklyReport();
  
  // Check every minute
  setInterval(checkAndGenerateWeeklyReport, 60 * 1000);
  
  console.log('Weekly report scheduler started');
};

/**
 * Request notification permission
 */
export const requestNotificationPermission = async (): Promise<void> => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};
