# CDE Huddle - Team Standup Application

A modern team standup application with AI-powered weekly report consolidation.

## Features

### Daily Standup
- Real-time team updates with yesterday's work, today's plans, and blockers
- Rich text editor for detailed updates
- Team member management with roles and avatars
- Standup history and engagement tracking
- Responsive design with masonry layout

### Weekly Reports (NEW!)
- **AI-Powered Analysis**: Uses Anthropic's Claude AI to generate comprehensive weekly summaries
- **Automatic Generation**: Reports are automatically generated every Friday at 12:00 PM PST
- **Stored Reports**: View and manage previously generated weekly reports
- **Consolidated Insights**: Key accomplishments, ongoing work, blockers, and recommendations
- **Individual Member Summaries**: Detailed breakdown for each team member including:
  - Key contributions and achievements
  - Progress summary
  - Concerns and blockers
  - Next week's focus areas
- **Customizable Reports**: Choose date ranges and customize AI prompts
- **Export Functionality**: Download reports as CSV files
- **Team Insights**: AI-generated observations about team productivity and patterns
- **Browser Notifications**: Get notified when new reports are automatically generated

## Setup

### Prerequisites
- Node.js 18+ and pnpm
- Supabase account and project
- Anthropic API key (for AI features)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cde-huddle
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key
```

4. Set up the database:
Run the Supabase migrations in the `supabase/migrations/` directory to create the required tables.

5. Start the development server:
```bash
pnpm dev
```

## Environment Variables

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `VITE_ANTHROPIC_API_KEY`: Your Anthropic API key for AI-powered weekly reports

⚠️ **Security Note**: The AI integration runs client-side and exposes your API key. For production use, consider implementing a backend service to handle AI calls securely.

## Weekly Report Features

### AI Analysis
The weekly report feature uses Anthropic's Claude AI to analyze standup data and provide:

- **Key Accomplishments**: Major milestones and achievements completed during the week
- **Ongoing Work**: Work still in progress or planned for the following week
- **Blockers & Challenges**: Obstacles and issues identified by team members
- **Team Insights**: Overall observations about team productivity and collaboration patterns
- **Recommendations**: Actionable suggestions for improving team performance
- **Individual Member Summaries**: Detailed breakdown for each team member including:
  - Key contributions and achievements
  - Progress summary
  - Concerns and blockers
  - Next week's focus areas

### Customization
- **Date Range Selection**: Choose specific weeks for analysis
- **Custom AI Prompts**: Provide specific instructions to guide the AI analysis
- **AI Toggle**: Option to generate reports with or without AI analysis

### Export Options
- **CSV Export**: Download detailed weekly data for external analysis
- **Formatted Reports**: Beautiful, shareable weekly summaries

## Database Schema

The application uses the following Supabase tables:

- `team_members`: Team member information (id, name, role, avatar)
- `standup_entries`: Daily standup sessions (id, date)
- `standup_updates`: Individual team member updates (standup_entry_id, team_member_id, yesterday, today, blockers)
- `weekly_reports`: Automatically generated weekly reports (week_start, week_end, report_data, status, generated_at)

## Development

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **AI**: Anthropic Claude API
- **Rich Text**: TinyMCE

### Project Structure
```
src/
├── components/          # React components
│   ├── WeeklyReport.tsx # Weekly report component
│   ├── StandupDashboard.tsx # Main dashboard
│   └── ...
├── hooks/              # Custom React hooks
│   └── useStandupData.ts # Data management hook
├── utils/              # Utility functions
│   ├── aiUtils.ts      # AI integration utilities
│   └── dateUtils.ts    # Date handling utilities
└── types.ts            # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
