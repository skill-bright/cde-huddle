# Setup Guide

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Anthropic API Configuration (for AI-powered weekly reports)
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key
```

### Getting Your API Keys

#### Supabase
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Navigate to Settings > API
3. Copy the Project URL and anon/public key

#### Anthropic
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an account and generate an API key
3. Copy the API key

## Database Setup

The application requires the following Supabase tables. Run the migrations in the `supabase/migrations/` directory:

1. `20250811231832_long_thunder.sql` - Creates the initial tables
2. `20250812000000_fix_rls_policies.sql` - Sets up Row Level Security policies

## Running the Application

1. Install dependencies:
```bash
pnpm install
```

2. Start the development server:
```bash
pnpm dev
```

3. Open your browser to the URL shown in the terminal (usually `http://localhost:5173`)

## Weekly Report Feature

The weekly report feature requires the Anthropic API key to function. Without it, you can still generate basic reports without AI analysis.

To test the AI features:
1. Ensure your `VITE_ANTHROPIC_API_KEY` is set
2. Navigate to the "Weekly Reports" tab
3. Click "Generate Report" to create an AI-powered weekly summary

## Security Note

⚠️ **Important**: The AI integration runs in the browser and exposes your API key to the client. This is necessary for the current architecture but comes with security risks:

- **API Key Exposure**: Your Anthropic API key will be visible in the browser's network tab
- **Rate Limiting**: Users can potentially exhaust your API quota
- **Cost Control**: Monitor your Anthropic usage to control costs

**Recommended Mitigations:**
- Use environment-specific API keys (development vs production)
- Implement rate limiting on your API key
- Consider moving AI calls to a backend service for production use
- Monitor API usage and set up alerts
