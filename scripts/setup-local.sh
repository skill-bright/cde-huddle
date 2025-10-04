#!/bin/bash

# Local Setup for Automated Weekly Reports
# This script sets up the system for local development and testing

set -e

echo "🚀 Setting up Automated Weekly Reports (Local Development)..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Initialize Supabase project if needed
if [ ! -f "supabase/config.toml" ]; then
    echo "📦 Initializing Supabase project..."
    supabase init
fi

echo "🗄️  Running database migrations locally..."
supabase db reset
supabase db push

echo "✅ Local setup complete!"
echo ""
echo "📋 Next steps for production deployment:"
echo "1. Login to Supabase: supabase login"
echo "2. Link to your project: supabase link --project-ref YOUR_PROJECT_REF"
echo "3. Deploy Edge Function: supabase functions deploy generate-weekly-report"
echo "4. Set ANTHROPIC_API_KEY in Supabase Dashboard"
echo ""
echo "🧪 Test the local setup:"
echo "   supabase db reset"
echo "   supabase db push"
echo ""
echo "📖 For detailed instructions, see: docs/QUICK_SETUP.md"
