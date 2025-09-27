import { TeamMember } from './TeamMember';

/**
 * StandupEntry Entity
 * Represents a collection of team member updates for a specific date
 */
export class StandupEntry {
  constructor(
    public readonly id: string,
    public readonly date: string,
    public readonly teamMembers: TeamMember[],
    public readonly createdAt: string
  ) {}

  /**
   * Get the number of team members who provided updates
   */
  getUpdateCount(): number {
    return this.teamMembers.filter(member => member.hasUpdate()).length;
  }

  /**
   * Get team members who haven't provided updates
   */
  getMembersWithoutUpdates(): TeamMember[] {
    return this.teamMembers.filter(member => !member.hasUpdate());
  }

  /**
   * Get all blockers mentioned in this entry
   */
  getAllBlockers(): string[] {
    return this.teamMembers
      .map(member => member.blockers)
      .filter(blocker => blocker && blocker.trim() !== '')
      .filter(blocker => blocker !== '<p>None</p>' && blocker !== 'None');
  }

  /**
   * Get all accomplishments from yesterday's work
   */
  getAllAccomplishments(): string[] {
    return this.teamMembers
      .map(member => member.yesterday)
      .filter(accomplishment => accomplishment && accomplishment.trim() !== '')
      .filter(accomplishment => accomplishment !== '<p>None</p>' && accomplishment !== 'None');
  }

  /**
   * Get all planned work for today
   */
  getAllPlannedWork(): string[] {
    return this.teamMembers
      .map(member => member.today)
      .filter(work => work && work.trim() !== '')
      .filter(work => work !== '<p>None</p>' && work !== 'None');
  }

  /**
   * Check if this entry has any blockers
   */
  hasBlockers(): boolean {
    return this.getAllBlockers().length > 0;
  }

  /**
   * Get a summary of this entry
   */
  getSummary(): string {
    const updateCount = this.getUpdateCount();
    const totalMembers = this.teamMembers.length;
    const blockerCount = this.getAllBlockers().length;
    
    return `${updateCount}/${totalMembers} members updated. ${blockerCount} blocker(s) reported.`;
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON() {
    return {
      id: this.id,
      date: this.date,
      teamMembers: this.teamMembers.map(member => member.toJSON()),
      createdAt: this.createdAt
    };
  }

  /**
   * Create from plain object
   */
  static fromJSON(data: {
    id: string;
    date: string;
    teamMembers: unknown[];
    createdAt: string;
  }): StandupEntry {
    return new StandupEntry(
      data.id,
      data.date,
      data.teamMembers.map((member: unknown) => TeamMember.fromJSON(member as Record<string, unknown>)),
      data.createdAt
    );
  }
}
