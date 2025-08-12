import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TeamMember, StandupEntry } from '../types';

export function useStandupData() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [standupHistory, setStandupHistory] = useState<StandupEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch today's standup data
  const fetchTodayStandup = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get or create today's standup entry
      let { data: standupEntries, error: entryError } = await supabase
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

      // Fetch all team members with their updates for today
      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select(`
          *,
          standup_updates!inner(
            yesterday,
            today,
            blockers,
            updated_at
          )
        `)
        .eq('standup_updates.standup_entry_id', standupEntry.id);

      if (membersError) throw membersError;

      // Also fetch team members without updates for today
      const { data: allMembers, error: allMembersError } = await supabase
        .from('team_members')
        .select('*');

      if (allMembersError) throw allMembersError;

      // Combine members with and without updates
      const membersWithUpdates = members?.map(member => ({
        id: member.id,
        name: member.name,
        role: member.role,
        avatar: member.avatar,
        yesterday: member.standup_updates[0]?.yesterday || '',
        today: member.standup_updates[0]?.today || '',
        blockers: member.standup_updates[0]?.blockers || '',
        lastUpdated: member.standup_updates[0]?.updated_at || member.updated_at
      })) || [];

      const membersWithoutUpdates = allMembers?.filter(member => 
        !membersWithUpdates.find(m => m.id === member.id)
      ).map(member => ({
        id: member.id,
        name: member.name,
        role: member.role,
        avatar: member.avatar,
        yesterday: '',
        today: '',
        blockers: '',
        lastUpdated: member.updated_at
      })) || [];

      setTeamMembers([...membersWithUpdates, ...membersWithoutUpdates]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch standup data');
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

      const history: StandupEntry[] = entries?.map(entry => ({
        id: entry.id,
        date: entry.date,
        teamMembers: entry.standup_updates.map((update: any) => ({
          id: update.team_members.id,
          name: update.team_members.name,
          role: update.team_members.role,
          avatar: update.team_members.avatar,
          yesterday: update.yesterday,
          today: update.today,
          blockers: update.blockers,
          lastUpdated: update.updated_at
        })),
        createdAt: entry.created_at
      })) || [];

      setStandupHistory(history);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch standup history');
    }
  };

  // Save or update team member
  const saveMember = async (member: TeamMember) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get or create today's standup entry
      let { data: standupEntries, error: entryError } = await supabase
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
      await Promise.all([fetchTodayStandup(), fetchStandupHistory()]);
      setLoading(false);
    };

    initializeData();
  }, []);

  return {
    teamMembers,
    standupHistory,
    loading,
    error,
    saveMember,
    refreshData: () => Promise.all([fetchTodayStandup(), fetchStandupHistory()])
  };
}