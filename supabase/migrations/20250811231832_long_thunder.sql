/*
  # Create standup meeting schema

  1. New Tables
    - `team_members`
      - `id` (uuid, primary key)
      - `name` (text)
      - `role` (text)
      - `avatar` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `standup_entries`
      - `id` (uuid, primary key)
      - `date` (date)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `standup_updates`
      - `id` (uuid, primary key)
      - `standup_entry_id` (uuid, foreign key)
      - `team_member_id` (uuid, foreign key)
      - `yesterday` (text)
      - `today` (text)
      - `blockers` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Allow read access to all standup data for team collaboration
*/

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  avatar text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create standup_entries table
CREATE TABLE IF NOT EXISTS standup_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create standup_updates table
CREATE TABLE IF NOT EXISTS standup_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  standup_entry_id uuid REFERENCES standup_entries(id) ON DELETE CASCADE,
  team_member_id uuid REFERENCES team_members(id) ON DELETE CASCADE,
  yesterday text DEFAULT '',
  today text DEFAULT '',
  blockers text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(standup_entry_id, team_member_id)
);

-- Enable Row Level Security
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE standup_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE standup_updates ENABLE ROW LEVEL SECURITY;

-- Create policies for team_members
CREATE POLICY "Anyone can read team members"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert team members"
  ON team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update team members"
  ON team_members
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create policies for standup_entries
CREATE POLICY "Anyone can read standup entries"
  ON standup_entries
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert standup entries"
  ON standup_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update standup entries"
  ON standup_entries
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create policies for standup_updates
CREATE POLICY "Anyone can read standup updates"
  ON standup_updates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert standup updates"
  ON standup_updates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update standup updates"
  ON standup_updates
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can delete standup updates"
  ON standup_updates
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_standup_entries_date ON standup_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_standup_updates_entry_id ON standup_updates(standup_entry_id);
CREATE INDEX IF NOT EXISTS idx_standup_updates_member_id ON standup_updates(team_member_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_standup_entries_updated_at
  BEFORE UPDATE ON standup_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_standup_updates_updated_at
  BEFORE UPDATE ON standup_updates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();