import { NextRequest } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { createServerClient } from '@/lib/supabase'
import { getUserFromSession, requireProjectAccess, requirePMOrAdmin } from '@/lib/api/permissions'
import { validateUUID, validateJsonBody, validateRequired, statusToApi } from '@/lib/api/validation'
import { handleError, successResponse, APIErrors } from '@/lib/api/errors'
import type { RejectStatusChangeRequest, RejectStatusChangeResponse } from '@/types/api'
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

    // Only PMs and Admins can reject status changes
    requirePMOrAdmin(user)

    const body = await validateJsonBody<RejectStatusChangeRequest>(request)
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

    // Update pending change status to rejected with optional reason
    const updateData: any = {
      status: PENDING_CHANGE_STATUS.REJECTED,
    }

    // Handle rejection reason - store if provided and non-empty, otherwise set to null
    if (body.reason !== undefined) {
      updateData.rejection_reason = body.reason && body.reason.trim().length > 0 ? body.reason.trim() : null
    }

    const { data: updatedPendingChange, error: updateError } = await supabase
      .from('pending_changes')
      .update(updateData)
      .eq('id', body.pendingChangeId)
      .eq('account_id', user.account_id)
      .select()
      .single()

    if (updateError || !updatedPendingChange) {
      throw APIErrors.internalError('Failed to update pending change')
    }

    // Get proposer user info (filter by account_id for security)
    const { data: proposer, error: proposerError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', pendingChange.proposed_by)
      .eq('account_id', user.account_id)
      .single()

    if (proposerError || !proposer) {
      throw APIErrors.internalError('Failed to fetch proposer information')
    }

    // Format response (convert DB format to API format)
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

    // Build rejection message
    const rejectionMessage = updatedPendingChange.rejection_reason
      ? `Status change rejected: ${updatedPendingChange.rejection_reason}`
      : 'Status change rejected'

    const response: RejectStatusChangeResponse = {
      message: rejectionMessage,
      pendingChange: formattedPendingChange,
    }

    return successResponse(response)
  } catch (error) {
    return handleError(error)
  }
}

