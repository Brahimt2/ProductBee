import { NextRequest } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { createServerClient } from '@/lib/supabase'
import { getUserFromSession, requirePMOrAdmin, requireProjectAccess } from '@/lib/api/permissions'
import { validateUUID, validateJsonBody, validateRequired, validatePriority, validateTicketType, validateStoryPoints, validateLabels, priorityToDb } from '@/lib/api/validation'
import { handleError, successResponse, APIErrors } from '@/lib/api/errors'
import { HTTP_STATUS, DB_FEATURE_STATUS } from '@/lib/constants'
import { suggestAssignment } from '@/lib/ai/assignment'
import { calculateUserWorkload, isUserOnVacation } from '@/lib/api/workload'
import type { SuggestedTicket } from '@/types/chat'

/**
 * POST /api/chat/apply-tickets
 * Bulk create tickets from AI chat suggestions
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
      tickets: SuggestedTicket[]
    }>(request)

    validateRequired(body, ['projectId', 'tickets'])
    validateUUID(body.projectId, 'Project ID')

    if (!Array.isArray(body.tickets) || body.tickets.length === 0) {
      throw APIErrors.badRequest('tickets must be a non-empty array')
    }

    const supabase = createServerClient()

    // Verify project access
    await requireProjectAccess(user, body.projectId)

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, account_id')
      .eq('id', body.projectId)
      .eq('account_id', user.account_id)
      .single()

    if (projectError || !project) {
      throw APIErrors.notFound('Project')
    }

    // Get existing features to validate dependencies
    const { data: existingFeatures, error: featuresError } = await supabase
      .from('features')
      .select('id, account_id')
      .eq('project_id', body.projectId)
      .eq('account_id', user.account_id)

    if (featuresError) {
      throw APIErrors.internalError('Failed to fetch existing features')
    }

    const existingFeatureIds = new Set((existingFeatures || []).map((f) => f.id))

    // Validate and create each ticket
    const createdTicketIds: string[] = []

    for (const ticket of body.tickets) {
      // Validate ticket fields
      validateRequired(ticket, ['title', 'description', 'priority', 'effortEstimateWeeks'])
      validatePriority(ticket.priority)
      
      if (ticket.ticketType !== undefined) {
        validateTicketType(ticket.ticketType)
      }
      if (ticket.storyPoints !== undefined && ticket.storyPoints !== null) {
        validateStoryPoints(ticket.storyPoints)
      }
      if (ticket.labels !== undefined) {
        validateLabels(ticket.labels)
      }

      // Validate dependencies (must reference existing features)
      if (ticket.dependsOn && ticket.dependsOn.length > 0) {
        for (const depId of ticket.dependsOn) {
          validateUUID(depId, 'Dependency ID')
          if (!existingFeatureIds.has(depId)) {
            throw APIErrors.badRequest(`Dependency ${depId} does not exist in this project`)
          }
        }
      }

      // Validate assigned user if provided
      if (ticket.assignedTo) {
        validateUUID(ticket.assignedTo, 'Assigned To')
        const { data: assignedUser, error: userError } = await supabase
          .from('users')
          .select('id, account_id')
          .eq('id', ticket.assignedTo)
          .eq('account_id', user.account_id)
          .single()

        if (userError || !assignedUser) {
          throw APIErrors.badRequest(`Assigned user ${ticket.assignedTo} not found or does not belong to your account`)
        }
      }

      // If no assignment, try to get AI suggestion
      let assignedTo = ticket.assignedTo || null
      if (!assignedTo) {
        try {
          // Get available engineers for assignment suggestion
          const { data: teamMembers, error: teamError } = await supabase
            .from('users')
            .select('id, name, specialization, vacation_dates, account_id, role')
            .eq('account_id', user.account_id)
            .in('role', ['engineer', 'admin'])
            .order('name', { ascending: true })

          if (!teamError && teamMembers && teamMembers.length > 0) {
            const availableEngineers = await Promise.all(
              teamMembers
                .filter((member) => {
                  const vacationDates = (member.vacation_dates as Array<{ start: string; end: string }>) || []
                  return !isUserOnVacation(vacationDates)
                })
                .map(async (member) => {
                  const workload = await calculateUserWorkload(member.id, member.account_id)
                  return {
                    id: member.id,
                    name: member.name,
                    specialization: member.specialization || null,
                    currentTicketCount: workload.ticketCount,
                    currentStoryPointCount: workload.storyPointCount,
                    isOnVacation: false,
                  }
                })
            )

            if (availableEngineers.length > 0) {
              // Get assignment suggestion
              const suggestion = await suggestAssignment(
                ticket.description,
                ticket.title,
                ticket.labels,
                ticket.ticketType || 'feature',
                user.account_id,
                body.projectId
              )

              // Use top recommendation if confidence is high enough
              if (suggestion.recommendations.length > 0 && suggestion.recommendations[0].confidenceScore >= 50) {
                assignedTo = suggestion.recommendations[0].engineerId
              }
            }
          }
        } catch (error) {
          // If assignment suggestion fails, continue without assignment
          console.warn('[Apply Tickets] Failed to get assignment suggestion:', error)
        }
      }

      // Create feature
      const { data: feature, error: featureError } = await supabase
        .from('features')
        .insert({
          project_id: body.projectId,
          account_id: user.account_id,
          title: ticket.title,
          description: ticket.description,
          priority: priorityToDb(ticket.priority), // Convert API -> DB
          effort_estimate_weeks: ticket.effortEstimateWeeks,
          depends_on: ticket.dependsOn || [],
          status: DB_FEATURE_STATUS.BACKLOG, // DB format using constant
          // Jira-style fields
          ticket_type: ticket.ticketType || 'feature',
          story_points: ticket.storyPoints ?? null,
          labels: ticket.labels || [],
          acceptance_criteria: ticket.acceptanceCriteria || null,
          assigned_to: assignedTo,
          reporter: user.id, // Set reporter to the user creating the ticket
        })
        .select('id')
        .single()

      if (featureError || !feature) {
        console.error('[Apply Tickets] Error creating feature:', featureError)
        throw APIErrors.internalError(`Failed to create ticket: ${ticket.title}`)
      }

      createdTicketIds.push(feature.id)
      
      // Add to existing features set for subsequent dependency validation
      existingFeatureIds.add(feature.id)
    }

    return successResponse(
      {
        createdTicketIds,
        message: `Successfully created ${createdTicketIds.length} ticket(s)`,
      },
      HTTP_STATUS.CREATED
    )
  } catch (error) {
    return handleError(error)
  }
}

