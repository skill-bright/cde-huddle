-- Setup API keys table and insert your Anthropic API key
-- Run this in your Supabase Dashboard > SQL Editor

-- Create API keys table for secure API key storage
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name TEXT NOT NULL UNIQUE,
  api_key TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_service_name ON api_keys(service_name);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);

-- Enable Row Level Security
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Create policy to allow only service role to access API keys
CREATE POLICY "Only service role can access API keys" ON api_keys
  FOR ALL USING (auth.role() = 'service_role');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_api_keys_updated_at ON api_keys;
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_api_keys_updated_at();

-- Create function to get API key by service name (only accessible by service role)
CREATE OR REPLACE FUNCTION get_api_key(service_name_param TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Only allow service role to access this function
  IF auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Access denied. Only service role can access API keys.';
  END IF;
  
  RETURN (
    SELECT api_key FROM api_keys 
    WHERE service_name = service_name_param 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function to service role only
GRANT EXECUTE ON FUNCTION get_api_key(TEXT) TO service_role;

-- IMPORTANT: Replace 'YOUR_ANTHROPIC_API_KEY_HERE' with your actual Anthropic API key
-- You can find this in your Anthropic console: https://console.anthropic.com/
INSERT INTO api_keys (service_name, api_key, description, is_active)
VALUES (
  'anthropic',
  'YOUR_ANTHROPIC_API_KEY_HERE',
  'Anthropic API key for AI text generation',
  true
) ON CONFLICT (service_name) DO UPDATE SET
  api_key = EXCLUDED.api_key,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Verify the API key was inserted (this will only show the service name, not the key)
SELECT service_name, description, is_active, created_at FROM api_keys WHERE service_name = 'anthropic';
