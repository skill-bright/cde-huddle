import { useState, useEffect, useCallback, useMemo } from 'react';

import { TeamMember } from '@/domain/entities/TeamMember';
import { StandupEntry } from '@/domain/entities/StandupEntry';
import { WeeklyReport } from '@/domain/entities/WeeklyReport';
import { StoredWeeklyReport } from '@/domain/repositories/StandupRepository';
import { GetTodayStandupUseCase } from '@/application/use-cases/GetTodayStandupUseCase';
import { SaveTeamMemberUpdateUseCase } from '@/application/use-cases/SaveTeamMemberUpdateUseCase';
import { GenerateWeeklyReportUseCase } from '@/application/use-cases/GenerateWeeklyReportUseCase';
import { SupabaseStandupRepository } from '@/infrastructure/repositories/SupabaseStandupRepository';
import { SecureAnthropicAIService } from '@/infrastructure/services/SecureAnthropicAIService';
import { useToast } from './useToast';

/**
 * Custom hook for managing standup data
 * Provides a clean interface for components to interact with standup data
 */
export function useStandupData() {
  // State
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
  
  // Toast notifications
  const { showError, showSuccess } = useToast();

  // Dependencies - memoized to prevent recreation on every render
  const repository = useMemo(() => new SupabaseStandupRepository(), []);
  const aiService = useMemo(() => new SecureAnthropicAIService(), []);
  const getTodayStandupUseCase = useMemo(() => new GetTodayStandupUseCase(repository), [repository]);
  const saveTeamMemberUpdateUseCase = useMemo(() => new SaveTeamMemberUpdateUseCase(repository), [repository]);
  const generateWeeklyReportUseCase = useMemo(() => new GenerateWeeklyReportUseCase(repository, aiService), [repository, aiService]);

  // Fetch functions
  const fetchTodayStandup = useCallback(async () => {
    try {
      const members = await getTodayStandupUseCase.execute();
      setTeamMembers(members);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch today\'s standup');
    }
  }, [getTodayStandupUseCase]);

  const fetchYesterdayCount = useCallback(async () => {
    try {
      const count = await repository.getYesterdayUpdateCount();
      setYesterdayCount(count);
    } catch (err) {
      console.error('Failed to fetch yesterday count:', err);
      setYesterdayCount(0);
    }
  }, [repository]);

  const fetchTeamEngagement = useCallback(async () => {
    try {
      const engagement = await repository.getTeamEngagement();
      setTeamEngagement(engagement);
    } catch (err) {
      console.error('Failed to fetch team engagement:', err);
      setTeamEngagement(0);
    }
  }, [repository]);

  const fetchStandupHistory = useCallback(async () => {
    try {
      const history = await repository.getStandupHistory(50);
      setStandupHistory(history);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch standup history');
    }
  }, [repository]);

  const fetchStoredWeeklyReports = useCallback(async () => {
    try {
      setStoredReportsLoading(true);
      const reports = await repository.getStoredWeeklyReports(10);
      setStoredWeeklyReports(reports);
    } catch (err) {
      console.error('Failed to fetch stored weekly reports:', err);
      setStoredWeeklyReports([]);
    } finally {
      setStoredReportsLoading(false);
    }
  }, [repository]);

  // Save function
  const saveMember = useCallback(async (member: TeamMember) => {
    try {
      await saveTeamMemberUpdateUseCase.execute(member);
      // Refresh data after saving
      await Promise.all([
        fetchTodayStandup(),
        fetchYesterdayCount(),
        fetchTeamEngagement(),
        fetchStandupHistory()
      ]);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to save member');
    }
  }, [saveTeamMemberUpdateUseCase, fetchTodayStandup, fetchYesterdayCount, fetchTeamEngagement, fetchStandupHistory]);

  // Weekly report functions
  const generateWeeklyReport = useCallback(async (weekStart: string, weekEnd: string, includeAI: boolean = true) => {
    try {
      setWeeklyReportLoading(true);
      setWeeklyReportError(null);

      const report = await generateWeeklyReportUseCase.execute(weekStart, weekEnd, includeAI);
      setWeeklyReport(report);
    } catch (err) {
      setWeeklyReportError(err instanceof Error ? err.message : 'Failed to generate weekly report');
    } finally {
      setWeeklyReportLoading(false);
    }
  }, [generateWeeklyReportUseCase]);

  const generateCurrentWeekReportManually = useCallback(async () => {
    console.log('🚀 generateCurrentWeekReportManually called!');
    try {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      const monday = new Date(today);
      monday.setDate(today.getDate() - daysToMonday);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      const weekStart = monday.toLocaleDateString('en-CA', { timeZone: 'America/Vancouver' });
      const weekEnd = sunday.toLocaleDateString('en-CA', { timeZone: 'America/Vancouver' });
      
      console.log(`📅 Generating manual weekly report for ${weekStart} to ${weekEnd}`);
      
      // Generate the report
      const report = await generateWeeklyReportUseCase.execute(weekStart, weekEnd, true);
      console.log('Report generated successfully:', report);
      
      // Save the report to the database
      await repository.saveWeeklyReport(report);
      console.log('Report saved to database successfully');
      
      // Update the UI state
      setWeeklyReport(report);
      
      // Refresh the stored reports list
      await fetchStoredWeeklyReports();
      console.log('Stored reports list refreshed');
      
      // Show success toast
      showSuccess(
        'Weekly Report Generated',
        'Your weekly report has been successfully generated and saved.',
        4000
      );
    } catch (error) {
      console.error('Failed to generate and save weekly report:', error);
      
      // Show error toast with specific message
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate weekly report';
      showError(
        'Report Generation Failed',
        errorMessage,
        8000
      );
      
      throw error;
    }
  }, [generateWeeklyReportUseCase, repository, setWeeklyReport, fetchStoredWeeklyReports, showError, showSuccess]);

  const getPreviousWeekDates = useCallback(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - daysToMonday - 7);
    
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
    
    return {
      weekStart: lastMonday.toLocaleDateString('en-CA', { timeZone: 'America/Vancouver' }),
      weekEnd: lastSunday.toLocaleDateString('en-CA', { timeZone: 'America/Vancouver' })
    };
  }, []);

  const generateLastWeekReportManually = useCallback(async () => {
    console.log('🚀 generateLastWeekReportManually called!');
    try {
      const { weekStart, weekEnd } = getPreviousWeekDates();
      
      console.log(`📅 Generating manual weekly report for last week: ${weekStart} to ${weekEnd}`);
      
      // Generate the report
      const report = await generateWeeklyReportUseCase.execute(weekStart, weekEnd, true);
      console.log('Report generated successfully:', report);
      
      // Save the report to the database
      await repository.saveWeeklyReport(report);
      console.log('Report saved to database successfully');
      
      // Update the UI state
      setWeeklyReport(report);
      
      // Refresh the stored reports list
      await fetchStoredWeeklyReports();
      console.log('Stored reports list refreshed');
      
      // Show success toast
      showSuccess(
        'Last Week Report Generated',
        `Your weekly report for ${weekStart} to ${weekEnd} has been successfully generated and saved.`,
        4000
      );
    } catch (error) {
      console.error('Failed to generate and save last week report:', error);
      
      // Show error toast with specific message
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate last week report';
      showError(
        'Report Generation Failed',
        errorMessage,
        8000
      );
      
      throw error;
    }
  }, [generateWeeklyReportUseCase, repository, setWeeklyReport, fetchStoredWeeklyReports, getPreviousWeekDates, showError, showSuccess]);

  // Refresh function
  const refreshData = useCallback(async () => {
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
  }, [fetchTodayStandup, fetchYesterdayCount, fetchTeamEngagement, fetchStandupHistory]);

  // Effects
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
  }, [fetchTodayStandup, fetchYesterdayCount, fetchTeamEngagement, fetchStandupHistory, fetchStoredWeeklyReports]);

  return {
    // State
    teamMembers,
    standupHistory,
    yesterdayCount,
    teamEngagement,
    loading,
    error,
    
    // Actions
    saveMember,
    refreshData,
    
    // Weekly report state
    weeklyReport,
    weeklyReportLoading,
    weeklyReportError,
    setWeeklyReport,
    generateWeeklyReport,
    generateCurrentWeekReportManually,
    generateLastWeekReportManually,
    getPreviousWeekDates,
    
    // Stored weekly reports
    storedWeeklyReports,
    storedReportsLoading,
    fetchStoredWeeklyReports,
  };
}
