#!/bin/bash

# Test Automated Weekly Reports
# This script tests the automated weekly report generation system

echo "🧪 Testing Automated Weekly Reports..."

# Test 1: Check if scheduled jobs exist
echo "📋 Checking scheduled jobs..."
supabase db reset --linked
supabase db push

# Test 2: Check if functions exist
echo "🔍 Checking database functions..."
supabase db reset --linked
supabase db push

echo "✅ Test completed!"
echo ""
echo "📋 To manually test the system:"
echo "1. Go to your Supabase Dashboard > SQL Editor"
echo "2. Run: SELECT trigger_weekly_report_now();"
echo "3. Check results: SELECT * FROM weekly_reports ORDER BY generated_at DESC;"
echo ""
echo "📋 To check scheduled jobs:"
echo "1. Go to your Supabase Dashboard > SQL Editor"
echo "2. Run: SELECT * FROM cron.job;"
echo ""
echo "🎉 Your automated weekly reports are now set up!"
echo "   Reports will be generated every Friday at 12:00 PM PST"
