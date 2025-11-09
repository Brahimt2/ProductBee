import { NextRequest } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { createServerClient } from '@/lib/supabase'
import { getUserFromSession, requireProjectAccess, requirePMOrAdmin } from '@/lib/api/permissions'
import { validateUUID, validateJsonBody, validateRequired, statusToDb, statusToApi, priorityToApi } from '@/lib/api/validation'
import { handleError, successResponse, APIErrors } from '@/lib/api/errors'
import type { ApproveStatusChangeRequest, ApproveStatusChangeResponse } from '@/types/api'
import { PENDING_CHANGE_STATUS } from '@/lib/constants'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    const user = await getUserFromSession(session)

    const featureId = params.id
    validateUUID(featureId, 'Feature ID')

    // Only PMs and Admins can approve status changes
    requirePMOrAdmin(user)

    const body = await validateJsonBody<ApproveStatusChangeRequest>(request)
    validateRequired(body, ['pendingChangeId'])
    validateUUID(body.pendingChangeId, 'Pending Change ID')

    const supabase = createServerClient()

    // Get feature to check project access and account isolation
    const { data: feature, error: featureError } = await supabase
      .from('features')
      .select('id, project_id, account_id')
      .eq('id', featureId)
      .eq('account_id', user.account_id)
      .single()

    if (featureError || !feature) {
      throw APIErrors.notFound('Feature')
    }

    // Check project access (enforces account isolation)
    await requireProjectAccess(user, feature.project_id)

    // Get pending change - filtered by account_id for account isolation
    const { data: pendingChange, error: pendingError } = await supabase
      .from('pending_changes')
      .select('*')
      .eq('id', body.pendingChangeId)
      .eq('feature_id', featureId)
      .eq('account_id', user.account_id)
      .single()

    if (pendingError || !pendingChange) {
      throw APIErrors.notFound('Pending change')
    }

    // Verify pending change belongs to the feature
    if (pendingChange.feature_id !== featureId) {
      throw APIErrors.badRequest('Pending change does not belong to this feature')
    }

    // Check if pending change is actually pending
    if (pendingChange.status !== PENDING_CHANGE_STATUS.PENDING) {
      throw APIErrors.badRequest('Pending change has already been processed')
    }

    // Update pending change status to approved
    const { data: updatedPendingChange, error: updatePendingError } = await supabase
      .from('pending_changes')
      .update({ status: PENDING_CHANGE_STATUS.APPROVED })
      .eq('id', body.pendingChangeId)
      .eq('account_id', user.account_id)
      .select()
      .single()

    if (updatePendingError || !updatedPendingChange) {
      throw APIErrors.internalError('Failed to update pending change')
    }

    // Update feature status
    const { data: updatedFeature, error: updateFeatureError } = await supabase
      .from('features')
      .update({ status: pendingChange.to_status })
      .eq('id', featureId)
      .eq('account_id', user.account_id)
      .select()
      .single()

    if (updateFeatureError || !updatedFeature) {
      // Rollback pending change status if feature update fails
      await supabase
        .from('pending_changes')
        .update({ status: PENDING_CHANGE_STATUS.PENDING })
        .eq('id', body.pendingChangeId)
        .eq('account_id', user.account_id)
      
      throw APIErrors.internalError('Failed to update feature status')
    }

    // Get proposer user info
    const { data: proposer, error: proposerError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', pendingChange.proposed_by)
      .single()

    if (proposerError || !proposer) {
      throw APIErrors.internalError('Failed to fetch proposer information')
    }

    // Format pending change response (convert DB format to API format)
    const formattedPendingChange = {
      _id: updatedPendingChange.id,
      id: updatedPendingChange.id,
      featureId: updatedPendingChange.feature_id,
      proposedBy: {
        _id: proposer.id,
        name: proposer.name,
        email: proposer.email,
      },
      fromStatus: statusToApi(updatedPendingChange.from_status), // Convert DB -> API
      toStatus: statusToApi(updatedPendingChange.to_status), // Convert DB -> API
      status: updatedPendingChange.status,
      rejectionReason: updatedPendingChange.rejection_reason || null,
      createdAt: updatedPendingChange.created_at,
    }

    // Format feature response (convert DB format to API format)
    const formattedFeature = {
      _id: updatedFeature.id,
      id: updatedFeature.id,
      projectId: updatedFeature.project_id,
      title: updatedFeature.title,
      description: updatedFeature.description,
      status: statusToApi(updatedFeature.status), // Convert DB -> API
      priority: priorityToApi(updatedFeature.priority), // Convert DB -> API
      effortEstimateWeeks: updatedFeature.effort_estimate_weeks,
      dependsOn: updatedFeature.depends_on || [],
      createdAt: updatedFeature.created_at,
      assignedTo: updatedFeature.assigned_to || null,
      reporter: updatedFeature.reporter || null,
      storyPoints: updatedFeature.story_points ?? null,
      labels: updatedFeature.labels || [],
      acceptanceCriteria: updatedFeature.acceptance_criteria || null,
      ticketType: updatedFeature.ticket_type || 'feature',
    }

    const response: ApproveStatusChangeResponse = {
      message: 'Status change approved and feature updated',
      pendingChange: formattedPendingChange,
      feature: formattedFeature,
    }

    return successResponse(response)
  } catch (error) {
    return handleError(error)
  }
}

