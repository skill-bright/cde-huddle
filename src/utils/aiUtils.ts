import Anthropic from '@anthropic-ai/sdk';
import { WeeklyReportSummary } from '../types';

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true, // Required for browser environments
});

interface StandupEntry {
  date: string;
  teamMembers: Array<{
    name: string;
    role: string;
    yesterday: string;
    today: string;
    blockers: string;
  }>;
}

export interface AISummaryRequest {
  weekStart: string;
  weekEnd: string;
  entries: StandupEntry[];
  customPrompt?: string;
}

export async function generateWeeklySummary(request: AISummaryRequest): Promise<WeeklyReportSummary> {
  try {
    const { weekStart, weekEnd, entries, customPrompt } = request;
    
    // Prepare the data for AI analysis
    const weekData = entries.map(entry => ({
      date: entry.date,
      teamMembers: entry.teamMembers.map(member => ({
        name: member.name,
        role: member.role,
        yesterday: member.yesterday,
        today: member.today,
        blockers: member.blockers
      }))
    }));

    const systemPrompt = `You are an expert project manager and team analyst. Your task is to analyze a week's worth of daily standup data and provide a comprehensive summary that includes:

1. Key Accomplishments: What major milestones or achievements were completed this week?
2. Ongoing Work: What work is still in progress or planned for next week?
3. Blockers: What obstacles or challenges were identified?
4. Team Insights: Overall observations about team productivity, collaboration, and patterns
5. Recommendations: Actionable suggestions for improving team performance or addressing issues
6. Individual Member Summaries: Brief summary for each team member highlighting their key contributions, progress, and any concerns

Focus on extracting meaningful insights that would be valuable for stakeholders, managers, and the team itself. Be concise but thorough.`;

    const userPrompt = customPrompt || `Please analyze the following standup data for the week of ${weekStart} to ${weekEnd} and provide a comprehensive summary:

${JSON.stringify(weekData, null, 2)}

Please structure your response as a JSON object with the following format:
{
  "keyAccomplishments": ["accomplishment 1", "accomplishment 2"],
  "ongoingWork": ["ongoing work 1", "ongoing work 2"],
  "blockers": ["blocker 1", "blocker 2"],
  "teamInsights": "Overall team insights and observations",
  "recommendations": ["recommendation 1", "recommendation 2"],
  "memberSummaries": {
    "Member Name": {
      "role": "Member's role",
      "keyContributions": ["contribution 1", "contribution 2"],
      "progress": "Brief progress summary",
      "concerns": ["concern 1", "concern 2"],
      "nextWeekFocus": "What they're focusing on next week"
    }
  }
}`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    });

    const content = message.content[0];
    if (content.type === 'text') {
      try {
        // Try to parse the JSON response
        const summary = JSON.parse(content.text);
        return {
          keyAccomplishments: summary.keyAccomplishments || [],
          ongoingWork: summary.ongoingWork || [],
          blockers: summary.blockers || [],
          teamInsights: summary.teamInsights || '',
          recommendations: summary.recommendations || [],
          memberSummaries: summary.memberSummaries || {}
        };
              } catch {
          // If JSON parsing fails, extract insights from the text
          return extractInsightsFromText(content.text);
        }
    }

    throw new Error('Failed to generate AI summary');
  } catch (error) {
    console.error('AI Summary generation failed:', error);
    // Return a fallback summary
    return {
      keyAccomplishments: [],
      ongoingWork: [],
      blockers: [],
      teamInsights: 'AI summary generation failed. Please review the data manually.',
      recommendations: [],
      memberSummaries: {}
    };
  }
}

function extractInsightsFromText(text: string): WeeklyReportSummary {
  // Fallback function to extract insights from AI text response
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const keyAccomplishments: string[] = [];
  const ongoingWork: string[] = [];
  const blockers: string[] = [];
  const recommendations: string[] = [];
  let teamInsights = '';

  let currentSection = '';
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    if (lowerLine.includes('accomplishment') || lowerLine.includes('completed') || lowerLine.includes('finished')) {
      currentSection = 'accomplishments';
    } else if (lowerLine.includes('ongoing') || lowerLine.includes('in progress') || lowerLine.includes('planned')) {
      currentSection = 'ongoing';
    } else if (lowerLine.includes('blocker') || lowerLine.includes('challenge') || lowerLine.includes('obstacle')) {
      currentSection = 'blockers';
    } else if (lowerLine.includes('recommendation') || lowerLine.includes('suggestion') || lowerLine.includes('action')) {
      currentSection = 'recommendations';
    } else if (lowerLine.includes('insight') || lowerLine.includes('observation') || lowerLine.includes('pattern')) {
      currentSection = 'insights';
    }

    if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
      const item = line.substring(1).trim();
      switch (currentSection) {
        case 'accomplishments':
          keyAccomplishments.push(item);
          break;
        case 'ongoing':
          ongoingWork.push(item);
          break;
        case 'blockers':
          blockers.push(item);
          break;
        case 'recommendations':
          recommendations.push(item);
          break;
      }
    } else if (currentSection === 'insights' && line.length > 20) {
      teamInsights = line;
    }
  }

  return {
    keyAccomplishments,
    ongoingWork,
    blockers,
    teamInsights: teamInsights || 'AI analysis completed. Review the data for specific insights.',
    recommendations,
    memberSummaries: {}
  };
}
