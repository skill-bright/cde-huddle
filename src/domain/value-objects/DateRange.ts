/**
 * DateRange Value Object
 * Represents a date range with utility methods
 */
export class DateRange {
  constructor(
    public readonly startDate: string,
    public readonly endDate: string
  ) {}

  /**
   * Check if a date falls within this range
   */
  contains(date: string): boolean {
    return date >= this.startDate && date <= this.endDate;
  }

  /**
   * Get the month key for this range (YYYY-MM format)
   */
  getMonthKey(): string {
    const [year, month] = this.startDate.split('-');
    return `${year}-${month}`;
  }

  /**
   * Get display name for this date range
   */
  getDisplayName(): string {
    const startDate = new Date(this.startDate);
    return startDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  }

  /**
   * Create a date range for a specific month
   */
  static forMonth(year: number, month: number): DateRange {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    return new DateRange(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );
  }

  /**
   * Create date range for "all" (no filtering)
   */
  static all(): DateRange {
    return new DateRange('1900-01-01', '2100-12-31');
  }
}
