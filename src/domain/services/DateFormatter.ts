/**
 * DateFormatter Domain Service
 * Handles date formatting operations according to business rules
 */
export class DateFormatter {
  /**
   * Format a date string for display in standup history
   */
  static formatStandupDate(dateString: string): string {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Format a creation date for display
   */
  static formatCreationDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Extract month key from date string
   */
  static extractMonthKey(dateString: string): string {
    const [year, month] = dateString.split('-');
    return `${year}-${month}`;
  }

  /**
   * Get month display name from month key
   */
  static getMonthDisplayName(monthKey: string): string {
    if (monthKey === 'all') return 'All Months';
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  }
}
