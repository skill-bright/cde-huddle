import { supabase, supabaseService } from '../lib/supabase';

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
 * Check if it's Friday at 12 PM PST (with a 5-minute window)
 */
const isFridayAtNoon = () => {
  const vancouverTime = new Date(getVancouverTime());
  const dayOfWeek = vancouverTime.getDay(); // 0 = Sunday, 5 = Friday
  const hour = vancouverTime.getHours();
  const minute = vancouverTime.getMinutes();
  
  // Allow a 5-minute window around 12 PM (11:55 AM to 12:05 PM)
  const isFriday = dayOfWeek === 5;
  const isAroundNoon = (hour === 11 && minute >= 55) || (hour === 12 && minute <= 5);
  
  return isFriday && isAroundNoon;
};

/**
 * Get the start and end dates for the current week (Monday to Sunday)
 * This is used for generating weekly reports on Friday
 */
const getCurrentWeekDates = () => {
  // Use Vancouver timezone for consistent date calculation
  const vancouverTime = new Date(getVancouverTime());
  const dayOfWeek = vancouverTime.getDay();
  
  // Calculate days to Monday (0=Sunday, 1=Monday, ..., 6=Saturday)
  // If today is Sunday (0), we want 6 days back to get to Monday
  // If today is Monday (1), we want 0 days back
  // If today is Tuesday (2), we want 1 day back
  // If today is Friday (5), we want 4 days back
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  // Get the Monday of the current week
  const currentMonday = new Date(vancouverTime);
  currentMonday.setDate(vancouverTime.getDate() - daysToMonday);
  
  // Use today as the end date (since we're generating the report on Friday)
  const currentEnd = new Date(vancouverTime);
  
  return {
    weekStart: currentMonday.toISOString().split('T')[0],
    weekEnd: currentEnd.toISOString().split('T')[0]
  };
};

/**
 * Get the start and end dates for the previous week (Monday to Sunday)
 * This is used for manual report generation or fixing missing reports
 */
const getPreviousWeekDates = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  // Get the Monday of the current week
  const currentMonday = new Date(today);
  currentMonday.setDate(today.getDate() - daysToMonday);
  
  // Get the Monday of the previous week
  const previousMonday = new Date(currentMonday);
  previousMonday.setDate(currentMonday.getDate() - 7);
  
  // Get the Sunday of the previous week
  const previousSunday = new Date(previousMonday);
  previousSunday.setDate(previousMonday.getDate() + 6);
  
  return {
    weekStart: previousMonday.toISOString().split('T')[0],
    weekEnd: previousSunday.toISOString().split('T')[0]
  };
};

/**
 * Generate a weekly report with AI if available, otherwise use basic generation
 */
const generateWeeklyReportWithAI = async (weekStart: string, weekEnd: string): Promise<unknown> => {
  try {
    // First try to generate with AI
    const basicReport = await generateBasicWeeklyReport(weekStart, weekEnd) as any;
    
    // If we have entries, try AI generation
    if (basicReport.entries && basicReport.entries.length > 0) {
      try {
        const { generateWeeklySummary } = await import('./aiUtils');
        const aiSummary = await generateWeeklySummary({
          weekStart,
          weekEnd,
          entries: basicReport.entries
        });
        
        return {
          ...basicReport,
          summary: aiSummary
        };
      } catch (aiError) {
        console.error('AI generation failed, using basic summary:', aiError);
        // Fall back to basic summary
        return basicReport;
      }
    }
    
    return basicReport;
  } catch (error) {
    console.error('Error generating weekly report:', error);
    throw error;
  }
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

    // Generate member summaries
    const memberSummaries: Record<string, any> = {};
    const memberDataMap = new Map<string, { role: string; accomplishments: string[]; ongoingWork: string[]; blockers: string[] }>();

    entries.forEach(entry => {
      entry.teamMembers.forEach(member => {
        if (!memberDataMap.has(member.name)) {
          memberDataMap.set(member.name, {
            role: member.role,
            accomplishments: [],
            ongoingWork: [],
            blockers: []
          });
        }

        const memberData = memberDataMap.get(member.name)!;

        if (member.yesterday && member.yesterday.trim()) {
          memberData.accomplishments.push(member.yesterday);
        }
        if (member.today && member.today.trim()) {
          memberData.ongoingWork.push(member.today);
        }
        if (member.blockers && member.blockers.trim()) {
          memberData.blockers.push(member.blockers);
        }
      });
    });

    // Generate member summaries
    memberDataMap.forEach((data, memberName) => {
      memberSummaries[memberName] = {
        role: data.role,
        keyContributions: data.accomplishments.slice(0, 5), // Top 5 accomplishments
        progress: `Completed ${data.accomplishments.length} tasks, with ${data.ongoingWork.length} ongoing items`,
        concerns: data.blockers,
        nextWeekFocus: data.ongoingWork.length > 0 ? data.ongoingWork[data.ongoingWork.length - 1] : 'No specific focus identified'
      };
    });

    console.log('📊 Scheduler generated member summaries:', {
      memberCount: memberDataMap.size,
      memberNames: Array.from(memberDataMap.keys()),
      memberSummaries: Object.keys(memberSummaries)
    });

    const summary = {
      keyAccomplishments: allAccomplishments.slice(0, 10),
      ongoingWork: allOngoingWork.slice(0, 10),
      blockers: allBlockers.slice(0, 10),
      teamInsights: `Auto-generated basic summary for ${entries.length} days with ${allAccomplishments.length} accomplishments, ${allOngoingWork.length} ongoing tasks, and ${allBlockers.length} blockers.`,
      recommendations: [],
      memberSummaries
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const saveWeeklyReport = async (report: any): Promise<void> => {
  try {
    // Use service role client if available, otherwise fall back to regular client
    const client = supabaseService || supabase;
    
    const { error } = await client
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

    if (error) {
      // Check if the error is due to missing table
      if (error.code === 'PGRST205') {
        console.log('Weekly reports table not found. Skipping report save.');
        return;
      }
      throw error;
    }
  } catch (error) {
    console.error('Error saving weekly report:', error);
    // Don't throw error for missing table, just log it
    if (error && typeof error === 'object' && 'code' in error && error.code !== 'PGRST205') {
      throw error;
    }
  }
};

/**
 * Check if a report already exists for the given week
 */
const checkExistingReport = async (weekStart: string, weekEnd: string): Promise<boolean> => {
  try {
    // Use service role client if available, otherwise fall back to regular client
    const client = supabaseService || supabase;

    console.log('Checking existing report for week:', weekStart, weekEnd);
    
    const { data, error } = await client
      .from('weekly_reports')
      .select('id')
      .eq('week_start', weekStart)
      .eq('week_end', weekEnd)
      .single();

    if (error) {
      // Check if the error is due to missing table
      if (error.code === 'PGRST205') {
        console.log('Weekly reports table not found. Skipping duplicate check.');
        return false;
      }
      // PGRST116 = no rows returned
      if (error.code !== 'PGRST116') {
        throw error;
      }
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
    const vancouverTime = new Date(getVancouverTime());
    const dayOfWeek = vancouverTime.getDay();
    const hour = vancouverTime.getHours();
    const minute = vancouverTime.getMinutes();
    
    console.log(`Scheduler check: Day ${dayOfWeek} (${dayOfWeek === 5 ? 'Friday' : 'Not Friday'}), Time ${hour}:${minute.toString().padStart(2, '0')}`);
    
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
    
    // Generate the report with AI if available
    const report = await generateWeeklyReportWithAI(weekStart, weekEnd);
    
    // Save to database
    await saveWeeklyReport(report);
    
    console.log('Weekly report generated and saved successfully');
    
  } catch (error) {
    console.error('Error in automatic weekly report generation:', error);
    
    // Save error to database (only if no report exists for this week)
    try {
      const { weekStart, weekEnd } = getPreviousWeekDates();
      
      // Check if report already exists before trying to save error
      const reportExists = await checkExistingReport(weekStart, weekEnd);
      if (reportExists) {
        console.log('Weekly report already exists for this week, skipping error save.');
        return;
      }
      
      const client = supabaseService || supabase;
      
      const { error: saveError } = await client
        .from('weekly_reports')
        .insert({
          week_start: weekStart,
          week_end: weekEnd,
          generated_at: new Date().toISOString(),
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      
      if (saveError && saveError.code === 'PGRST205') {
        console.log('Weekly reports table not found. Skipping error save.');
      } else if (saveError) {
        console.error('Error saving failed report:', saveError);
      }
    } catch (saveError) {
      console.error('Error saving failed report:', saveError);
    }
  }
};

/**
 * Manual trigger to generate weekly report for the previous week
 */
export const generateWeeklyReportManually = async (): Promise<void> => {
  try {
    console.log('Manually triggering weekly report generation...');
    
    const { weekStart, weekEnd } = getPreviousWeekDates();
    
    // Check if report already exists for this week
    const reportExists = await checkExistingReport(weekStart, weekEnd);
    if (reportExists) {
      console.log('Weekly report already exists for this week');
      return;
    }

    console.log(`Generating weekly report for ${weekStart} to ${weekEnd}...`);
    
    // Generate the report with AI if available
    const report = await generateWeeklyReportWithAI(weekStart, weekEnd);
    
    // Save to database
    await saveWeeklyReport(report);
    
    console.log('Weekly report generated and saved successfully');
    
  } catch (error) {
    console.error('Error in manual weekly report generation:', error);
    
    // Save error to database (only if no report exists for this week)
    try {
      const { weekStart, weekEnd } = getPreviousWeekDates();
      
      // Check if report already exists before trying to save error
      const reportExists = await checkExistingReport(weekStart, weekEnd);
      if (reportExists) {
        console.log('Weekly report already exists for this week, skipping error save.');
        return;
      }
      
      const client = supabaseService || supabase;
      
      const { error: saveError } = await client
        .from('weekly_reports')
        .insert({
          week_start: weekStart,
          week_end: weekEnd,
          generated_at: new Date().toISOString(),
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      
      if (saveError && saveError.code === 'PGRST205') {
        console.log('Weekly reports table not found. Skipping error save.');
      } else if (saveError) {
        console.error('Error saving failed report:', saveError);
      }
    } catch (saveError) {
      console.error('Error saving failed report:', saveError);
    }
  }
};

/**
 * Manual trigger to generate weekly report for the current week
 */
export const generateCurrentWeekReportManually = async (): Promise<void> => {
  try {
    console.log('Manually triggering current week report generation...');
    
    const { weekStart, weekEnd } = getCurrentWeekDates();
    
    // Check if report already exists for this week
    const reportExists = await checkExistingReport(weekStart, weekEnd);
    if (reportExists) {
      console.log('Weekly report already exists for this week');
      return;
    }

    console.log(`Generating weekly report for ${weekStart} to ${weekEnd}...`);
    
    // Generate the report with AI if available
    const report = await generateWeeklyReportWithAI(weekStart, weekEnd);
    
    // Save to database
    await saveWeeklyReport(report);
    
    console.log('Weekly report generated and saved successfully');
    
  } catch (error) {
    console.error('Error generating current week report manually:', error);
    
    // Save error to database (only if no report exists for this week)
    try {
      const { weekStart, weekEnd } = getCurrentWeekDates();
      
      // Check if report already exists before trying to save error
      const reportExists = await checkExistingReport(weekStart, weekEnd);
      if (reportExists) {
        console.log('Weekly report already exists for this week, skipping error save.');
        return;
      }
      
      const client = supabaseService || supabase;
      
      const { error: saveError } = await client
        .from('weekly_reports')
        .insert({
          week_start: weekStart,
          week_end: weekEnd,
          generated_at: new Date().toISOString(),
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      
      if (saveError && saveError.code === 'PGRST205') {
        console.log('Weekly reports table not found. Skipping error save.');
      } else if (saveError) {
        console.error('Error saving failed report:', saveError);
      }
    } catch (saveError) {
      console.error('Error saving failed report to database:', saveError);
    }
  }
};

/**
 * Generate a report for a specific week (for fixing missing reports)
 */
export const generateReportForWeek = async (weekStart: string, weekEnd: string): Promise<void> => {
  try {
    console.log(`Generating report for specific week: ${weekStart} to ${weekEnd}`);
    
    // Check if report already exists for this week
    const reportExists = await checkExistingReport(weekStart, weekEnd);
    if (reportExists) {
      console.log('Weekly report already exists for this week');
      return;
    }

    // Generate the report with AI if available
    const report = await generateWeeklyReportWithAI(weekStart, weekEnd);
    
    // Save to database
    await saveWeeklyReport(report);
    
    console.log('Weekly report generated and saved successfully');
    
  } catch (error) {
    console.error('Error generating report for specific week:', error);
    throw error;
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
