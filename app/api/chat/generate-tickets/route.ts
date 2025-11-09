import { NextRequest } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { createServerClient } from '@/lib/supabase'
import { getUserFromSession, requirePMOrAdmin, requireProjectAccess } from '@/lib/api/permissions'
import { validateUUID, validateJsonBody, validateRequired } from '@/lib/api/validation'
import { handleError, successResponse, APIErrors } from '@/lib/api/errors'
import { chatWithAI } from '@/lib/gemini'
import { calculateUserWorkload, isUserOnVacation } from '@/lib/api/workload'
import { statusToApi, priorityToApi } from '@/lib/api/validation'
import type { ChatMessage } from '@/types/chat'

/**
 * POST /api/chat/generate-tickets
 * Generate ticket suggestions through AI-powered chat
 * Phase 11: AI-Powered Chatbot for Ticket Generation
 * 
 * Requires: PM or Admin role
 * Enforces: Account isolation
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    const user = await getUserFromSession(session)

    // Require PM or Admin role
    requirePMOrAdmin(user)

    const body = await validateJsonBody<{
      projectId: string
      message: string
      conversationHistory?: ChatMessage[]
    }>(request)

    validateRequired(body, ['projectId', 'message'])
    validateUUID(body.projectId, 'Project ID')

    const supabase = createServerClient()

    // Verify project access and get project details
    await requireProjectAccess(user, body.projectId)

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, description, account_id')
      .eq('id', body.projectId)
      .eq('account_id', user.account_id)
      .single()

    if (projectError || !project) {
      throw APIErrors.notFound('Project')
    }

    // Get existing features for context
    const { data: existingFeatures, error: featuresError } = await supabase
      .from('features')
      .select('id, title, description, status, priority, account_id')
      .eq('project_id', body.projectId)
      .eq('account_id', user.account_id)
      .order('created_at', { ascending: true })

    if (featuresError) {
      throw APIErrors.internalError('Failed to fetch existing features')
    }

    // Get available engineers for assignment suggestions
    const { data: teamMembers, error: teamError } = await supabase
      .from('users')
      .select('id, name, specialization, vacation_dates, account_id, role')
      .eq('account_id', user.account_id)
      .in('role', ['engineer', 'admin']) // Only engineers and admins can be assigned
      .order('name', { ascending: true })

    if (teamError) {
      throw APIErrors.internalError('Failed to fetch team members')
    }

    // Calculate workload and format engineers
    const availableEngineers = await Promise.all(
      (teamMembers || [])
        .filter((member) => {
          const vacationDates = (member.vacation_dates as Array<{ start: string; end: string }>) || []
          return !isUserOnVacation(vacationDates) // Filter out vacationers
        })
        .map(async (member) => {
          const workload = await calculateUserWorkload(member.id, member.account_id)
          return {
            id: member.id,
            name: member.name,
            specialization: member.specialization || null,
            currentTicketCount: workload.ticketCount,
            currentStoryPointCount: workload.storyPointCount,
            isOnVacation: false, // Already filtered
          }
        })
    )

    // Format existing features for AI context
    const formattedFeatures = (existingFeatures || []).map((feature) => ({
      id: feature.id,
      title: feature.title,
      description: feature.description,
      status: statusToApi(feature.status),
      priority: priorityToApi(feature.priority),
    }))

    // Call AI chat function
    const chatResponse = await chatWithAI({
      projectId: body.projectId,
      projectName: project.name,
      projectDescription: project.description,
      message: body.message,
      conversationHistory: body.conversationHistory || [],
      existingFeatures: formattedFeatures,
      availableEngineers: availableEngineers.length > 0 ? availableEngineers : undefined,
    })

    // Format response
    return successResponse({
      message: chatResponse.message,
      suggestedTickets: chatResponse.suggestedTickets,
      confidenceScores: chatResponse.confidenceScores || chatResponse.suggestedTickets.map((t) => t.confidenceScore || 0),
    })
  } catch (error) {
    return handleError(error)
  }
}

