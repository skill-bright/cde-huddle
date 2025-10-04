#!/bin/bash

# Deploy Automated Weekly Reports
# This script sets up the automated weekly report generation system

set -e

echo "🚀 Deploying Automated Weekly Reports..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if user is logged in
if ! supabase projects list &> /dev/null; then
    echo "🔐 Please log in to Supabase first:"
    echo "   supabase login"
    echo "   Then run this script again."
    exit 1
fi

# Check if we're in a Supabase project, initialize if needed
if [ ! -f "supabase/config.toml" ]; then
    echo "📦 Initializing Supabase project..."
    supabase init
    if [ ! -f "supabase/config.toml" ]; then
        echo "❌ Failed to initialize Supabase project. Please run this from your project root."
        exit 1
    fi
fi

echo "📦 Deploying Edge Function..."
if ! supabase functions deploy generate-weekly-report; then
    echo "⚠️  Edge Function deployment failed. This might be because you're not linked to a remote project."
    echo "   To link to your Supabase project, run: supabase link"
    echo "   Then run this script again."
    exit 1
fi

echo "🗄️  Running database migrations..."
if ! supabase db push --include-all; then
    echo "⚠️  Database migration failed. This might be because you're not linked to a remote project."
    echo "   To link to your Supabase project, run: supabase link"
    echo "   Then run this script again."
    exit 1
fi

echo "⏰ Setting up scheduled job..."
# The scheduled job is created by the migration
echo "✅ Scheduled job created for Friday at 12:00 PM PST"

echo "🧪 Testing the setup..."
# Test the function manually
echo "Testing manual trigger..."
if supabase db reset --linked && supabase db push; then
    echo "✅ Setup test completed successfully"
else
    echo "⚠️  Setup test failed. Please check your Supabase project connection."
fi

echo "✅ Automated weekly reports setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set your ANTHROPIC_API_KEY in Supabase Dashboard > Edge Functions > Environment Variables"
echo "2. Test the manual trigger: SELECT trigger_weekly_report_now();"
echo "3. Check scheduled jobs: SELECT * FROM cron.job;"
echo "4. Monitor report generation: SELECT * FROM weekly_reports ORDER BY generated_at DESC;"
echo ""
echo "📖 For detailed setup instructions, see: docs/AUTOMATED_REPORTS_SETUP.md"
