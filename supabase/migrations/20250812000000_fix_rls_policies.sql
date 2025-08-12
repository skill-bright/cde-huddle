-- Fix RLS policies to allow anonymous access
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read team members" ON team_members;
DROP POLICY IF EXISTS "Anyone can insert team members" ON team_members;
DROP POLICY IF EXISTS "Anyone can update team members" ON team_members;

DROP POLICY IF EXISTS "Anyone can read standup entries" ON standup_entries;
DROP POLICY IF EXISTS "Anyone can insert standup entries" ON standup_entries;
DROP POLICY IF EXISTS "Anyone can update standup entries" ON standup_entries;

DROP POLICY IF EXISTS "Anyone can read standup updates" ON standup_updates;
DROP POLICY IF EXISTS "Anyone can insert standup updates" ON standup_updates;
DROP POLICY IF EXISTS "Anyone can update standup updates" ON standup_updates;
DROP POLICY IF EXISTS "Anyone can delete standup updates" ON standup_updates;

-- Create new policies for anonymous access
CREATE POLICY "Anyone can read team members"
  ON team_members
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert team members"
  ON team_members
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update team members"
  ON team_members
  FOR UPDATE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can read standup entries"
  ON standup_entries
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert standup entries"
  ON standup_entries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update standup entries"
  ON standup_entries
  FOR UPDATE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can read standup updates"
  ON standup_updates
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert standup updates"
  ON standup_updates
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update standup updates"
  ON standup_updates
  FOR UPDATE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can delete standup updates"
  ON standup_updates
  FOR DELETE
  TO anon, authenticated
  USING (true); 