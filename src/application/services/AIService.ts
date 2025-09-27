import { WeeklyReport } from '@/domain/entities/WeeklyReport';
import { WeeklyReportSummary } from '@/domain/value-objects/WeeklyReportSummary';
import { TeamMember } from '@/domain/entities/TeamMember';

/**
 * AI Service interface
 * Defines the contract for AI-related operations
 */
export interface AIService {
  /**
   * Generate a weekly summary using AI
   * @param report The weekly report to summarize
   * @returns Promise<WeeklyReportSummary> AI-generated summary
   */
  generateWeeklySummary(report: WeeklyReport): Promise<WeeklyReportSummary>;

  /**
   * Generate content for a specific field
   * @param memberName The team member's name
   * @param memberRole The team member's role
   * @param fieldType The type of field to generate
   * @param context Additional context
   * @param previousEntries Previous entries for context
   * @returns Promise<string> Generated content
   */
  generateFieldContent(
    memberName: string,
    memberRole: string,
    fieldType: 'yesterday' | 'today' | 'blockers',
    context?: string,
    previousEntries?: TeamMember[]
  ): Promise<string>;

  /**
   * Generate a full report for a team member
   * @param memberName The team member's name
   * @param memberRole The team member's role
   * @param previousEntries Previous entries for context
   * @returns Promise<{yesterday: string, today: string, blockers: string}> Generated report
   */
  generateFullReport(
    memberName: string,
    memberRole: string,
    previousEntries?: TeamMember[]
  ): Promise<{
    yesterday: string;
    today: string;
    blockers: string;
  }>;

  /**
   * Regenerate AI summary for an existing report
   * @param report The existing report
   * @returns Promise<WeeklyReportSummary> Regenerated summary
   */
  regenerateWeeklySummary(report: WeeklyReport): Promise<WeeklyReportSummary>;
}
