/**
 * TeamMember Entity
 * Represents a team member in the standup system
 */
export class TeamMember {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly role: string,
    public readonly avatar: string,
    public readonly yesterday: string,
    public readonly today: string,
    public readonly blockers: string,
    public readonly lastUpdated: string
  ) {}

  /**
   * Check if the team member has provided an update for today
   */
  hasUpdate(): boolean {
    return !!(this.yesterday || this.today || this.blockers);
  }

  /**
   * Get a summary of the team member's update
   */
  getUpdateSummary(): string {
    const parts = [];
    if (this.yesterday) parts.push('Yesterday: ' + this.yesterday.substring(0, 50) + '...');
    if (this.today) parts.push('Today: ' + this.today.substring(0, 50) + '...');
    if (this.blockers) parts.push('Blockers: ' + this.blockers.substring(0, 50) + '...');
    return parts.join(' | ');
  }

  /**
   * Create a new instance with updated fields
   */
  update(updates: Partial<Pick<TeamMember, 'name' | 'role' | 'avatar' | 'yesterday' | 'today' | 'blockers'>>): TeamMember {
    return new TeamMember(
      this.id,
      updates.name ?? this.name,
      updates.role ?? this.role,
      updates.avatar ?? this.avatar,
      updates.yesterday ?? this.yesterday,
      updates.today ?? this.today,
      updates.blockers ?? this.blockers,
      new Date().toISOString()
    );
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      role: this.role,
      avatar: this.avatar,
      yesterday: this.yesterday,
      today: this.today,
      blockers: this.blockers,
      lastUpdated: this.lastUpdated
    };
  }

  /**
   * Create from plain object
   */
  static fromJSON(data: Record<string, unknown>): TeamMember {
    return new TeamMember(
      data.id as string,
      data.name as string,
      data.role as string,
      data.avatar as string,
      data.yesterday as string,
      data.today as string,
      data.blockers as string,
      data.lastUpdated as string
    );
  }
}
