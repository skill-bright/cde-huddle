import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}


interface StandupEntry {
  id: string;
  date: string;
}

interface StandupUpdate {
  id: string;
  standup_entry_id: string;
  team_member_id: string;
  yesterday: string;
  today: string;
  blockers: string;
  created_at: string;
  standup_entries: StandupEntry;
  team_members: {
    id: string;
    name: string;
    role: string;
    avatar: string;
  };
}

interface TeamMember {
  name: string;
  role: string;
  yesterday: string;
  today: string;
  blockers: string;
}

interface ReportEntry {
  date: string;
  teamMembers: TeamMember[];
}

interface WeeklyReportSummary {
  keyAccomplishments: string[];
  ongoingWork: string[];
  blockers: string[];
  teamInsights: string;
  recommendations: string[];
  memberSummaries: Record<string, {
    role: string;
    keyContributions: string[];
    progress: string;
    concerns: string[];
    nextWeekFocus: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Calculate current week dates (Monday to Sunday)
    const today = new Date()
    const dayOfWeek = today.getDay()
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    
    const monday = new Date(today)
    monday.setDate(today.getDate() - daysToMonday)
    
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    
    const weekStart = monday.toISOString().split('T')[0] // YYYY-MM-DD format
    const weekEnd = sunday.toISOString().split('T')[0]

    console.log(`Generating weekly report for ${weekStart} to ${weekEnd}`)

    // Check if report already exists for this week
    const { data: existingReport, error: checkError } = await supabase
      .from('weekly_reports')
      .select('id')
      .eq('week_start', weekStart)
      .eq('week_end', weekEnd)
      .single()

    if (existingReport && !checkError) {
      console.log('Weekly report already exists for this week')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Weekly report already exists for this week',
          weekStart,
          weekEnd 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Create pending report entry
    const { data: reportEntry, error: insertError } = await supabase
      .from('weekly_reports')
      .insert({
        week_start: weekStart,
        week_end: weekEnd,
        status: 'pending',
        total_updates: 0,
        unique_members: 0
      })
      .select()
      .single()

    if (insertError) {
      throw new Error(`Failed to create report entry: ${insertError.message}`)
    }

    // Fetch all standup entries for the week
    const { data: weekEntries, error: entriesError } = await supabase
      .from('standup_entries')
      .select('id, date')
      .gte('date', weekStart)
      .lte('date', weekEnd)
      .order('date', { ascending: true })

    if (entriesError) {
      throw new Error(`Failed to fetch standup entries: ${entriesError.message}`)
    }

    if (!weekEntries || weekEntries.length === 0) {
      // Update report with no data status
      await supabase
        .from('weekly_reports')
        .update({
          status: 'generated',
          report_data: {
            entries: [],
            summary: {
              keyAccomplishments: [],
              ongoingWork: [],
              blockers: [],
              teamInsights: 'No standup data available for this week.',
              recommendations: [],
              memberSummaries: {}
            }
          },
          total_updates: 0,
          unique_members: 0
        })
        .eq('id', reportEntry.id)

      console.log('No standup data found for this week')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No standup data available for this week',
          weekStart,
          weekEnd 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    const entryIds = weekEntries.map(entry => entry.id)

    // Fetch all updates for the week
    const { data: updates, error: updatesError } = await supabase
      .from('standup_updates')
      .select(`
        *,
        standup_entries!inner(
          id,
          date
        ),
        team_members!inner(
          id,
          name,
          role,
          avatar
        )
      `)
      .in('standup_entry_id', entryIds)
      .order('created_at', { ascending: true })

    if (updatesError) {
      throw new Error(`Failed to fetch standup updates: ${updatesError.message}`)
    }

    // Group updates by date
    const updatesByDate = new Map<string, StandupUpdate[]>()
    
    updates?.forEach(update => {
      const date = update.standup_entries?.date
      if (date) {
        if (!updatesByDate.has(date)) {
          updatesByDate.set(date, [])
        }
        updatesByDate.get(date)!.push(update)
      }
    })

    // Convert to report format
    const reportEntries = Array.from(updatesByDate.entries()).map(([date, dayUpdates]) => ({
      date,
      teamMembers: dayUpdates.map(update => ({
        name: update.team_members.name,
        role: update.team_members.role,
        avatar: update.team_members.avatar,
        yesterday: update.yesterday,
        today: update.today,
        blockers: update.blockers
      }))
    }))

    // Generate AI summary if API key is available
    let aiSummary: WeeklyReportSummary | null = null
    
    if (anthropicApiKey) {
      try {
        aiSummary = await generateAISummary(reportEntries, weekStart, weekEnd, anthropicApiKey)
      } catch (aiError) {
        console.warn('AI summary generation failed:', aiError)
      }
    }

    // Create basic summary if AI failed or not available
    const summary = aiSummary || generateBasicSummary(reportEntries)

    // Prepare report data
    const reportData = {
      entries: reportEntries,
      summary
    }

    // Calculate statistics
    const totalUpdates = updates?.length || 0
    const uniqueMembers = new Set(updates?.map(u => u.team_members.name) || []).size

    // Update the report with generated data
    const { error: updateError } = await supabase
      .from('weekly_reports')
      .update({
        status: 'generated',
        report_data: reportData,
        total_updates: totalUpdates,
        unique_members: uniqueMembers
      })
      .eq('id', reportEntry.id)

    if (updateError) {
      throw new Error(`Failed to update report: ${updateError.message}`)
    }

    console.log(`Successfully generated weekly report for ${weekStart} to ${weekEnd}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Weekly report generated successfully',
        weekStart,
        weekEnd,
        totalUpdates,
        uniqueMembers,
        hasAISummary: !!aiSummary
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Weekly report generation failed:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

async function generateAISummary(reportEntries: ReportEntry[], weekStart: string, weekEnd: string, apiKey: string): Promise<WeeklyReportSummary> {
  const weekData = reportEntries.map(entry => ({
    date: entry.date,
    teamMembers: entry.teamMembers.map((member: TeamMember) => ({
      name: member.name,
      role: member.role,
      yesterday: member.yesterday,
      today: member.today,
      blockers: member.blockers
    }))
  }))

  const memberNames = weekData.flatMap(entry => entry.teamMembers.map((member: TeamMember) => member.name)).filter((name: string, index: number, arr: string[]) => arr.indexOf(name) === index)

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
}`

  const userPrompt = `Analyze this standup data for ${weekStart} to ${weekEnd}:

${JSON.stringify(weekData, null, 2)}

IMPORTANT: The team members are: ${memberNames.join(', ')}

Create a summary with:
1. Team accomplishments, ongoing work, and blockers
2. Individual summaries for each team member

CRITICAL: In memberSummaries, use ONLY these exact names as keys: ${memberNames.join(', ')}
Do NOT use any other keys like "role", "concerns", "progress", etc.

Return only valid JSON.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    })
  })

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.content[0]

  if (content.type === 'text') {
    let jsonText = content.text.trim()
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }
    
    const summary = JSON.parse(jsonText)
    
    // Clean up malformed member summaries
    const cleanedMemberSummaries: Record<string, {
      role: string;
      keyContributions: string[];
      progress: string;
      concerns: string[];
      nextWeekFocus: string;
    }> = {}
    if (summary.memberSummaries) {
      Object.entries(summary.memberSummaries).forEach(([key, value]) => {
        const cleanKey = key.replace(/^["']|["']$/g, '')
        const matchingMemberName = memberNames.find(name => 
          name.toLowerCase() === cleanKey.toLowerCase()
        )
        
        if (matchingMemberName && typeof value === 'object' && value !== null) {
          cleanedMemberSummaries[matchingMemberName] = value
        }
      })
    }
    
    return {
      keyAccomplishments: summary.keyAccomplishments || [],
      ongoingWork: summary.ongoingWork || [],
      blockers: summary.blockers || [],
      teamInsights: summary.teamInsights || '',
      recommendations: summary.recommendations || [],
      memberSummaries: cleanedMemberSummaries
    }
  }

  throw new Error('Failed to generate AI summary')
}

function generateBasicSummary(reportEntries: ReportEntry[]): WeeklyReportSummary {
  const allAccomplishments: string[] = []
  const allOngoingWork: string[] = []
  const allBlockers: string[] = []
  const memberSummaries: Record<string, {
    role: string;
    keyContributions: string[];
    progress: string;
    concerns: string[];
    nextWeekFocus: string;
  }> = {}

  // Extract data from entries
  reportEntries.forEach(entry => {
    entry.teamMembers.forEach((member: TeamMember) => {
      if (member.yesterday) {
        allAccomplishments.push(member.yesterday)
      }
      if (member.today) {
        allOngoingWork.push(member.today)
      }
      if (member.blockers && member.blockers !== '<p>None</p>') {
        allBlockers.push(member.blockers)
      }

      // Build member summaries
      if (!memberSummaries[member.name]) {
        memberSummaries[member.name] = {
          role: member.role,
          keyContributions: [],
          progress: '',
          concerns: [],
          nextWeekFocus: ''
        }
      }

      if (member.yesterday) {
        memberSummaries[member.name].keyContributions.push(member.yesterday)
      }
      if (member.blockers && member.blockers !== '<p>None</p>') {
        memberSummaries[member.name].concerns.push(member.blockers)
      }
    })
  })

  // Clean up member summaries
  Object.keys(memberSummaries).forEach(memberName => {
    const summary = memberSummaries[memberName]
    summary.keyContributions = summary.keyContributions.slice(0, 5)
    summary.progress = `Completed work on ${reportEntries.length} day(s)`
    summary.nextWeekFocus = 'Continue current project work'
  })

  return {
    keyAccomplishments: allAccomplishments.slice(0, 10),
    ongoingWork: allOngoingWork.slice(0, 10),
    blockers: allBlockers.slice(0, 10),
    teamInsights: `Generated basic summary for ${reportEntries.length} days with ${allAccomplishments.length} accomplishments, ${allOngoingWork.length} ongoing tasks, and ${allBlockers.length} blockers.`,
    recommendations: [],
    memberSummaries
  }
}
