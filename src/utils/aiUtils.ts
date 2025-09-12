import Anthropic from '@anthropic-ai/sdk';
import { WeeklyReportSummary, TeamMember } from '../types';

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
6. Individual Member Summaries: For EACH team member, provide a detailed summary including:
   - Their role
   - Key contributions they made this week (extract from their daily updates)
   - Progress summary (what they accomplished vs. what they planned)
   - Any concerns or blockers they mentioned
   - What they're focusing on next week (based on their "today" updates)

IMPORTANT: You MUST provide memberSummaries for EVERY team member mentioned in the data. Extract specific information from their daily standup entries to create meaningful, personalized summaries. Be concise but specific about each person's contributions and progress.`;

    const userPrompt = customPrompt || `Please analyze the following standup data for the week of ${weekStart} to ${weekEnd} and provide a comprehensive summary:

${JSON.stringify(weekData, null, 2)}

CRITICAL: You must analyze each team member's daily updates and create individual summaries. Look at their "yesterday", "today", and "blockers" entries across all days to understand their work patterns and contributions.

Please structure your response as a JSON object with the following format:
{
  "keyAccomplishments": ["accomplishment 1", "accomplishment 2"],
  "ongoingWork": ["ongoing work 1", "ongoing work 2"],
  "blockers": ["blocker 1", "blocker 2"],
  "teamInsights": "Overall team insights and observations",
  "recommendations": ["recommendation 1", "recommendation 2"],
  "memberSummaries": {
    "EXACT_MEMBER_NAME_FROM_DATA": {
      "role": "Member's role from the data",
      "keyContributions": ["Specific contributions extracted from their daily updates"],
      "progress": "Summary of what they accomplished vs. what they planned",
      "concerns": ["Any blockers or concerns they mentioned"],
      "nextWeekFocus": "What they're planning to work on based on their 'today' updates"
    }
  }
}

IMPORTANT: 
- Use the EXACT member names as they appear in the data
- Extract specific information from their daily standup entries
- Make sure every team member gets a summary
- Be concise but specific about each person's work`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
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
  const memberSummaries: Record<string, any> = {};

  let currentSection = '';
  let currentMember = '';
  
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
    } else if (lowerLine.includes('member') || lowerLine.includes('summary')) {
      currentSection = 'member';
    }

    // Check if this line contains a member name (simple heuristic)
    if (currentSection === 'member' && line.includes(':') && !line.startsWith('-') && !line.startsWith('•')) {
      const memberName = line.split(':')[0].trim();
      if (memberName.length > 0 && memberName.length < 50) {
        currentMember = memberName;
        memberSummaries[currentMember] = {
          role: 'Team Member',
          keyContributions: [],
          progress: '',
          concerns: [],
          nextWeekFocus: ''
        };
      }
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
        case 'member':
          if (currentMember && memberSummaries[currentMember]) {
            memberSummaries[currentMember].keyContributions.push(item);
          }
          break;
      }
    } else if (currentSection === 'insights' && line.length > 20) {
      teamInsights = line;
    } else if (currentMember && memberSummaries[currentMember] && line.length > 10) {
      // Try to categorize member-specific content
      if (lowerLine.includes('progress') || lowerLine.includes('accomplished')) {
        memberSummaries[currentMember].progress = line;
      } else if (lowerLine.includes('concern') || lowerLine.includes('blocker')) {
        memberSummaries[currentMember].concerns.push(line);
      } else if (lowerLine.includes('next week') || lowerLine.includes('focus')) {
        memberSummaries[currentMember].nextWeekFocus = line;
      }
    }
  }

  return {
    keyAccomplishments,
    ongoingWork,
    blockers,
    teamInsights: teamInsights || 'AI analysis completed. Review the data for specific insights.',
    recommendations,
    memberSummaries
  };
}

// New AI generation functions for individual fields
export interface AIGenerationRequest {
  memberName: string;
  memberRole: string;
  fieldType: 'yesterday' | 'today' | 'blockers';
  context?: string;
  previousEntries?: TeamMember[];
  targetDate?: string; // Add actual date for context
}

export async function generateFieldContent(request: AIGenerationRequest): Promise<string> {
  try {
    const { memberName, memberRole, fieldType, context, previousEntries, targetDate } = request;
    
    let systemPrompt = '';
    let userPrompt = '';
    
    switch (fieldType) {
      case 'yesterday':
        systemPrompt = `You are an AI assistant helping a team member generate a "What did you do yesterday?" update for their daily standup. 
        
        Generate a brief, direct summary of what they accomplished the previous day. 
        
        The response should be:
        - HTML format with proper tags (use <p>, <ul>, <li>, <strong> tags)
        - Direct and concise - no introductory fluff or explanations
        - Relevant to their role
        - Include specific tasks or accomplishments
        - Be realistic and achievable for one day's work
        - Start immediately with the content, no preamble
        - Use <strong> for bold text, not **markdown** syntax`;
        
        // Filter previous entries to only include entries from the same week or very recent (within last 3 days)
        const recentEntries = previousEntries?.filter(entry => {
          if (!entry.lastUpdated) return false;
          const entryDate = new Date(entry.lastUpdated);
          const threeDaysAgo = new Date();
          threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
          return entryDate >= threeDaysAgo;
        }).slice(-3) || [];
        
        userPrompt = `Generate a brief "What did you do yesterday?" update for:
        - Name: ${memberName}
        - Role: ${memberRole}
        ${targetDate ? `- Date: ${targetDate}` : ''}
        ${context ? `- Additional context: ${context}` : ''}
        ${recentEntries.length > 0 ? `- Recent work context (last 3 days): ${JSON.stringify(recentEntries, null, 2)}` : ''}
        
        Provide a direct, concise summary in HTML format. Use proper HTML tags like <p>, <ul>, <li>, and <strong>. No introductory text or explanations - just the content.`;

        // Debug logging
        console.log('🤖 AI Prompt Data for "yesterday":', {
          memberName,
          memberRole,
          targetDate,
          context,
          previousEntriesCount: previousEntries?.length || 0,
          recentEntriesCount: recentEntries.length,
          recentEntries: recentEntries,
          allPreviousEntries: previousEntries?.slice(-3)
        });
        break;
        
      case 'today':
        systemPrompt = `You are an AI assistant helping a team member generate a "What will you do today?" update for their daily standup.
        
        Based on the team member's role and any previous context, generate a realistic and professional plan for what they should focus on today.
        
        The response should be:
        - HTML format with proper tags (use <p>, <ul>, <li>, <strong> tags)
        - Professional and actionable
        - Relevant to their role
        - Include specific tasks or goals
        - Be realistic and achievable for one day's work
        - Show progression from previous work if applicable
        - Use <strong> for bold text, not **markdown** syntax`;
        
        userPrompt = `Generate a "What will you do today?" update for:
        - Name: ${memberName}
        - Role: ${memberRole}
        ${context ? `- Additional context: ${context}` : ''}
        ${previousEntries && previousEntries.length > 0 ? `- Previous entries for context: ${JSON.stringify(previousEntries.slice(-3), null, 2)}` : ''}
        
        Please provide a realistic plan in HTML format. Use proper HTML tags like <p>, <ul>, <li>, and <strong>.`;
        break;
        
      case 'blockers':
        systemPrompt = `You are an AI assistant helping a team member generate a "Any blockers or challenges?" update for their daily standup.
        
        Based on the team member's role and any previous context, generate realistic potential blockers or challenges they might face.
        
        The response should be:
        - HTML format with proper tags (use <p>, <ul>, <li>, <strong> tags)
        - Professional and specific
        - Relevant to their role and typical work challenges
        - Include actionable blockers (not just general complaints)
        - Be realistic and common in their field
        - Can include dependencies, technical issues, or resource constraints
        - Use <strong> for bold text, not **markdown** syntax`;
        
        userPrompt = `Generate potential "blockers or challenges" for:
        - Name: ${memberName}
        - Role: ${memberRole}
        ${context ? `- Additional context: ${context}` : ''}
        ${previousEntries && previousEntries.length > 0 ? `- Previous entries for context: ${JSON.stringify(previousEntries.slice(-3), null, 2)}` : ''}
        
        Please provide realistic blockers or challenges in HTML format. Use proper HTML tags like <p>, <ul>, <li>, and <strong>. If they have no blockers, you can indicate that as well.`;
        break;
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
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
      return content.text.trim();
    }

    throw new Error('Failed to generate AI content');
  } catch (error) {
    console.error('AI field generation failed:', error);
    return `AI generation failed. Please enter your ${request.fieldType} update manually.`;
  }
}

export async function generateFullReport(memberName: string, memberRole: string, previousEntries?: TeamMember[], targetDate?: string): Promise<{
  yesterday: string;
  today: string;
  blockers: string;
}> {
  try {
    const [yesterday, today, blockers] = await Promise.all([
      generateFieldContent({
        memberName,
        memberRole,
        fieldType: 'yesterday',
        previousEntries,
        targetDate
      }),
      generateFieldContent({
        memberName,
        memberRole,
        fieldType: 'today',
        previousEntries
      }),
      generateFieldContent({
        memberName,
        memberRole,
        fieldType: 'blockers',
        previousEntries
      })
    ]);

    return { yesterday, today, blockers };
  } catch (error) {
    console.error('Full report generation failed:', error);
    return {
      yesterday: 'AI generation failed. Please enter your yesterday update manually.',
      today: 'AI generation failed. Please enter your today update manually.',
      blockers: 'AI generation failed. Please enter your blockers manually.'
    };
  }
}
