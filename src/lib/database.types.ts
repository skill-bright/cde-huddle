export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      team_members: {
        Row: {
          id: string
          name: string
          role: string
          avatar: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          role: string
          avatar?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: string
          avatar?: string
          created_at?: string
          updated_at?: string
        }
      }
      standup_entries: {
        Row: {
          id: string
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          created_at?: string
          updated_at?: string
        }
      }
      standup_updates: {
        Row: {
          id: string
          standup_entry_id: string
          team_member_id: string
          yesterday: string
          today: string
          blockers: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          standup_entry_id: string
          team_member_id: string
          yesterday?: string
          today?: string
          blockers?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          standup_entry_id?: string
          team_member_id?: string
          yesterday?: string
          today?: string
          blockers?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}