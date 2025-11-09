import { NextRequest } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { createServerClient } from '@/lib/supabase'
import { getUserFromSession, requireProjectAccess } from '@/lib/api/permissions'
import { validateUUID, statusToApi } from '@/lib/api/validation'
import { handleError, successResponse, APIErrors } from '@/lib/api/errors'
import type { GetPendingChangesResponse } from '@/types/api'
import { PENDING_CHANGE_STATUS } from '@/lib/constants'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    const user = await getUserFromSession(session)

    const projectId = params.id
    validateUUID(projectId, 'Project ID')

    // Check project access (enforces account isolation)
    await requireProjectAccess(user, projectId)

    const supabase = createServerClient()

    // Verify project exists and get account_id
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, account_id')
      .eq('id', projectId)
      .eq('account_id', user.account_id)
      .single()

    if (projectError || !project) {
      throw APIErrors.notFound('Project')
    }

    // Get all features for this project
    const { data: features, error: featuresError } = await supabase
      .from('features')
      .select('id')
      .eq('project_id', projectId)
      .eq('account_id', user.account_id)

    if (featuresError) {
      throw APIErrors.internalError('Failed to fetch project features')
    }

    if (!features || features.length === 0) {
      // No features, return empty array
      const response: GetPendingChangesResponse = {
        pendingChanges: [],
      }
      return successResponse(response)
    }

    const featureIds = features.map(f => f.id)

    // Get all pending changes for features in this project
    const { data: pendingChanges, error: pendingChangesError } = await supabase
      .from('pending_changes')
      .select('*')
      .in('feature_id', featureIds)
      .eq('account_id', user.account_id)
      .eq('status', PENDING_CHANGE_STATUS.PENDING)
      .order('created_at', { ascending: false })

    if (pendingChangesError) {
      throw APIErrors.internalError('Failed to fetch pending changes')
    }

    if (!pendingChanges || pendingChanges.length === 0) {
      const response: GetPendingChangesResponse = {
        pendingChanges: [],
      }
      return successResponse(response)
    }

    // Get unique proposer user IDs
    const proposerIds = [...new Set(pendingChanges.map((pc: any) => pc.proposed_by))]

    // Fetch proposer user info
    const { data: proposers, error: proposersError } = await supabase
      .from('users')
      .select('id, name, email')
      .in('id', proposerIds)
      .eq('account_id', user.account_id)

    if (proposersError) {
      throw APIErrors.internalError('Failed to fetch proposer information')
    }

    // Create a map of proposer IDs to user info
    const proposerMap = new Map(
      (proposers || []).map((p: any) => [p.id, { id: p.id, name: p.name, email: p.email }])
    )

    // Format response (convert DB format to API format)
    const formattedPendingChanges = pendingChanges.map((pc: any) => {
      const proposer = proposerMap.get(pc.proposed_by) || { id: '', name: 'Unknown', email: '' }
      return {
        _id: pc.id,
        id: pc.id,
        featureId: pc.feature_id,
        proposedBy: {
          _id: proposer.id,
          name: proposer.name,
          email: proposer.email,
        },
        fromStatus: statusToApi(pc.from_status), // Convert DB -> API
        toStatus: statusToApi(pc.to_status), // Convert DB -> API
        status: pc.status,
        rejectionReason: pc.rejection_reason || null,
        createdAt: pc.created_at,
      }
    })

    const response: GetPendingChangesResponse = {
      pendingChanges: formattedPendingChanges,
    }

    return successResponse(response)
  } catch (error) {
    return handleError(error)
  }
}

