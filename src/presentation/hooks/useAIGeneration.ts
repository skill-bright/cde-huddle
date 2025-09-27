import { useState, useCallback, useMemo } from 'react';

import { TeamMember } from '@/domain/entities/TeamMember';
import { WeeklyReport } from '@/domain/entities/WeeklyReport';
import { AnthropicAIService } from '@/infrastructure/services/AnthropicAIService';

/**
 * Custom hook for AI generation operations
 * Provides a clean interface for AI-powered content generation
 */
export function useAIGeneration() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const aiService = useMemo(() => new AnthropicAIService(), []);

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
      
      const newSummary = await aiService.regenerateWeeklySummary(report);
      
      return newSummary;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to regenerate summary';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setGenerating(false);
    }
  }, [aiService]);

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
