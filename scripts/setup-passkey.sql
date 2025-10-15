-- Setup passkey table and default passkey
-- Run this in your Supabase Dashboard > SQL Editor

-- Create passkey table for secure passkey storage
CREATE TABLE IF NOT EXISTS passkeys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key_name TEXT NOT NULL UNIQUE,
  key_value TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_passkeys_key_name ON passkeys(key_name);
CREATE INDEX IF NOT EXISTS idx_passkeys_active ON passkeys(is_active);

-- Enable Row Level Security
ALTER TABLE passkeys ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all users to read active passkeys (for validation)
CREATE POLICY "Allow all users to read active passkeys" ON passkeys
  FOR SELECT USING (is_active = true);

-- Create policy to allow authenticated users to manage passkeys
CREATE POLICY "Allow authenticated users to manage passkeys" ON passkeys
  FOR ALL USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_passkeys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_passkeys_updated_at ON passkeys;
CREATE TRIGGER update_passkeys_updated_at
  BEFORE UPDATE ON passkeys
  FOR EACH ROW
  EXECUTE FUNCTION update_passkeys_updated_at();

-- Insert default passkey (you should change this after deployment)
INSERT INTO passkeys (key_name, key_value, description, is_active)
VALUES (
  'weekly_report_generation',
  'huddle2025',
  'Passkey for generating weekly reports and regenerating AI summaries',
  true
) ON CONFLICT (key_name) DO NOTHING;

-- Create function to validate passkey
CREATE OR REPLACE FUNCTION validate_passkey(passkey_value TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM passkeys 
    WHERE key_value = passkey_value 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the validation function
GRANT EXECUTE ON FUNCTION validate_passkey(TEXT) TO authenticated;

-- Test the validation function
SELECT validate_passkey('huddle2025') as is_valid;

-- Show the created passkey
SELECT key_name, description, is_active, created_at FROM passkeys;
