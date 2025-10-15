-- Test database write permissions for weekly reports
-- Run this in your Supabase Dashboard > SQL Editor

-- Test inserting a sample weekly report
INSERT INTO weekly_reports (
  week_start,
  week_end,
  total_updates,
  unique_members,
  report_data,
  status,
  generated_at
) VALUES (
  '2025-01-13',  -- Monday
  '2025-01-19',  -- Sunday
  0,
  0,
  '{"entries": [], "summary": {"keyAccomplishments": [], "ongoingWork": [], "blockers": [], "teamInsights": "Test report", "recommendations": [], "memberSummaries": {}}}'::jsonb,
  'generated',
  NOW()
);

-- Check if the insert was successful
SELECT 
  id,
  week_start,
  week_end,
  status,
  generated_at
FROM weekly_reports 
WHERE week_start = '2025-01-13' 
ORDER BY generated_at DESC 
LIMIT 1;

-- Clean up the test record
DELETE FROM weekly_reports 
WHERE week_start = '2025-01-13' 
AND status = 'generated' 
AND report_data->>'teamInsights' = 'Test report';
