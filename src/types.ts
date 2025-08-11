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