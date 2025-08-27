# Database Setup Guide

## Weekly Reports Feature Setup

The weekly reports feature requires the `weekly_reports` table to be created in your Supabase database. If you're seeing the error "Could not find the table 'public.weekly_reports'", follow these steps:

### 1. Environment Variables

First, ensure you have the required environment variables set up. Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 2. Database Migrations

The application includes database migrations in the `supabase/migrations/` directory. You need to apply these migrations to your Supabase database:

#### Option A: Using Supabase CLI (Recommended)

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. Apply migrations:
   ```bash
   supabase db push
   ```

#### Option B: Manual SQL Execution

If you don't have the Supabase CLI, you can manually execute the SQL migrations in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Execute the migrations in order:

   **First migration** (`20250811231832_long_thunder.sql`):
   ```sql
   -- Copy and paste the content of this file
   ```

   **Second migration** (`20250812000000_fix_rls_policies.sql`):
   ```sql
   -- Copy and paste the content of this file
   ```

   **Third migration** (`20250813000000_add_weekly_reports.sql`):
   ```sql
   -- Copy and paste the content of this file
   ```

### 3. Verify Setup

After applying the migrations, you should see the following tables in your Supabase database:

- `team_members`
- `standup_entries`
- `standup_updates`
- `weekly_reports`

### 4. Test the Feature

Once the database is set up:

1. Start the development server: `npm run dev`
2. Navigate to the "Weekly Reports" tab
3. The stored reports should now load without errors
4. Weekly reports will be automatically generated every Friday at 12:00 PM PST

### Troubleshooting

#### Error: "Could not find the table 'public.weekly_reports'"

This error occurs when the `weekly_reports` table doesn't exist. The application will handle this gracefully and show a setup message, but you should:

1. Check that all migrations have been applied
2. Verify your Supabase connection in the `.env` file
3. Ensure you have the correct permissions to create tables

#### Error: "Missing Supabase environment variables"

This error occurs when the environment variables are not set. Make sure your `.env` file exists and contains the required variables.

#### Weekly reports not generating automatically

The automatic generation runs every Friday at 12:00 PM PST. To test:

1. Check the browser console for any errors
2. Ensure notification permissions are granted
3. Verify the scheduler is running (check console logs)

### Support

If you continue to have issues:

1. Check the browser console for detailed error messages
2. Verify your Supabase project settings
3. Ensure all environment variables are correctly set
4. Check that the migrations executed successfully in your Supabase dashboard
