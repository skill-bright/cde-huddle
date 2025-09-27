import Anthropic from '@anthropic-ai/sdk';
import { AIService } from '@/application/services/AIService';
import { WeeklyReport } from '@/domain/entities/WeeklyReport';
import { WeeklyReportSummary, MemberSummary } from '@/domain/value-objects/WeeklyReportSummary';
import { TeamMember } from '@/domain/entities/TeamMember';

/**
 * Anthropic AI Service implementation
 * Handles AI operations using Anthropic's Claude API
 */
export class AnthropicAIService implements AIService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
      dangerouslyAllowBrowser: true,
    });
  }

  /**
   * Generate a weekly summary using AI
   */
  async generateWeeklySummary(report: WeeklyReport): Promise<WeeklyReportSummary> {
    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('Anthropic API key is not configured');
      }

      // Prepare the data for AI analysis
      const weekData = report.entries.map(entry => ({
        date: entry.date,
        teamMembers: entry.teamMembers.map(member => ({
          name: member.name,
          role: member.role,
          yesterday: member.yesterday,
          today: member.today,
          blockers: member.blockers
        }))
      }));

      const systemPrompt = `You are a project manager creating a weekly standup summary. 

CRITICAL RULES:
1. The memberSummaries object must use EXACT member names as keys (no quotes around the keys)
2. Do NOT use generic field names like "role", "concerns", "progress" as keys
3. Do NOT escape quotes in JSON keys - use clean member names directly
4. Return ONLY valid JSON without any markdown formatting or code blocks

Return ONLY valid JSON in this exact format:
{
  "keyAccomplishments": ["accomplishment 1", "accomplishment 2"],
  "ongoingWork": ["ongoing work 1", "ongoing work 2"], 
  "blockers": ["blocker 1", "blocker 2"],
  "teamInsights": "Brief team observation",
  "recommendations": ["recommendation 1", "recommendation 2"],
  "memberSummaries": {
    "Francois": {
      "role": "Developer",
      "keyContributions": ["contribution 1", "contribution 2"],
      "progress": "Brief progress summary",
      "concerns": ["concern 1"],
      "nextWeekFocus": "What they're focusing on next"
    }
  }
}`;

      const memberNames = weekData.flatMap(entry => entry.teamMembers.map(member => member.name)).filter((name, index, arr) => arr.indexOf(name) === index);
      
      const userPrompt = `Analyze this standup data for ${report.weekStart} to ${report.weekEnd}:

${JSON.stringify(weekData, null, 2)}

IMPORTANT: The team members are: ${memberNames.join(', ')}

Create a summary with:
1. Team accomplishments, ongoing work, and blockers
2. Individual summaries for each team member

CRITICAL: In memberSummaries, use ONLY these exact names as keys: ${memberNames.join(', ')}
Do NOT use any other keys like "role", "concerns", "progress", etc.

Return only valid JSON.`;

      const message = await this.anthropic.messages.create({
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
          // Clean the response text to extract JSON
          let jsonText = content.text.trim();
          
          // Remove markdown code blocks if present
          if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }
          
          // Try to parse the JSON response
          const summary = JSON.parse(jsonText);
          
          // Clean up malformed member summaries
          const cleanedMemberSummaries: Record<string, MemberSummary> = {};
          if (summary.memberSummaries) {
            const validMemberNames = weekData.flatMap(entry => entry.teamMembers.map(member => member.name)).filter((name, index, arr) => arr.indexOf(name) === index);
            
            Object.entries(summary.memberSummaries).forEach(([key, value]) => {
              const cleanKey = key.replace(/^["']|["']$/g, '');
              const matchingMemberName = validMemberNames.find(name => 
                name.toLowerCase() === cleanKey.toLowerCase()
              );
              
              if (matchingMemberName && typeof value === 'object' && value !== null) {
                const memberData = value as {
                  role: string;
                  keyContributions: string[];
                  progress: string;
                  concerns: string[];
                  nextWeekFocus: string;
                };
                cleanedMemberSummaries[matchingMemberName] = new MemberSummary(
                  memberData.role,
                  memberData.keyContributions,
                  memberData.progress,
                  memberData.concerns,
                  memberData.nextWeekFocus
                );
              }
            });
          }
          
          // If no valid member summaries were generated, create them from the data
          if (Object.keys(cleanedMemberSummaries).length === 0) {
            const validMemberNames = weekData.flatMap(entry => entry.teamMembers.map(member => member.name)).filter((name, index, arr) => arr.indexOf(name) === index);
            
            validMemberNames.forEach(memberName => {
              const memberEntries = weekData.flatMap(entry => entry.teamMembers.filter(member => member.name === memberName));
              const role = memberEntries[0]?.role || 'Developer';
              
              const contributions = memberEntries
                .map(entry => entry.yesterday)
                .filter(Boolean)
                .map(work => {
                  const cleanWork = work.replace(/<[^>]*>/g, '').trim();
                  return cleanWork.split(/[.!?]/)[0] || cleanWork.substring(0, 100);
                })
                .slice(0, 3);
              
              const concerns = memberEntries
                .map(entry => entry.blockers)
                .filter(blocker => blocker && blocker !== '<p>None</p>' && blocker.trim())
                .map(blocker => blocker.replace(/<[^>]*>/g, '').trim())
                .filter(Boolean);
              
              const latestFocus = memberEntries
                .map(entry => entry.today)
                .filter(Boolean)
                .slice(-1)[0];
              
              cleanedMemberSummaries[memberName] = new MemberSummary(
                role,
                contributions.length > 0 ? contributions : [`Worked on ${memberEntries.length} day(s) this week`],
                `Completed work on ${memberEntries.length} day(s) this week with ${contributions.length} key contributions`,
                concerns.length > 0 ? concerns : ['No blockers reported'],
                latestFocus ? latestFocus.replace(/<[^>]*>/g, '').substring(0, 200) : 'Continue current project work'
              );
            });
          }
          
          return new WeeklyReportSummary(
            summary.keyAccomplishments || [],
            summary.ongoingWork || [],
            summary.blockers || [],
            summary.teamInsights || '',
            summary.recommendations || [],
            cleanedMemberSummaries
          );
        } catch (parseError) {
          console.error('JSON parsing failed, using fallback extraction:', parseError);
          return this.extractInsightsFromText(content.text);
        }
      }

      throw new Error('Failed to generate AI summary');
    } catch (error) {
      console.error('AI Summary generation failed:', error);
      return new WeeklyReportSummary(
        [],
        [],
        [],
        'AI summary generation failed. Please review the data manually.',
        [],
        {}
      );
    }
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
      let systemPrompt = '';
      let userPrompt = '';
      
      // Get recent entries for context (used in yesterday case)
      const recentEntries = (() => {
        return previousEntries?.filter(entry => {
          if (!entry.lastUpdated) return false;
          const entryDate = new Date(entry.lastUpdated);
          const threeDaysAgo = new Date();
          threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
          return entryDate >= threeDaysAgo;
        }).slice(-3) || [];
      })();
      
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
          
          userPrompt = `Generate a brief "What did you do yesterday?" update for:
          - Name: ${memberName}
          - Role: ${memberRole}
          ${context ? `- Additional context: ${context}` : ''}
          ${recentEntries.length > 0 ? `- Recent work context (last 3 days): ${JSON.stringify(recentEntries, null, 2)}` : ''}
          
          Provide a direct, concise summary in HTML format. Use proper HTML tags like <p>, <ul>, <li>, and <strong>. No introductory text or explanations - just the content.`;
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

      const message = await this.anthropic.messages.create({
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
      return `AI generation failed. Please enter your ${fieldType} update manually.`;
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
      console.error('Full report generation failed:', error);
      return {
        yesterday: 'AI generation failed. Please enter your yesterday update manually.',
        today: 'AI generation failed. Please enter your today update manually.',
        blockers: 'AI generation failed. Please enter your blockers manually.'
      };
    }
  }

  /**
   * Regenerate AI summary for an existing report
   */
  async regenerateWeeklySummary(report: WeeklyReport): Promise<WeeklyReportSummary> {
    try {
      console.log('🔄 Regenerating AI summary for existing report:', {
        weekStart: report.weekStart,
        weekEnd: report.weekEnd,
        entriesCount: report.entries?.length || 0
      });

      if (!report.entries || report.entries.length === 0) {
        throw new Error('No entries found in report to regenerate summary');
      }

      return await this.generateWeeklySummary(report);
    } catch (error) {
      console.error('Failed to regenerate weekly summary:', error);
      throw error;
    }
  }

  /**
   * Extract insights from AI text response (fallback method)
   */
  private extractInsightsFromText(text: string): WeeklyReportSummary {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    const keyAccomplishments: string[] = [];
    const ongoingWork: string[] = [];
    const blockers: string[] = [];
    const recommendations: string[] = [];
    let teamInsights = '';
    const memberSummaries: Record<string, MemberSummary> = {};

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
          memberSummaries[currentMember] = new MemberSummary(
            'Team Member',
            [],
            '',
            [],
            ''
          );
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
        const currentMemberSummary = memberSummaries[currentMember];
        if (lowerLine.includes('progress') || lowerLine.includes('accomplished')) {
          memberSummaries[currentMember] = new MemberSummary(
            currentMemberSummary.role,
            currentMemberSummary.keyContributions,
            line,
            currentMemberSummary.concerns,
            currentMemberSummary.nextWeekFocus
          );
        } else if (lowerLine.includes('concern') || lowerLine.includes('blocker')) {
          const updatedConcerns = [...currentMemberSummary.concerns, line];
          memberSummaries[currentMember] = new MemberSummary(
            currentMemberSummary.role,
            currentMemberSummary.keyContributions,
            currentMemberSummary.progress,
            updatedConcerns,
            currentMemberSummary.nextWeekFocus
          );
        } else if (lowerLine.includes('next week') || lowerLine.includes('focus')) {
          memberSummaries[currentMember] = new MemberSummary(
            currentMemberSummary.role,
            currentMemberSummary.keyContributions,
            currentMemberSummary.progress,
            currentMemberSummary.concerns,
            line
          );
        }
      }
    }

    return new WeeklyReportSummary(
      keyAccomplishments,
      ongoingWork,
      blockers,
      teamInsights || 'AI analysis completed. Review the data for specific insights.',
      recommendations,
      memberSummaries
    );
  }
}
