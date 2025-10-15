import { AIService } from '@/application/services/AIService';
import { WeeklyReportSummary } from '@/domain/value-objects/WeeklyReportSummary';
import { WeeklyReport } from '@/domain/entities/WeeklyReport';
import { TeamMember } from '@/domain/entities/TeamMember';

/**
 * Secure Anthropic AI Service that uses Supabase Edge Function proxy
 * This prevents API keys from being exposed on the client side
 */
export class SecureAnthropicAIService implements AIService {
  private supabaseUrl: string;

  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    if (!this.supabaseUrl) {
      throw new Error('Missing VITE_SUPABASE_URL environment variable');
    }
  }

  /**
   * Generate AI summary for a weekly report
   */
  async generateWeeklySummary(report: WeeklyReport): Promise<WeeklyReportSummary> {
    try {
      const prompt = this.buildWeeklySummaryPrompt(report);
      
      const response = await this.callAnthropicAPI({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const contentArray = response.content as Array<{ text: string }>;
      if (!contentArray || contentArray.length === 0) {
        throw new Error('No content received from AI service');
      }

      const content = contentArray[0].text;
      return this.parseWeeklySummaryResponse(content);
    } catch (error) {
      console.error('Failed to generate weekly summary:', error);
      throw new Error('Failed to generate AI summary');
    }
  }

  /**
   * Regenerate AI summary for an existing report
   */
  async regenerateWeeklySummary(report: WeeklyReport): Promise<WeeklyReportSummary> {
    return this.generateWeeklySummary(report);
  }

  /**
   * Generate content for a specific field
   */
  async generateFieldContent(
    memberName: string,
    memberRole: string,
    fieldType: 'yesterday' | 'today' | 'blockers',
    context?: string,
    previousEntries?: TeamMember[]
  ): Promise<string> {
    try {
      const prompt = this.buildFieldContentPrompt(memberName, memberRole, fieldType, context, previousEntries);
      
      const response = await this.callAnthropicAPI({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const contentArray = response.content as Array<{ text: string }>;
      if (!contentArray || contentArray.length === 0) {
        throw new Error('No content received from AI service');
      }

      return contentArray[0].text;
    } catch (error) {
      console.error('Failed to generate field content:', error);
      throw new Error('Failed to generate AI content');
    }
  }

  /**
   * Generate a full report for a team member
   */
  async generateFullReport(
    memberName: string,
    memberRole: string,
    previousEntries?: TeamMember[]
  ): Promise<{
    yesterday: string;
    today: string;
    blockers: string;
  }> {
    try {
      const [yesterday, today, blockers] = await Promise.all([
        this.generateFieldContent(memberName, memberRole, 'yesterday', undefined, previousEntries),
        this.generateFieldContent(memberName, memberRole, 'today', undefined, previousEntries),
        this.generateFieldContent(memberName, memberRole, 'blockers', undefined, previousEntries)
      ]);

      return { yesterday, today, blockers };
    } catch (error) {
      console.error('Failed to generate full report:', error);
      throw new Error('Failed to generate AI report');
    }
  }

  /**
   * Call Anthropic API through Supabase Edge Function proxy
   */
  private async callAnthropicAPI(requestBody: Record<string, unknown>): Promise<Record<string, unknown>> {
    const response = await fetch(`${this.supabaseUrl}/functions/v1/anthropic-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Provide more specific error messages
      if (response.status === 401) {
        throw new Error('API key not configured. Please set up your Anthropic API key in the database.');
      } else if (response.status === 403) {
        throw new Error('Invalid API key. Please check your Anthropic API key configuration.');
      } else if (response.status === 404) {
        throw new Error('Edge Function not found. Please deploy the anthropic-proxy function.');
      } else if (response.status === 500) {
        if (errorData.error?.includes('API key')) {
          throw new Error('API key error. Please verify your Anthropic API key is correct.');
        }
        throw new Error('Server error. Please check the Edge Function deployment.');
      } else {
        throw new Error(`API request failed: ${response.status} ${errorData.error || response.statusText}`);
      }
    }

    return await response.json();
  }

  /**
   * Build the prompt for weekly summary generation
   */
  private buildWeeklySummaryPrompt(report: WeeklyReport): string {
    const entries = report.entries;
    
    if (entries.length === 0) {
      throw new Error('No entries found in report to generate summary');
    }

    const entriesText = entries.map((entry) => {
      const member = entry.teamMembers[0]; // Assuming first team member
      
      return `**${member.name}** (${member.role}):
- Yesterday: ${member.yesterday || 'No update'}
- Today: ${member.today || 'No update'}
- Blockers: ${member.blockers || 'None'}`;
    }).join('\n\n');

    return `You are an AI assistant that creates comprehensive weekly standup summaries for a development team. 

Please analyze the following weekly standup entries and create a detailed summary that includes:

1. **Team Overview**: A high-level summary of what the team accomplished this week
2. **Key Achievements**: Major milestones, completed features, or significant progress
3. **Challenges & Blockers**: Any obstacles the team faced
4. **Individual Highlights**: Notable contributions from each team member
5. **Next Week Focus**: Recommended priorities and goals for the upcoming week

Format your response as a JSON object with the following structure:
{
  "teamOverview": "string",
  "keyAchievements": ["string"],
  "challenges": ["string"],
  "individualHighlights": {
    "memberName": {
      "achievements": ["string"],
      "focus": "string",
      "nextWeekFocus": "string"
    }
  },
  "nextWeekFocus": ["string"]
}

Weekly Standup Entries:
${entriesText}

Please provide a comprehensive, professional summary that would be valuable for team retrospectives and stakeholder updates.`;
  }

  /**
   * Build the prompt for field content generation
   */
  private buildFieldContentPrompt(
    memberName: string,
    memberRole: string,
    fieldType: 'yesterday' | 'today' | 'blockers',
    context?: string,
    previousEntries?: TeamMember[]
  ): string {
    const fieldDescriptions = {
      yesterday: 'what you accomplished yesterday',
      today: 'what you plan to work on today',
      blockers: 'any blockers or challenges you\'re facing'
    };

    const contextText = context ? `\n\nAdditional context: ${context}` : '';
    const previousEntriesText = previousEntries && previousEntries.length > 0 
      ? `\n\nPrevious team entries for context:\n${previousEntries.map(member => `- ${member.name} (${member.role})`).join('\n')}`
      : '';

    return `You are an AI assistant helping a team member write their standup update.

Team Member: ${memberName}
Role: ${memberRole}
Field: ${fieldDescriptions[fieldType]}

Please generate a realistic, professional standup update for ${fieldDescriptions[fieldType]}. The response should be:
- 1-3 sentences long
- Professional and concise
- Relevant to their role as a ${memberRole}
- Realistic and specific (not generic)${contextText}${previousEntriesText}

Generate only the standup content, no additional formatting or explanations.`;
  }

  /**
   * Parse the AI response into a WeeklyReportSummary object
   */
  private parseWeeklySummaryResponse(content: string): WeeklyReportSummary {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const summaryData = JSON.parse(jsonMatch[0]);
      
      return new WeeklyReportSummary(
        summaryData.keyAchievements || [],
        summaryData.ongoingWork || [],
        summaryData.challenges || [],
        summaryData.teamOverview || 'No team overview provided',
        summaryData.nextWeekFocus || [],
        summaryData.individualHighlights || {}
      );
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      
      // Fallback: create a basic summary from the raw content
      return new WeeklyReportSummary(
        [],
        [],
        [],
        content.substring(0, 500) + (content.length > 500 ? '...' : ''),
        [],
        {}
      );
    }
  }
}
