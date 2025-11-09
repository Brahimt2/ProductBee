import { NextRequest } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { createServerClient } from '@/lib/supabase'
import { getUserFromSession, requireProjectAccess } from '@/lib/api/permissions'
import { validateUUID, validateJsonBody, validateRequired, validateFeatureStatusApi, statusToDb, statusToApi } from '@/lib/api/validation'
import { handleError, successResponse, APIErrors } from '@/lib/api/errors'
import type { ProposeStatusChangeRequest, ProposeStatusChangeResponse } from '@/types/api'
import { PENDING_CHANGE_STATUS, ROLES } from '@/lib/constants'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    const user = await getUserFromSession(session)

    // Viewers cannot propose status changes
    if (user.role === ROLES.VIEWER) {
      throw APIErrors.forbidden('Viewers cannot propose status changes')
    }

    const featureId = params.id
    validateUUID(featureId, 'Feature ID')

    const body = await validateJsonBody<ProposeStatusChangeRequest>(request)
    validateRequired(body, ['newStatus'])
    validateFeatureStatusApi(body.newStatus)

    const supabase = createServerClient()

    // Get feature to check project access and account isolation
    const { data: feature, error: featureError } = await supabase
      .from('features')
      .select('id, project_id, account_id, status')
      .eq('id', featureId)
      .eq('account_id', user.account_id)
      .single()

    if (featureError || !feature) {
      throw APIErrors.notFound('Feature')
    }

    // Check project access (enforces account isolation)
    await requireProjectAccess(user, feature.project_id)

    // Additional account_id check for safety
    if (feature.account_id !== user.account_id) {
      throw APIErrors.forbidden('Access denied. Feature belongs to a different account.')
    }

    // Convert API status to DB status
    const currentStatusDb = feature.status // Already in DB format
    const newStatusDb = statusToDb(body.newStatus)

    // Check if status is actually changing
    if (currentStatusDb === newStatusDb) {
      throw APIErrors.badRequest('New status must be different from current status')
    }

    // Check if there's already a pending change for this feature
    const { data: existingPending, error: pendingError } = await supabase
      .from('pending_changes')
      .select('id')
      .eq('feature_id', featureId)
      .eq('status', PENDING_CHANGE_STATUS.PENDING)
      .eq('account_id', user.account_id)
      .maybeSingle()

    if (pendingError) {
      throw APIErrors.internalError('Failed to check existing pending changes')
    }

    if (existingPending) {
      throw APIErrors.badRequest('There is already a pending status change for this feature')
    }

    // Create pending change record
    const { data: pendingChange, error: createError } = await supabase
      .from('pending_changes')
      .insert({
        feature_id: featureId,
        proposed_by: user.id,
        from_status: currentStatusDb,
        to_status: newStatusDb,
        status: PENDING_CHANGE_STATUS.PENDING,
        account_id: user.account_id,
      })
      .select()
      .single()

    if (createError || !pendingChange) {
      throw APIErrors.internalError('Failed to create pending change')
    }

    // Get proposer user info
    const { data: proposer, error: proposerError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', user.id)
      .single()

    if (proposerError || !proposer) {
      throw APIErrors.internalError('Failed to fetch proposer information')
    }

    // Format response (convert DB format to API format)
    const formattedPendingChange = {
      _id: pendingChange.id,
      id: pendingChange.id,
      featureId: pendingChange.feature_id,
      proposedBy: {
        _id: proposer.id,
        name: proposer.name,
        email: proposer.email,
      },
      fromStatus: statusToApi(pendingChange.from_status), // Convert DB -> API
      toStatus: statusToApi(pendingChange.to_status), // Convert DB -> API
      status: pendingChange.status,
      rejectionReason: pendingChange.rejection_reason || null,
      createdAt: pendingChange.created_at,
    }

    const response: ProposeStatusChangeResponse = {
      pendingChange: formattedPendingChange,
    }

    return successResponse(response, 201)
  } catch (error) {
    return handleError(error)
  }
}

