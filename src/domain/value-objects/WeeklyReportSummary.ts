/**
 * WeeklyReportSummary Value Object
 * Immutable object representing the AI-generated summary of a weekly report
 */
export class WeeklyReportSummary {
  constructor(
    public readonly keyAccomplishments: string[],
    public readonly ongoingWork: string[],
    public readonly blockers: string[],
    public readonly teamInsights: string,
    public readonly recommendations: string[],
    public readonly memberSummaries: Record<string, MemberSummary>
  ) {}

  /**
   * Get the number of key accomplishments
   */
  getAccomplishmentCount(): number {
    return this.keyAccomplishments.length;
  }

  /**
   * Get the number of ongoing work items
   */
  getOngoingWorkCount(): number {
    return this.ongoingWork.length;
  }

  /**
   * Get the number of blockers
   */
  getBlockerCount(): number {
    return this.blockers.length;
  }

  /**
   * Get the number of recommendations
   */
  getRecommendationCount(): number {
    return this.recommendations.length;
  }

  /**
   * Get the number of member summaries
   */
  getMemberSummaryCount(): number {
    return Object.keys(this.memberSummaries).length;
  }

  /**
   * Check if there are any blockers
   */
  hasBlockers(): boolean {
    return this.blockers.length > 0;
  }

  /**
   * Check if there are any accomplishments
   */
  hasAccomplishments(): boolean {
    return this.keyAccomplishments.length > 0;
  }

  /**
   * Get member summary for a specific member
   */
  getMemberSummary(memberName: string): MemberSummary | null {
    return this.memberSummaries[memberName] || null;
  }

  /**
   * Get all member names with summaries
   */
  getMemberNames(): string[] {
    return Object.keys(this.memberSummaries);
  }

  /**
   * Check if the summary has any content
   */
  hasContent(): boolean {
    return this.keyAccomplishments.length > 0 ||
           this.ongoingWork.length > 0 ||
           this.blockers.length > 0 ||
           this.teamInsights.trim() !== '' ||
           this.recommendations.length > 0 ||
           Object.keys(this.memberSummaries).length > 0;
  }

  /**
   * Get a summary of the summary (meta-summary)
   */
  getMetaSummary(): string {
    const parts = [];
    if (this.keyAccomplishments.length > 0) parts.push(`${this.keyAccomplishments.length} accomplishments`);
    if (this.ongoingWork.length > 0) parts.push(`${this.ongoingWork.length} ongoing items`);
    if (this.blockers.length > 0) parts.push(`${this.blockers.length} blockers`);
    if (this.recommendations.length > 0) parts.push(`${this.recommendations.length} recommendations`);
    if (Object.keys(this.memberSummaries).length > 0) parts.push(`${Object.keys(this.memberSummaries).length} member summaries`);
    
    return parts.length > 0 ? parts.join(', ') : 'No summary data available';
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON() {
    return {
      keyAccomplishments: this.keyAccomplishments,
      ongoingWork: this.ongoingWork,
      blockers: this.blockers,
      teamInsights: this.teamInsights,
      recommendations: this.recommendations,
      memberSummaries: this.memberSummaries
    };
  }

  /**
   * Create from plain object
   */
  static fromJSON(data: Record<string, unknown>): WeeklyReportSummary {
    return new WeeklyReportSummary(
      (data.keyAccomplishments as string[]) || [],
      (data.ongoingWork as string[]) || [],
      (data.blockers as string[]) || [],
      (data.teamInsights as string) || '',
      (data.recommendations as string[]) || [],
      (data.memberSummaries as Record<string, MemberSummary>) || {}
    );
  }
}

/**
 * MemberSummary Value Object
 * Represents an individual team member's summary
 */
export class MemberSummary {
  constructor(
    public readonly role: string,
    public readonly keyContributions: string[],
    public readonly progress: string,
    public readonly concerns: string[],
    public readonly nextWeekFocus: string
  ) {}

  /**
   * Get the number of key contributions
   */
  getContributionCount(): number {
    return this.keyContributions.length;
  }

  /**
   * Get the number of concerns
   */
  getConcernCount(): number {
    return this.concerns.length;
  }

  /**
   * Check if the member has any concerns
   */
  hasConcerns(): boolean {
    return this.concerns.length > 0;
  }

  /**
   * Check if the member has any contributions
   */
  hasContributions(): boolean {
    return this.keyContributions.length > 0;
  }

  /**
   * Get a summary of this member's summary
   */
  getSummary(): string {
    const parts = [];
    if (this.keyContributions.length > 0) parts.push(`${this.keyContributions.length} contributions`);
    if (this.concerns.length > 0) parts.push(`${this.concerns.length} concerns`);
    if (this.progress.trim()) parts.push('progress noted');
    if (this.nextWeekFocus.trim()) parts.push('next week planned');
    
    return parts.length > 0 ? parts.join(', ') : 'No summary data available';
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON() {
    return {
      role: this.role,
      keyContributions: this.keyContributions,
      progress: this.progress,
      concerns: this.concerns,
      nextWeekFocus: this.nextWeekFocus
    };
  }

  /**
   * Create from plain object
   */
  static fromJSON(data: Record<string, unknown>): MemberSummary {
    return new MemberSummary(
      (data.role as string) || '',
      (data.keyContributions as string[]) || [],
      (data.progress as string) || '',
      (data.concerns as string[]) || [],
      (data.nextWeekFocus as string) || ''
    );
  }
}
