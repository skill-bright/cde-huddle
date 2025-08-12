import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TeamMember, StandupEntry } from '../types';

// Helper function to get today's date in Vancouver timezone
const getVancouverDate = () => {
  return new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Vancouver'
  });
};

// Helper function to get yesterday's date in Vancouver timezone
const getYesterdayDate = () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  return yesterday.toLocaleDateString('en-CA', {
    timeZone: 'America/Vancouver'
  });
};



// Helper function to get the start of current week (Monday) in Vancouver timezone
const getWeekStartDate = () => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Days to go back to Monday

  const monday = new Date(today);
  monday.setDate(today.getDate() - daysToMonday);

  return monday.toLocaleDateString('en-CA', {
    timeZone: 'America/Vancouver'
  });
};

export function useStandupData() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [standupHistory, setStandupHistory] = useState<StandupEntry[]>([]);
  const [yesterdayCount, setYesterdayCount] = useState(0);
  const [teamEngagement, setTeamEngagement] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch today's standup data
  const fetchTodayStandup = async () => {
    try {
      const today = getVancouverDate();

      // Get or create today's standup entry
      const { data: standupEntries, error: entryError } = await supabase
        .from('standup_entries')
        .select('*')
        .eq('date', today);

      if (entryError) {
        throw entryError;
      }

      let standupEntry = standupEntries?.[0];

      if (!standupEntry) {
        // Create today's entry if it doesn't exist
        const { data: newEntry, error: createError } = await supabase
          .from('standup_entries')
          .insert({ date: today })
          .select()
          .single();

        if (createError) throw createError;
        standupEntry = newEntry;
      }

      // Fetch only team members who have submitted updates for today
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

      // Only show members who have actually submitted updates for today
      const membersWithUpdates = members?.map(member => ({
        id: member.id,
        name: member.name,
        role: member.role,
        avatar: member.avatar,
        yesterday: member.standup_updates[0]?.yesterday || '',
        today: member.standup_updates[0]?.today || '',
        blockers: member.standup_updates[0]?.blockers || '',
        lastUpdated: member.standup_updates[0]?.created_at || member.updated_at,
        created_at: member.standup_updates[0]?.created_at || null
      })) || [];

      setTeamMembers(membersWithUpdates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch standup data');
    }
  };

  // Fetch yesterday's standup count
  const fetchYesterdayCount = async () => {
    try {
      const yesterday = getYesterdayDate();

      // Get yesterday's standup entry by creation date, not by date field
      const { data: yesterdayEntries } = await supabase
        .from('standup_entries')
        .select('id')
        .gte('created_at', `${yesterday}T00:00:00-08:00`)
        .lt('created_at', `${yesterday}T23:59:59-08:00`);

      if (yesterdayEntries && yesterdayEntries.length > 0) {
        // Get the actual updates to see what's there
        const { data: updates } = await supabase
          .from('standup_updates')
          .select('*')
          .eq('standup_entry_id', yesterdayEntries[0].id);

        // Filter updates to only include those created yesterday
        const yesterdayUpdates = updates?.filter(update => {
          // Extract just the date part from the timestamp (YYYY-MM-DD)
          const updateDateStr = update.created_at.split('T')[0];
          return updateDateStr === yesterday;
        }) || [];

        setYesterdayCount(yesterdayUpdates.length);
      } else {
        setYesterdayCount(0);
      }
    } catch (err) {
      console.error('Error fetching yesterday count:', err);
      setYesterdayCount(0);
    }
  };

  // Fetch team engagement (unique team members who submitted updates this week)
  const fetchTeamEngagement = async () => {
    try {
      const weekStart = getWeekStartDate();

      // Get all standup entries from this week
      const { data: weekEntries } = await supabase
        .from('standup_entries')
        .select('id')
        .gte('date', weekStart);

      if (weekEntries && weekEntries.length > 0) {
        const entryIds = weekEntries.map(entry => entry.id);

        // Count unique team members who submitted updates this week
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

  // Fetch standup history
  const fetchStandupHistory = async () => {
    try {
      const { data: entries, error: entriesError } = await supabase
        .from('standup_entries')
        .select(`
          *,
          standup_updates(
            *,
            team_members(*)
          )
        `)
        .order('date', { ascending: false })
        .limit(10);

      if (entriesError) throw entriesError;

      const history: StandupEntry[] = entries?.map(entry => {
        // Filter updates to only include those created on the same date as the entry
        const entryDate = new Date(entry.date);
        const filteredUpdates = entry.standup_updates.filter((update: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          const updateDate = new Date(update.created_at);
          return updateDate.toDateString() === entryDate.toDateString();
        });

        return {
          id: entry.id,
          date: entry.date,
          teamMembers: filteredUpdates.map((update: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
            id: update.team_members.id,
            name: update.team_members.name,
            role: update.team_members.role,
            avatar: update.team_members.avatar,
            yesterday: update.yesterday,
            today: update.today,
            blockers: update.blockers,
            lastUpdated: update.created_at
          })),
          createdAt: entry.created_at
        };
      }) || [];

      setStandupHistory(history);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch standup history');
    }
  };

  // Save or update team member
  const saveMember = async (member: TeamMember) => {
    try {
      const today = getVancouverDate();

      // Get or create today's standup entry
      const { data: standupEntries, error: entryError } = await supabase
        .from('standup_entries')
        .select('*')
        .eq('date', today);

      if (entryError) {
        throw entryError;
      }

      let standupEntry = standupEntries?.[0];

      if (!standupEntry) {
        const { data: newEntry, error: createError } = await supabase
          .from('standup_entries')
          .insert({ date: today })
          .select()
          .single();

        if (createError) throw createError;
        standupEntry = newEntry;
      }

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

      // Upsert standup update
      const { error: updateError } = await supabase
        .from('standup_updates')
        .upsert({
          standup_entry_id: standupEntry.id,
          team_member_id: member.id,
          yesterday: member.yesterday,
          today: member.today,
          blockers: member.blockers
        }, {
          onConflict: 'standup_entry_id,team_member_id'
        });

      if (updateError) throw updateError;

      // Refresh data
      await fetchTodayStandup();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save member');
      throw err;
    }
  };

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await Promise.all([fetchTodayStandup(), fetchStandupHistory(), fetchYesterdayCount(), fetchTeamEngagement()]);
      setLoading(false);
    };

    initializeData();
  }, []);

  return {
    teamMembers,
    standupHistory,
    yesterdayCount,
    teamEngagement,
    loading,
    error,
    saveMember,
    refreshData: () => Promise.all([fetchTodayStandup(), fetchStandupHistory(), fetchYesterdayCount(), fetchTeamEngagement()])
  };
}