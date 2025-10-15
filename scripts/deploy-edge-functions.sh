#!/bin/bash

# Deploy Supabase Edge Functions
# This script deploys the anthropic-proxy Edge Function

echo "🚀 Deploying Supabase Edge Functions..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're logged in
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase. Please run:"
    echo "   supabase login"
    exit 1
fi

# Deploy the anthropic-proxy function
echo "📦 Deploying anthropic-proxy function..."
supabase functions deploy anthropic-proxy --project-ref hmmdesayqppsvdcsrmjz --use-api

if [ $? -eq 0 ]; then
    echo "✅ Successfully deployed anthropic-proxy function!"
    echo ""
    echo "🔧 Next steps:"
    echo "1. Run the API keys setup script in your Supabase Dashboard > SQL Editor:"
    echo "   scripts/setup-api-keys.sql"
    echo ""
    echo "2. Replace 'YOUR_ANTHROPIC_API_KEY_HERE' with your actual Anthropic API key"
    echo ""
    echo "3. Remove VITE_ANTHROPIC_API_KEY from your .env file (it's no longer needed)"
    echo ""
    echo "4. Test the AI functionality to ensure it's working with the secure proxy"
else
    echo "❌ Failed to deploy anthropic-proxy function"
    exit 1
fi
