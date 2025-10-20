import { useState, useCallback, useMemo } from 'react';

import { TeamMember } from '@/domain/entities/TeamMember';
import { WeeklyReport } from '@/domain/entities/WeeklyReport';
import { SecureAnthropicAIService } from '@/infrastructure/services/SecureAnthropicAIService';
import { SupabaseStandupRepository } from '@/infrastructure/repositories/SupabaseStandupRepository';
import { useToast } from './useToast';

/**
 * Custom hook for AI generation operations
 * Provides a clean interface for AI-powered content generation
 */
export function useAIGeneration() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const aiService = useMemo(() => new SecureAnthropicAIService(), []);
  const repository = useMemo(() => new SupabaseStandupRepository(), []);
  const { showError, showSuccess } = useToast();

  /**
   * Generate content for a specific field
   */
  const generateFieldContent = useCallback(async (
    memberName: string,
    memberRole: string,
    fieldType: 'yesterday' | 'today' | 'blockers',
    context?: string,
    previousEntries?: TeamMember[]
  ): Promise<string> => {
    try {
      setGenerating(true);
      setError(null);
      
      const content = await aiService.generateFieldContent(
        memberName,
        memberRole,
        fieldType,
        context,
        previousEntries
      );
      
      return content;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate content';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setGenerating(false);
    }
  }, [aiService]);

  /**
   * Generate a full report for a team member
   */
  const generateFullReport = useCallback(async (
    memberName: string,
    memberRole: string,
    previousEntries?: TeamMember[]
  ): Promise<{
    yesterday: string;
    today: string;
    blockers: string;
  }> => {
    try {
      setGenerating(true);
      setError(null);
      
      const report = await aiService.generateFullReport(
        memberName,
        memberRole,
        previousEntries
      );
      
      return report;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate full report';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setGenerating(false);
    }
  }, [aiService]);

  /**
   * Regenerate AI summary for an existing weekly report
   */
  const regenerateWeeklySummary = useCallback(async (report: WeeklyReport) => {
    try {
      setGenerating(true);
      setError(null);
      
      console.log('🔄 Regenerating AI summary for report:', report.weekStart, 'to', report.weekEnd);
      
      const newSummary = await aiService.regenerateWeeklySummary(report);
      
      // Create a new report with the regenerated summary
      const updatedReport = new WeeklyReport(
        report.weekStart,
        report.weekEnd,
        report.entries,
        newSummary
      );
      
      // Save the updated report to the database
      await repository.saveWeeklyReport(updatedReport);
      console.log('💾 Regenerated summary saved to database');
      
      // Show success toast
      showSuccess(
        'AI Summary Regenerated',
        'The weekly report summary has been successfully regenerated and saved.',
        4000
      );
      
      return newSummary;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to regenerate summary';
      setError(errorMessage);
      
      // Show error toast
      showError(
        'Summary Regeneration Failed',
        errorMessage,
        8000
      );
      
      throw new Error(errorMessage);
    } finally {
      setGenerating(false);
    }
  }, [aiService, repository, showError, showSuccess]);

  /**
   * Clear any existing errors
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    generating,
    error,
    generateFieldContent,
    generateFullReport,
    regenerateWeeklySummary,
    clearError
  };
}
