-- Fix existing objects to handle conflicts gracefully
-- This migration ensures all objects exist without conflicts

-- Drop and recreate the trigger to avoid conflicts
DROP TRIGGER IF EXISTS update_weekly_reports_updated_at ON weekly_reports;

-- Recreate the trigger
CREATE TRIGGER update_weekly_reports_updated_at
  BEFORE UPDATE ON weekly_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Ensure the generate_weekly_report function exists (in case it was created in a previous run)
CREATE OR REPLACE FUNCTION generate_weekly_report()
RETURNS void AS $$
DECLARE
  week_start_date date;
  week_end_date date;
  report_id uuid;
  week_entries record;
  week_updates record;
  total_updates_count integer := 0;
  unique_members_count integer := 0;
  member_names text[] := '{}';
  report_data jsonb;
  basic_summary jsonb;
BEGIN
  -- Calculate current week dates (Monday to Sunday)
  week_start_date := date_trunc('week', CURRENT_DATE)::date;
  week_end_date := week_start_date + interval '6 days';
  
  -- Check if report already exists for this week
  IF EXISTS (
    SELECT 1 FROM weekly_reports 
    WHERE week_start = week_start_date AND week_end = week_end_date
  ) THEN
    RAISE NOTICE 'Weekly report already exists for week % to %', week_start_date, week_end_date;
    RETURN;
  END IF;
  
  -- Create pending report entry
  INSERT INTO weekly_reports (week_start, week_end, status, total_updates, unique_members)
  VALUES (week_start_date, week_end_date, 'pending', 0, 0)
  RETURNING id INTO report_id;
  
  -- Count total updates and unique members
  SELECT 
    COUNT(*) as total,
    COUNT(DISTINCT tm.name) as unique_count,
    ARRAY_AGG(DISTINCT tm.name) as names
  INTO total_updates_count, unique_members_count, member_names
  FROM standup_updates su
  JOIN standup_entries se ON su.standup_entry_id = se.id
  JOIN team_members tm ON su.team_member_id = tm.id
  WHERE se.date >= week_start_date AND se.date <= week_end_date;
  
  -- Generate basic summary data
  basic_summary := jsonb_build_object(
    'entries', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'date', se.date,
          'teamMembers', (
            SELECT jsonb_agg(
              jsonb_build_object(
                'name', tm.name,
                'role', tm.role,
                'avatar', tm.avatar,
                'yesterday', su.yesterday,
                'today', su.today,
                'blockers', su.blockers
              )
            )
            FROM standup_updates su2
            JOIN team_members tm2 ON su2.team_member_id = tm2.id
            WHERE su2.standup_entry_id = se.id
          )
        )
      )
      FROM standup_entries se
      WHERE se.date >= week_start_date AND se.date <= week_end_date
      ORDER BY se.date
    ),
    'summary', jsonb_build_object(
      'keyAccomplishments', '[]'::jsonb,
      'ongoingWork', '[]'::jsonb,
      'blockers', '[]'::jsonb,
      'teamInsights', 'Basic summary generated automatically. AI analysis not available.',
      'recommendations', '[]'::jsonb,
      'memberSummaries', '{}'::jsonb
    )
  );
  
  -- Update the report with generated data
  UPDATE weekly_reports 
  SET 
    status = 'generated',
    report_data = basic_summary,
    total_updates = total_updates_count,
    unique_members = unique_members_count
  WHERE id = report_id;
  
  RAISE NOTICE 'Weekly report generated successfully for week % to % with % updates from % unique members', 
    week_start_date, week_end_date, total_updates_count, unique_members_count;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Update report status to failed
    UPDATE weekly_reports 
    SET 
      status = 'failed',
      error = SQLERRM
    WHERE id = report_id;
    
    RAISE NOTICE 'Error generating weekly report: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger function exists
CREATE OR REPLACE FUNCTION trigger_weekly_report_now()
RETURNS text AS $$
BEGIN
  PERFORM generate_weekly_report();
  RETURN 'Weekly report generation triggered successfully';
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION generate_weekly_report() TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_weekly_report_now() TO authenticated;

-- Create the scheduled job for Friday at 12:00 PM PST (20:00 UTC)
-- Remove any existing job first (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'weekly-report-generation') THEN
    PERFORM cron.unschedule('weekly-report-generation');
  END IF;
END $$;

-- Create the new scheduled job
SELECT cron.schedule(
  'weekly-report-generation',
  '0 20 * * 5', -- Every Friday at 20:00 UTC (12:00 PM PST)
  'SELECT generate_weekly_report();'
);
