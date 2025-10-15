-- Verify that all required database tables exist
-- Run this in your Supabase Dashboard > SQL Editor

-- Check if weekly_reports table exists
SELECT 
  'weekly_reports' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'weekly_reports') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status;

-- Check if standup_entries table exists
SELECT 
  'standup_entries' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'standup_entries') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status;

-- Check if standup_updates table exists
SELECT 
  'standup_updates' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'standup_updates') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status;

-- Check if team_members table exists
SELECT 
  'team_members' as table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_members') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status;

-- Check if cron extension is enabled
SELECT 
  'pg_cron extension' as component,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') 
    THEN 'ENABLED' 
    ELSE 'DISABLED' 
  END as status;

-- Check if weekly report functions exist
SELECT 
  'generate_weekly_report function' as component,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'generate_weekly_report') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status;

-- Check if trigger function exists
SELECT 
  'trigger_weekly_report_now function' as component,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'trigger_weekly_report_now') 
    THEN 'EXISTS' 
    ELSE 'MISSING' 
  END as status;

-- Check if cron job is scheduled
SELECT 
  'weekly-report-generation cron job' as component,
  CASE 
    WHEN EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'weekly-report-generation') 
    THEN 'SCHEDULED' 
    ELSE 'NOT SCHEDULED' 
  END as status;

-- Count records in each table
SELECT 'weekly_reports' as table_name, COUNT(*) as record_count FROM weekly_reports
UNION ALL
SELECT 'standup_entries' as table_name, COUNT(*) as record_count FROM standup_entries
UNION ALL
SELECT 'standup_updates' as table_name, COUNT(*) as record_count FROM standup_updates
UNION ALL
SELECT 'team_members' as table_name, COUNT(*) as record_count FROM team_members;
