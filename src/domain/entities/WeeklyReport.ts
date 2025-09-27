import { StandupEntry } from './StandupEntry';
import { WeeklyReportSummary } from '@/domain/value-objects/WeeklyReportSummary';

/**
 * WeeklyReport Entity
 * Represents a weekly summary of standup entries
 */
export class WeeklyReport {
  constructor(
    public readonly weekStart: string,
    public readonly weekEnd: string,
    public readonly entries: StandupEntry[],
    public readonly summary: WeeklyReportSummary
  ) {}

  /**
   * Get total number of updates across all entries
   */
  getTotalUpdates(): number {
    return this.entries.reduce((total, entry) => total + entry.getUpdateCount(), 0);
  }

  /**
   * Get unique team members who provided updates
   */
  getUniqueMembers(): number {
    const memberNames = new Set<string>();
    this.entries.forEach(entry => {
      entry.teamMembers.forEach(member => {
        memberNames.add(member.name);
      });
    });
    return memberNames.size;
  }

  /**
   * Get all blockers from the week
   */
  getAllBlockers(): string[] {
    return this.entries.flatMap(entry => entry.getAllBlockers());
  }

  /**
   * Get all accomplishments from the week
   */
  getAllAccomplishments(): string[] {
    return this.entries.flatMap(entry => entry.getAllAccomplishments());
  }

  /**
   * Get all planned work from the week
   */
  getAllPlannedWork(): string[] {
    return this.entries.flatMap(entry => entry.getAllPlannedWork());
  }

  /**
   * Get entries for a specific team member
   */
  getEntriesForMember(memberName: string): StandupEntry[] {
    return this.entries.map(entry => new StandupEntry(
      entry.id,
      entry.date,
      entry.teamMembers.filter(member => member.name === memberName),
      entry.createdAt
    )).filter(entry => entry.teamMembers.length > 0);
  }

  /**
   * Get unique team members from all entries
   */
  getUniqueTeamMembers(): Array<{ name: string; role: string }> {
    const memberMap = new Map<string, { name: string; role: string }>();
    
    this.entries.forEach(entry => {
      entry.teamMembers.forEach(member => {
        if (!memberMap.has(member.name)) {
          memberMap.set(member.name, {
            name: member.name,
            role: member.role
          });
        }
      });
    });
    
    return Array.from(memberMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Check if the report has any data
   */
  hasData(): boolean {
    return this.entries.length > 0 && this.getTotalUpdates() > 0;
  }

  /**
   * Get a summary of the report
   */
  getReportSummary(): string {
    const totalUpdates = this.getTotalUpdates();
    const uniqueMembers = this.getUniqueMembers();
    const daysWithData = this.entries.length;
    const blockerCount = this.getAllBlockers().length;
    
    return `Week of ${this.weekStart} to ${this.weekEnd}: ${totalUpdates} updates from ${uniqueMembers} members across ${daysWithData} days. ${blockerCount} blockers reported.`;
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON() {
    return {
      weekStart: this.weekStart,
      weekEnd: this.weekEnd,
      totalUpdates: this.getTotalUpdates(),
      uniqueMembers: this.getUniqueMembers(),
      entries: this.entries.map(entry => entry.toJSON()),
      summary: this.summary.toJSON()
    };
  }

  /**
   * Create from plain object
   */
  static fromJSON(data: Record<string, unknown>): WeeklyReport {
    return new WeeklyReport(
      data.weekStart as string,
      data.weekEnd as string,
      (data.entries as Array<{ id: string; date: string; teamMembers: unknown[]; createdAt: string }>).map((entry) => StandupEntry.fromJSON(entry)),
      WeeklyReportSummary.fromJSON(data.summary as Record<string, unknown>)
    );
  }
}
