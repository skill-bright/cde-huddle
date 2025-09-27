import { StandupRepository } from '@/domain/repositories/StandupRepository';
import { WeeklyReport } from '@/domain/entities/WeeklyReport';
import { WeeklyReportSummary, MemberSummary } from '@/domain/value-objects/WeeklyReportSummary';
import { AIService } from '@/application/services/AIService';

/**
 * Use case for generating weekly reports
 * Encapsulates the business logic for creating weekly standup summaries
 */
export class GenerateWeeklyReportUseCase {
  constructor(
    private readonly standupRepository: StandupRepository,
    private readonly aiService: AIService
  ) {}

  /**
   * Execute the use case
   * @param weekStart Start date of the week (YYYY-MM-DD)
   * @param weekEnd End date of the week (YYYY-MM-DD)
   * @param includeAI Whether to include AI-generated summary
   * @returns Promise<WeeklyReport> The generated weekly report
   */
  async execute(
    weekStart: string, 
    weekEnd: string, 
    includeAI: boolean = true
  ): Promise<WeeklyReport> {
    try {
      // Validate date range
      this.validateDateRange(weekStart, weekEnd);
      
      // Generate the report from repository
      const report = await this.standupRepository.generateWeeklyReport(weekStart, weekEnd);
      
      // If AI is requested and the report has data, enhance with AI summary
      if (includeAI && report.hasData()) {
        try {
          const aiSummary = await this.aiService.generateWeeklySummary(report);
          // Create a new report with AI summary
          return new WeeklyReport(
            report.weekStart,
            report.weekEnd,
            report.entries,
            aiSummary
          );
        } catch (aiError) {
          console.warn('AI summary generation failed, using basic summary:', aiError);
          // Fall back to basic summary
          const basicSummary = this.generateBasicSummary(report);
          return new WeeklyReport(
            report.weekStart,
            report.weekEnd,
            report.entries,
            basicSummary
          );
        }
      }
      
      return report;
    } catch (error) {
      console.error('Failed to generate weekly report:', error);
      throw new Error('Failed to generate weekly report');
    }
  }

  /**
   * Validate the date range
   * @param weekStart Start date
   * @param weekEnd End date
   */
  private validateDateRange(weekStart: string, weekEnd: string): void {
    const startDate = new Date(weekStart);
    const endDate = new Date(weekEnd);
    
    if (isNaN(startDate.getTime())) {
      throw new Error('Invalid week start date');
    }
    
    if (isNaN(endDate.getTime())) {
      throw new Error('Invalid week end date');
    }
    
    if (startDate > endDate) {
      throw new Error('Week start date must be before week end date');
    }
    
    // Check if the date range is reasonable (not more than 2 weeks)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 14) {
      throw new Error('Date range cannot exceed 2 weeks');
    }
  }

  /**
   * Generate a basic summary without AI
   * @param report The weekly report
   * @returns WeeklyReportSummary Basic summary
   */
  private generateBasicSummary(report: WeeklyReport): WeeklyReportSummary {
    const allAccomplishments = report.getAllAccomplishments();
    const allOngoingWork = report.getAllPlannedWork();
    const allBlockers = report.getAllBlockers();
    
    // Generate member summaries
    const memberSummaries: Record<string, MemberSummary> = {};
    const uniqueMembers = report.getUniqueTeamMembers();
    
    uniqueMembers.forEach(member => {
      const memberEntries = report.getEntriesForMember(member.name);
      const contributions = memberEntries.flatMap(entry => 
        entry.teamMembers.map(m => m.yesterday).filter(Boolean)
      );
      const concerns = memberEntries.flatMap(entry => 
        entry.teamMembers.map(m => m.blockers).filter(Boolean)
      );
      
      memberSummaries[member.name] = new MemberSummary(
        member.role,
        contributions.slice(0, 5),
        `Completed work on ${memberEntries.length} day(s)`,
        concerns,
        'Continue current project work'
      );
    });
    
    return new WeeklyReportSummary(
      allAccomplishments.slice(0, 10),
      allOngoingWork.slice(0, 10),
      allBlockers.slice(0, 10),
      `Generated basic summary for ${report.entries.length} days with ${allAccomplishments.length} accomplishments, ${allOngoingWork.length} ongoing tasks, and ${allBlockers.length} blockers.`,
      [],
      memberSummaries
    );
  }
}
