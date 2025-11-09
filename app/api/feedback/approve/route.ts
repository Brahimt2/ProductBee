import { NextRequest } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { createServerClient } from '@/lib/supabase'
import { compareRoadmaps } from '@/lib/gemini'
import { getUserFromSession, requirePMOrAdmin } from '@/lib/api/permissions'
import { validateUUID, validateJsonBody, validateRequired } from '@/lib/api/validation'
import { handleError, successResponse, APIErrors } from '@/lib/api/errors'
import type { ApproveFeedbackRequest, ApproveFeedbackResponse } from '@/types/api'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    const user = await getUserFromSession(session)
    requirePMOrAdmin(user)

    const body = await validateJsonBody<ApproveFeedbackRequest>(request)
    validateRequired(body, ['feedbackId'])
    validateUUID(body.feedbackId, 'Feedback ID')

    const { feedbackId } = body
    const supabase = createServerClient()

    // Get feedback
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .select('*')
      .eq('id', feedbackId)
      .single()

    if (feedbackError || !feedback) {
      throw APIErrors.notFound('Feedback')
    }

    if (feedback.type !== 'proposal') {
      throw APIErrors.badRequest('Can only approve proposals')
    }

    if (feedback.status !== 'pending') {
      throw APIErrors.badRequest('Feedback already processed')
    }

    // Get project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', feedback.project_id)
      .single()

    if (projectError || !project) {
      throw APIErrors.notFound('Project')
    }

    // If there's a proposed roadmap, compare and update
    if (feedback.proposed_roadmap) {
      try {
        const changes = await compareRoadmaps(
          { summary: project.roadmap.summary, features: [] },
          feedback.proposed_roadmap
        )
        
        // Update project roadmap if needed
        if (changes && changes.length > 0) {
          // Update features based on changes
          // This is simplified - in a real app you'd handle this more carefully
        }
      } catch (error) {
        console.error('Error comparing roadmaps:', error)
        // Continue with approval even if comparison fails
      }
    }

    // Update feedback status
    const { data: updatedFeedback, error: updateError } = await supabase
      .from('feedback')
      .update({ status: 'approved' })
      .eq('id', feedbackId)
      .select()
      .single()

    if (updateError) {
      throw APIErrors.internalError('Failed to update feedback')
    }

    // Format response
    const formattedFeedback = {
      _id: updatedFeedback.id,
      id: updatedFeedback.id,
      projectId: updatedFeedback.project_id,
      featureId: updatedFeedback.feature_id,
      userId: updatedFeedback.user_id,
      type: updatedFeedback.type,
      content: updatedFeedback.content,
      proposedRoadmap: updatedFeedback.proposed_roadmap,
      aiAnalysis: updatedFeedback.ai_analysis,
      status: updatedFeedback.status,
      createdAt: updatedFeedback.created_at,
    }

    const response: ApproveFeedbackResponse = {
      message: 'Proposal approved',
      feedback: formattedFeedback,
    }

    return successResponse(response)
  } catch (error) {
    return handleError(error)
  }
}

