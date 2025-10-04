-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage on pg_cron to authenticated users (if not already granted)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.usage_privileges 
        WHERE grantee = 'authenticated' AND object_name = 'cron'
    ) THEN
        GRANT USAGE ON SCHEMA cron TO authenticated;
    END IF;
END $$;
