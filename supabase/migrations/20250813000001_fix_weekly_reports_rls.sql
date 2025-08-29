-- Fix RLS policies for weekly_reports table to allow server-side operations
-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read weekly reports" ON weekly_reports;
DROP POLICY IF EXISTS "Allow authenticated users to insert weekly reports" ON weekly_reports;
DROP POLICY IF EXISTS "Allow authenticated users to update weekly reports" ON weekly_reports;

-- Create new policies that allow both authenticated and anonymous access
-- This is needed because the scheduler runs server-side without authentication

-- Allow read access for all users (authenticated and anonymous)
CREATE POLICY "Allow all users to read weekly reports" ON weekly_reports
  FOR SELECT USING (true);

-- Allow insert access for all users (authenticated and anonymous)
CREATE POLICY "Allow all users to insert weekly reports" ON weekly_reports
  FOR INSERT WITH CHECK (true);

-- Allow update access for all users (authenticated and anonymous)
CREATE POLICY "Allow all users to update weekly reports" ON weekly_reports
  FOR UPDATE USING (true);

-- Allow delete access for all users (authenticated and anonymous)
CREATE POLICY "Allow all users to delete weekly reports" ON weekly_reports
  FOR DELETE USING (true);
