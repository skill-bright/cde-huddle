-- Test manual weekly report generation
-- Run this in your Supabase Dashboard > SQL Editor

-- First, let's test the manual trigger function
SELECT trigger_weekly_report_now();

-- Check if a report was created
SELECT 
  id,
  week_start,
  week_end,
  status,
  total_updates,
  unique_members,
  generated_at,
  error
FROM weekly_reports 
ORDER BY generated_at DESC 
LIMIT 1;

-- If the report was created successfully, you should see:
-- - status: 'generated'
-- - total_updates: number of standup updates for the week
-- - unique_members: number of unique team members who provided updates
-- - generated_at: current timestamp
-- - error: null

-- If there was an error, check the error field for details
