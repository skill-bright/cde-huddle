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
    
    // Warn if using localhost - edge functions are only available on production Supabase URL
    if (this.supabaseUrl.includes('localhost') || this.supabaseUrl.includes('127.0.0.1')) {
      console.warn('⚠️ WARNING: Using localhost Supabase URL. Edge functions are only available on production Supabase URLs.');
      console.warn('⚠️ Please set VITE_SUPABASE_URL to your production Supabase URL (e.g., https://your-project.supabase.co)');
    }
  }

  /**
   * Generate AI summary for a weekly report
   */
  async generateWeeklySummary(report: WeeklyReport): Promise<WeeklyReportSummary> {
    try {
      console.log('🤖 Generating AI summary for report:', {
        weekStart: report.weekStart,
        weekEnd: report.weekEnd,
        entriesCount: report.entries.length,
        totalUpdates: report.getTotalUpdates()
      });

      const prompt = this.buildWeeklySummaryPrompt(report);
      console.log('📝 AI Prompt length:', prompt.length);
      
      const response = await this.callAnthropicAPI({
        model: 'claude-3-opus-20240229',
        max_tokens: 8000,
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
      console.log('🤖 AI Response length:', content.length);
      console.log('🤖 AI Response preview:', content.substring(0, 200) + '...');
      
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
        model: 'claude-3-opus-20240229',
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
      // Filter previous entries to only include entries for the selected team member
      const memberPreviousEntries = previousEntries?.filter(member => member.name === memberName) || [];
      
      const [yesterday, today, blockers] = await Promise.all([
        this.generateFieldContent(memberName, memberRole, 'yesterday', undefined, memberPreviousEntries),
        this.generateFieldContent(memberName, memberRole, 'today', undefined, memberPreviousEntries),
        this.generateFieldContent(memberName, memberRole, 'blockers', undefined, memberPreviousEntries)
      ]);

      return { yesterday, today, blockers };
    } catch (error) {
      console.error('Failed to generate full report:', error);
      throw new Error('Failed to generate AI report');
    }
  }

  /**
   * Call Anthropic API through Supabase Edge Function proxy with retry logic
   */
  private async callAnthropicAPI(requestBody: Record<string, unknown>, retryCount: number = 0): Promise<Record<string, unknown>> {
    const maxRetries = 2;
    const retryDelay = 2000; // 2 seconds
    
    const functionUrl = `${this.supabaseUrl}/functions/v1/anthropic-proxy`;
    console.log('🔗 Calling Edge Function:', functionUrl);
    console.log('🔗 Supabase URL:', this.supabaseUrl);
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Log detailed error information for debugging
      console.error('❌ Edge Function Error:', {
        status: response.status,
        statusText: response.statusText,
        url: functionUrl,
        supabaseUrl: this.supabaseUrl,
        errorData: errorData
      });
      
      // Provide more specific error messages
      if (response.status === 401) {
        throw new Error('API key not configured. Please set up your Anthropic API key in the database.');
      } else if (response.status === 403) {
        throw new Error('Invalid API key. Please check your Anthropic API key configuration.');
      } else if (response.status === 404) {
        // Check if this is an Anthropic API error (model not found) or edge function error
        const errorMessage = errorData.error?.message || (typeof errorData.error === 'string' ? errorData.error : '') || '';
        if (errorMessage.includes('model:') || errorData.error?.type === 'not_found_error') {
          throw new Error(`Anthropic model not found: "${errorMessage}". The model name may be incorrect. Please check Anthropic's API documentation for valid model names (e.g., claude-3-opus-20240229, claude-3-sonnet-20240229).`);
        } else {
          throw new Error(`Edge Function not found at ${functionUrl}. Please verify:\n1. The function is deployed: supabase functions list\n2. VITE_SUPABASE_URL is correct: ${this.supabaseUrl}\n3. You're using the production URL, not localhost`);
        }
      } else if (response.status === 429) {
        // Retry 429 errors (rate limit) up to maxRetries times
        if (retryCount < maxRetries) {
          console.log(`🔄 Retrying API call due to rate limit (attempt ${retryCount + 1}/${maxRetries + 1})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));
          return this.callAnthropicAPI(requestBody, retryCount + 1);
        }
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      } else if (response.status === 529) {
        // Retry 529 errors (service unavailable) up to maxRetries times
        if (retryCount < maxRetries) {
          console.log(`🔄 Retrying API call due to 529 error (attempt ${retryCount + 1}/${maxRetries + 1})`);
          await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));
          return this.callAnthropicAPI(requestBody, retryCount + 1);
        }
        throw new Error('Service temporarily unavailable. The AI service is experiencing high load. Please try again in a few minutes.');
      } else if (response.status === 500) {
        if (errorData.error?.includes('API key')) {
          throw new Error('API key error. Please verify your Anthropic API key is correct.');
        }
        throw new Error('Server error. Please check the Edge Function deployment.');
      } else {
        console.error('API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData
        });
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

    console.log('📝 Building prompt with entries:', entries.length);
    entries.forEach((entry, index) => {
      console.log(`📝 Entry ${index + 1}:`, {
        date: entry.date,
        teamMembersCount: entry.teamMembers.length,
        teamMembers: entry.teamMembers.map(m => ({
          name: m.name,
          role: m.role,
          hasYesterday: !!m.yesterday,
          hasToday: !!m.today,
          hasBlockers: !!m.blockers
        }))
      });
    });

    const entriesText = entries.map((entry) => {
      return entry.teamMembers.map((member) => {
        return `**${member.name}** (${member.role}) - ${entry.date}:
- Yesterday: ${member.yesterday || 'No update'}
- Today: ${member.today || 'No update'}
- Blockers: ${member.blockers || 'None'}`;
      }).join('\n\n');
    }).join('\n\n');

    const prompt = `You are an AI assistant that creates comprehensive weekly standup summaries for a development team. 

Please analyze the following weekly standup entries and create a detailed, in-depth summary that includes:

1. **Team Overview**: A comprehensive high-level summary of what the team accomplished this week, including major themes, patterns, and overall progress
2. **Key Achievements**: Detailed list of major milestones, completed features, significant progress, and notable accomplishments
3. **Challenges & Blockers**: Any obstacles, technical challenges, dependencies, or blockers the team faced, with context about their impact
4. **Individual Highlights**: Detailed analysis of each team member's contributions, including:
   - Specific accomplishments and deliverables
   - Technical challenges they overcame
   - Skills demonstrated or developed
   - Collaboration and communication patterns
   - Areas where they excelled or showed growth
5. **Next Week Focus**: Strategic recommendations for priorities, goals, and areas of focus for the upcoming week

**IMPORTANT**: For each team member, provide detailed, specific insights based on their actual standup entries. Don't give generic responses - analyze their specific work, challenges, and contributions mentioned in their updates.

Format your response as a JSON object with the following structure:
{
  "teamOverview": "Detailed 2-3 paragraph overview of the team's week",
  "keyAchievements": ["Specific achievement 1", "Specific achievement 2", "etc."],
  "challenges": ["Specific challenge 1 with context", "Specific challenge 2 with context", "etc."],
  "individualHighlights": {
    "memberName": {
      "role": "Their role",
      "achievements": ["Specific accomplishment 1", "Specific accomplishment 2", "etc."],
      "focus": "Detailed analysis of their work focus and contributions this week",
      "nextWeekFocus": "Specific recommendations for their next week priorities"
    }
  },
  "nextWeekFocus": ["Strategic priority 1", "Strategic priority 2", "etc."]
}

Weekly Standup Entries:
${entriesText}

Please provide a comprehensive, professional summary that would be valuable for team retrospectives and stakeholder updates. Focus on extracting meaningful insights from the standup data and provide specific, actionable information for each team member. Be thorough and detailed in your analysis.`;

    console.log('📝 Final prompt preview:', prompt.substring(0, 500) + '...');
    console.log('📝 Entries text preview:', entriesText.substring(0, 500) + '...');
    
    return prompt;
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
    
    // Filter previous entries to only include entries for the selected team member
    const memberPreviousEntries = previousEntries?.filter(member => member.name === memberName) || [];
    
    // For yesterday field, provide more specific context about what "yesterday" means
    let previousEntriesText = '';
    if (memberPreviousEntries.length > 0) {
      if (fieldType === 'yesterday') {
        // For yesterday field, provide context about what was planned vs accomplished
        previousEntriesText = `\n\nYour recent work context to help generate yesterday's accomplishments:\n${memberPreviousEntries.map(member => 
          `- Previous Today plans: ${member.today || 'No previous plans'}\n- Previous Yesterday work: ${member.yesterday || 'No previous work'}\n- Previous Blockers: ${member.blockers || 'None'}`
        ).join('\n\n')}`;
      } else {
        // For other fields, use standard context
        previousEntriesText = `\n\nYour previous entries for context:\n${memberPreviousEntries.map(member => 
          `- Yesterday: ${member.yesterday || 'No update'}\n- Today: ${member.today || 'No update'}\n- Blockers: ${member.blockers || 'None'}`
        ).join('\n\n')}`;
      }
    }

    // Add specific guidance for yesterday field
    const yesterdayGuidance = fieldType === 'yesterday' 
      ? `\n\nIMPORTANT: For the "yesterday" field, generate realistic accomplishments based on what they likely worked on yesterday. Consider their role, previous work patterns, and any planned tasks from their previous updates.`
      : '';

    return `You are an AI assistant helping a team member write their standup update.

        Team Member: ${memberName}
        Role: ${memberRole}
        Field: ${fieldDescriptions[fieldType]}

        Please generate a realistic, professional standup update for ${fieldDescriptions[fieldType]}. The response should be:
        - 1-3 sentences long
        - Professional and concise
        - Relevant to their role as a ${memberRole}
        - Realistic and specific (not generic)
        - Consistent with their previous work patterns${contextText}${previousEntriesText}${yesterdayGuidance}

        Generate only the standup content, no additional formatting or explanations.
        `;
  }

  /**
   * Parse the AI response into a WeeklyReportSummary object
   */
  private parseWeeklySummaryResponse(content: string): WeeklyReportSummary {
    try {
      console.log('🔍 Parsing AI response...');
      
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const summaryData = JSON.parse(jsonMatch[0]);
      console.log('📊 Parsed AI data:', {
        hasKeyAchievements: !!summaryData.keyAchievements,
        keyAchievementsCount: summaryData.keyAchievements?.length || 0,
        hasIndividualHighlights: !!summaryData.individualHighlights,
        individualHighlightsCount: Object.keys(summaryData.individualHighlights || {}).length,
        hasTeamOverview: !!summaryData.teamOverview
      });
      
      // Transform the AI response to match the expected WeeklyReportSummary structure
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const memberSummaries: Record<string, any> = {};
      
      // Process individual highlights into member summaries
      if (summaryData.individualHighlights) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.entries(summaryData.individualHighlights).forEach(([memberName, memberData]: [string, any]) => {
          // Ensure we have meaningful content for each field
          const achievements = memberData.achievements || [];
          const focus = memberData.focus || 'No progress information available';
          const nextWeekFocus = memberData.nextWeekFocus || 'No focus areas defined';
          
          // If we have achievements, make sure they're detailed
          const detailedAchievements = achievements.length > 0 
            ? achievements 
            : ['No specific accomplishments recorded this week'];
            
          // If we have focus information, make it more detailed
          const detailedFocus = focus && focus !== 'No progress information available' 
            ? focus 
            : 'Work progress details not available from standup entries';
            
          // If we have next week focus, make it more specific
          const detailedNextWeekFocus = nextWeekFocus && nextWeekFocus !== 'No focus areas defined'
            ? nextWeekFocus
            : 'Focus areas will be determined based on upcoming priorities';
          
          memberSummaries[memberName] = {
            role: memberData.role || 'Team Member',
            keyContributions: detailedAchievements,
            progress: detailedFocus,
            concerns: [], // We'll populate this from blockers analysis
            nextWeekFocus: detailedNextWeekFocus
          };
        });
      }
      
      // Create a more comprehensive team insights section
      const teamInsights = summaryData.teamOverview || 'No team overview provided';
      const enhancedTeamInsights = teamInsights.length > 50 
        ? teamInsights 
        : `Team Overview: ${teamInsights}. This week the team focused on core development activities and collaboration.`;
      
      const result = new WeeklyReportSummary(
        summaryData.keyAchievements || [],
        [], // ongoingWork - not provided by AI
        summaryData.challenges || [],
        enhancedTeamInsights,
        summaryData.nextWeekFocus || [],
        memberSummaries
      );
      
      console.log('✅ Final summary structure:', {
        keyAccomplishmentsCount: result.keyAccomplishments.length,
        blockersCount: result.blockers.length,
        memberSummariesCount: Object.keys(result.memberSummaries).length,
        teamInsightsLength: result.teamInsights.length
      });
      
      return result;
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      console.log('📄 Raw content for debugging:', content.substring(0, 1000));
      
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
