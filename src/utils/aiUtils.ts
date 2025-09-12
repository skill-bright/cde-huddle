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
    
    // Check if API key is available
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('🤖 VITE_ANTHROPIC_API_KEY is not set');
      throw new Error('Anthropic API key is not configured');
    }
    
    console.log('🤖 AI Summary Request:', {
      weekStart,
      weekEnd,
      entriesCount: entries.length,
      totalMembers: entries.reduce((acc, entry) => acc + entry.teamMembers.length, 0),
      apiKeyConfigured: !!apiKey
    });
    
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

    console.log('🤖 Prepared week data for AI:', weekData);

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
    },
    "Atena": {
      "role": "Developer",
      "keyContributions": ["contribution 1", "contribution 2"],
      "progress": "Brief progress summary", 
      "concerns": ["concern 1"],
      "nextWeekFocus": "What they're focusing on next"
    }
  }
}`;

    const memberNames = weekData.flatMap(entry => entry.teamMembers.map(member => member.name)).filter((name, index, arr) => arr.indexOf(name) === index);
    
    const userPrompt = customPrompt || `Analyze this standup data for ${weekStart} to ${weekEnd}:

${JSON.stringify(weekData, null, 2)}

IMPORTANT: The team members are: ${memberNames.join(', ')}

Create a summary with:
1. Team accomplishments, ongoing work, and blockers
2. Individual summaries for each team member

CRITICAL: In memberSummaries, use ONLY these exact names as keys: ${memberNames.join(', ')}
Do NOT use any other keys like "role", "concerns", "progress", etc.

Return only valid JSON.`;

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
      console.log('🤖 AI Response received:', content.text.substring(0, 500) + '...');
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
        console.log('🤖 Parsed AI summary:', {
          keyAccomplishments: summary.keyAccomplishments?.length || 0,
          ongoingWork: summary.ongoingWork?.length || 0,
          blockers: summary.blockers?.length || 0,
          memberSummaries: Object.keys(summary.memberSummaries || {}).length,
          memberNames: Object.keys(summary.memberSummaries || {}),
          fullMemberSummaries: summary.memberSummaries
        });
        
        // Clean up malformed member summaries - only keep valid member names
        const cleanedMemberSummaries: Record<string, any> = {};
        if (summary.memberSummaries) {
          const validMemberNames = weekData.flatMap(entry => entry.teamMembers.map(member => member.name)).filter((name, index, arr) => arr.indexOf(name) === index);
          
          Object.entries(summary.memberSummaries).forEach(([key, value]) => {
            // Clean the key by removing quotes and checking if it's a valid member name
            const cleanKey = key.replace(/^["']|["']$/g, ''); // Remove surrounding quotes
            
            // Only keep keys that match actual member names (case-insensitive)
            const matchingMemberName = validMemberNames.find(name => 
              name.toLowerCase() === cleanKey.toLowerCase()
            );
            
            if (matchingMemberName && typeof value === 'object' && value !== null) {
              cleanedMemberSummaries[matchingMemberName] = value;
            }
          });
        }
        
        console.log('🤖 Cleaned member summaries:', {
          originalKeys: Object.keys(summary.memberSummaries || {}),
          cleanedKeys: Object.keys(cleanedMemberSummaries),
          cleanedSummaries: cleanedMemberSummaries
        });
        
        // If no valid member summaries were generated, create them from the data
        if (Object.keys(cleanedMemberSummaries).length === 0) {
          console.log('🤖 No valid member summaries found, generating from data');
          const validMemberNames = weekData.flatMap(entry => entry.teamMembers.map(member => member.name)).filter((name, index, arr) => arr.indexOf(name) === index);
          
          validMemberNames.forEach(memberName => {
            const memberEntries = weekData.flatMap(entry => entry.teamMembers.filter(member => member.name === memberName));
            const role = memberEntries[0]?.role || 'Developer';
            
            // Extract meaningful contributions from yesterday's work
            const contributions = memberEntries
              .map(entry => entry.yesterday)
              .filter(Boolean)
              .map(work => {
                // Extract first meaningful sentence or bullet point
                const cleanWork = work.replace(/<[^>]*>/g, '').trim();
                return cleanWork.split(/[.!?]/)[0] || cleanWork.substring(0, 100);
              })
              .slice(0, 3);
            
            // Extract concerns from blockers
            const concerns = memberEntries
              .map(entry => entry.blockers)
              .filter(blocker => blocker && blocker !== '<p>None</p>' && blocker.trim())
              .map(blocker => blocker.replace(/<[^>]*>/g, '').trim())
              .filter(Boolean);
            
            // Get latest focus from today's work
            const latestFocus = memberEntries
              .map(entry => entry.today)
              .filter(Boolean)
              .slice(-1)[0];
            
            cleanedMemberSummaries[memberName] = {
              role: role,
              keyContributions: contributions.length > 0 ? contributions : [`Worked on ${memberEntries.length} day(s) this week`],
              progress: `Completed work on ${memberEntries.length} day(s) this week with ${contributions.length} key contributions`,
              concerns: concerns.length > 0 ? concerns : ['No blockers reported'],
              nextWeekFocus: latestFocus ? latestFocus.replace(/<[^>]*>/g, '').substring(0, 200) : 'Continue current project work'
            };
          });
        }
        
        return {
          keyAccomplishments: summary.keyAccomplishments || [],
          ongoingWork: summary.ongoingWork || [],
          blockers: summary.blockers || [],
          teamInsights: summary.teamInsights || '',
          recommendations: summary.recommendations || [],
          memberSummaries: cleanedMemberSummaries
        };
      } catch (parseError) {
        console.error('🤖 JSON parsing failed, using fallback extraction:', parseError);
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

/**
 * Regenerate AI summary for an existing weekly report
 * This is useful for fixing malformed summaries or updating with better AI prompts
 */
export async function regenerateWeeklySummary(report: any): Promise<WeeklyReportSummary> {
  try {
    console.log('🔄 Regenerating AI summary for existing report:', {
      weekStart: report.weekStart,
      weekEnd: report.weekEnd,
      entriesCount: report.entries?.length || 0
    });

    if (!report.entries || report.entries.length === 0) {
      throw new Error('No entries found in report to regenerate summary');
    }

    // Convert the report entries to the format expected by generateWeeklySummary
    const entries = report.entries.map((entry: any) => ({
      date: entry.date,
      teamMembers: entry.teamMembers.map((member: any) => ({
        name: member.name,
        role: member.role,
        yesterday: member.yesterday,
        today: member.today,
        blockers: member.blockers
      }))
    }));

    // Generate new summary using the improved AI logic
    const newSummary = await generateWeeklySummary({
      weekStart: report.weekStart,
      weekEnd: report.weekEnd,
      entries: entries
    });

    console.log('✅ Successfully regenerated AI summary:', {
      keyAccomplishments: newSummary.keyAccomplishments?.length || 0,
      ongoingWork: newSummary.ongoingWork?.length || 0,
      blockers: newSummary.blockers?.length || 0,
      memberSummaries: Object.keys(newSummary.memberSummaries || {}).length,
      memberNames: Object.keys(newSummary.memberSummaries || {})
    });

    return newSummary;
  } catch (error) {
    console.error('Failed to regenerate weekly summary:', error);
    throw error;
  }
}
