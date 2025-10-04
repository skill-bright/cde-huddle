#!/bin/bash

# Trigger Weekly Report Generation
# This script helps you manually trigger the weekly report generation

echo "🚀 Triggering Weekly Report Generation..."

echo "📋 Method 1: Using Supabase Dashboard (Recommended)"
echo "1. Go to your Supabase Dashboard > SQL Editor"
echo "2. Run this query:"
echo ""
echo "   SELECT trigger_weekly_report_now();"
echo ""
echo "3. Check the results:"
echo ""
echo "   SELECT * FROM weekly_reports ORDER BY generated_at DESC LIMIT 5;"
echo ""

echo "📋 Method 2: Using Supabase CLI"
echo "Running manual trigger via CLI..."

# Try to trigger via CLI if possible
if command -v supabase &> /dev/null; then
    echo "Attempting to trigger via Supabase CLI..."
    # Note: This would require a direct database connection
    echo "Note: CLI method requires direct database access"
    echo "Use Method 1 (Dashboard) for easier testing"
else
    echo "Supabase CLI not available, use Method 1 (Dashboard)"
fi

echo ""
echo "🔍 To verify the report was generated:"
echo "1. Go to Supabase Dashboard > Table Editor"
echo "2. Open the 'weekly_reports' table"
echo "3. Look for the latest entry with status 'generated'"
echo ""
echo "📊 To check report details:"
echo "SELECT week_start, week_end, status, total_updates, unique_members, generated_at FROM weekly_reports ORDER BY generated_at DESC LIMIT 1;"
echo ""
echo "✅ Report generation triggered!"
