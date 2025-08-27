-- Create weekly_reports table
CREATE TABLE IF NOT EXISTS weekly_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  total_updates INTEGER DEFAULT 0,
  unique_members INTEGER DEFAULT 0,
  report_data JSONB,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generated', 'failed')),
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_weekly_reports_week_dates ON weekly_reports(week_start, week_end);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_status ON weekly_reports(status);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_generated_at ON weekly_reports(generated_at);

-- Create unique constraint to prevent duplicate reports for the same week
CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_reports_unique_week ON weekly_reports(week_start, week_end);

-- Enable Row Level Security
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read weekly reports
CREATE POLICY "Allow authenticated users to read weekly reports" ON weekly_reports
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy to allow all authenticated users to insert weekly reports
CREATE POLICY "Allow authenticated users to insert weekly reports" ON weekly_reports
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow all authenticated users to update weekly reports
CREATE POLICY "Allow authenticated users to update weekly reports" ON weekly_reports
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_weekly_reports_updated_at
  BEFORE UPDATE ON weekly_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
