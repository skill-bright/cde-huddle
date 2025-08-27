export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  yesterday: string;
  today: string;
  blockers: string;
  lastUpdated: string;
}

export interface StandupEntry {
  id: string;
  date: string;
  teamMembers: TeamMember[];
  createdAt: string;
}

export interface StandupHistory {
  entries: StandupEntry[];
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  totalUpdates: number;
  uniqueMembers: number;
  entries: StandupEntry[];
  summary: WeeklyReportSummary;
}

export interface MemberSummary {
  role: string;
  keyContributions: string[];
  progress: string;
  concerns: string[];
  nextWeekFocus: string;
}

export interface WeeklyReportSummary {
  keyAccomplishments: string[];
  ongoingWork: string[];
  blockers: string[];
  teamInsights: string;
  recommendations: string[];
  memberSummaries: Record<string, MemberSummary>;
}

export interface WeeklyReportFilters {
  weekStart?: string;
  weekEnd?: string;
  includeAI: boolean;
  customPrompt?: string;
}

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