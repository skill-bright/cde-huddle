import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TeamMember, StandupEntry } from '../types';

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
const transformUpdateToTeamMember = (update: any, member: any): TeamMember => ({
  id: member.id,
  name: member.name,
  role: member.role,
  avatar: member.avatar,
  yesterday: update.yesterday || '',
  today: update.today || '',
  blockers: update.blockers || '',
  lastUpdated: update.created_at || member.updated_at
});

/**
 * Group updates by their creation date
 */
const groupUpdatesByDate = (updates: any[]) => {
  const updatesByDate = new Map<string, any[]>();
  
  updates.forEach(update => {
    const updateDate = extractDateFromTimestamp(update.created_at);
    if (!updatesByDate.has(updateDate)) {
      updatesByDate.set(updateDate, []);
    }
    updatesByDate.get(updateDate)!.push(update);
  });
  
  return updatesByDate;
};

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
        .select('*');

      if (updates) {
        const targetDateUpdates = updates.filter(update => 
          extractDateFromTimestamp(update.created_at) === targetDate
        );
        setYesterdayCount(targetDateUpdates.length);
      } else {
        setYesterdayCount(0);
      }
    } catch (err) {
      console.error('Error fetching yesterday count:', err);
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
    } catch (err) {
      console.error('Error fetching team engagement:', err);
      setTeamEngagement(0);
    }
  };

  const fetchStandupHistory = async () => {
    try {
      const { data: updates, error: updatesError } = await supabase
        .from('standup_updates')
        .select(`
          *,
          team_members(*),
          standup_entries(*)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (updatesError) throw updatesError;

      const updatesByDate = groupUpdatesByDate(updates || []);

      const history: StandupEntry[] = Array.from(updatesByDate.entries())
        .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
        .slice(0, 10)
        .map(([date, dateUpdates]) => ({
          id: `date-${date}`,
          date,
          teamMembers: dateUpdates.map(update => 
            transformUpdateToTeamMember(update, update.team_members)
          ),
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
          fetchStandupHistory()
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
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
    refreshData
  };
}