import { StandupRepository } from '@/domain/repositories/StandupRepository';
import { StandupEntry } from '@/domain/entities/StandupEntry';
import { DateRange } from '@/domain/value-objects/DateRange';
import { DateFormatter } from '@/domain/services/DateFormatter';

/**
 * Get Standup History Use Case
 * Handles retrieving and filtering standup history
 */
export class GetStandupHistoryUseCase {
  constructor(private readonly standupRepository: StandupRepository) {}

  /**
   * Get all standup history
   */
  async getAllHistory(): Promise<StandupEntry[]> {
    return await this.standupRepository.getStandupHistory();
  }

  /**
   * Get standup history filtered by date range
   */
  async getHistoryByDateRange(dateRange: DateRange): Promise<StandupEntry[]> {
    const allHistory = await this.standupRepository.getStandupHistory();
    
    if (dateRange === DateRange.all()) {
      return allHistory;
    }

    return allHistory.filter(entry => dateRange.contains(entry.date));
  }

  /**
   * Get available months from history
   */
  async getAvailableMonths(): Promise<string[]> {
    const history = await this.standupRepository.getStandupHistory();
    const months = new Set<string>();
    
    history.forEach(entry => {
      months.add(DateFormatter.extractMonthKey(entry.date));
    });
    
    return Array.from(months).sort().reverse();
  }

  /**
   * Get month display names
   */
  async getMonthDisplayNames(): Promise<Record<string, string>> {
    const months = await this.getAvailableMonths();
    const displayNames: Record<string, string> = { all: 'All Months' };
    
    months.forEach(month => {
      displayNames[month] = DateFormatter.getMonthDisplayName(month);
    });
    
    return displayNames;
  }
}
