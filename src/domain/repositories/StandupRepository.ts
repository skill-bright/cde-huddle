import { TeamMember } from '@/domain/entities/TeamMember';
import { StandupEntry } from '@/domain/entities/StandupEntry';
import { WeeklyReport } from '@/domain/entities/WeeklyReport';

/**
 * Repository interface for standup data operations
 * Defines the contract for data access without implementation details
 */
export interface StandupRepository {
  /**
   * Get today's standup entries
   */
  getTodayStandup(): Promise<TeamMember[]>;

  /**
   * Get standup history (excluding today)
   */
  getStandupHistory(limit?: number): Promise<StandupEntry[]>;

  /**
   * Save a team member's update
   */
  saveTeamMemberUpdate(member: TeamMember): Promise<void>;

  /**
   * Get yesterday's update count
   */
  getYesterdayUpdateCount(): Promise<number>;

  /**
   * Get team engagement for the current week
   */
  getTeamEngagement(): Promise<number>;

  /**
   * Generate a weekly report for a specific date range
   */
  generateWeeklyReport(weekStart: string, weekEnd: string): Promise<WeeklyReport>;

  /**
   * Get stored weekly reports
   */
  getStoredWeeklyReports(limit?: number): Promise<StoredWeeklyReport[]>;

  /**
   * Save a weekly report
   */
  saveWeeklyReport(report: WeeklyReport): Promise<void>;
}

/**
 * Stored Weekly Report interface
 */
export interface StoredWeeklyReport {
  id: string;
  weekStart: string;
  weekEnd: string;
  totalUpdates: number;
  uniqueMembers: number;
  reportData: WeeklyReport;
  generatedAt: string;
  status: 'pending' | 'generated' | 'failed';
  error?: string;
  createdAt: string;
  updatedAt: string;
}
