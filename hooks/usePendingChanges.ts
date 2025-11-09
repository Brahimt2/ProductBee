'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import type {
  PendingChangeResponse,
  GetPendingChangesResponse,
  ProposeStatusChangeRequest,
  ProposeStatusChangeResponse,
  ApproveStatusChangeRequest,
  ApproveStatusChangeResponse,
  RejectStatusChangeRequest,
  RejectStatusChangeResponse,
} from '@/types/api'

interface UsePendingChangesReturn {
  pendingChanges: PendingChangeResponse[]
  isLoading: boolean
  error: string | null
  count: number
  fetchPendingChanges: (projectId: string) => Promise<void>
  proposeStatusChange: (featureId: string, newStatus: string) => Promise<PendingChangeResponse | null>
  approveStatusChange: (featureId: string, pendingChangeId: string) => Promise<boolean>
  rejectStatusChange: (featureId: string, pendingChangeId: string, reason?: string) => Promise<boolean>
  isProposing: boolean
  isApproving: boolean
  isRejecting: boolean
}

export function usePendingChanges(): UsePendingChangesReturn {
  const [pendingChanges, setPendingChanges] = useState<PendingChangeResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isProposing, setIsProposing] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  const fetchPendingChanges = async (projectId: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/project/${projectId}/pending-changes`)
      const responseData = await response.json()

      if (!response.ok || !responseData.success) {
        throw new Error(responseData.error || 'Failed to fetch pending changes')
      }

      const data = responseData.data as GetPendingChangesResponse
      setPendingChanges(data.pendingChanges || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      console.error('Error fetching pending changes:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const proposeStatusChange = async (
    featureId: string,
    newStatus: string
  ): Promise<PendingChangeResponse | null> => {
    try {
      setIsProposing(true)
      setError(null)

      const requestBody: ProposeStatusChangeRequest = {
        newStatus: newStatus as 'not_started' | 'in_progress' | 'blocked' | 'complete',
      }

      const response = await fetch(`/api/feature/${featureId}/propose-status-change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const responseData = await response.json()

      if (!response.ok || !responseData.success) {
        if (response.status === 403) {
          throw new Error('You do not have permission to propose status changes')
        }
        if (response.status === 400) {
          throw new Error(responseData.error || 'Invalid status change request')
        }
        throw new Error(responseData.error || 'Failed to propose status change')
      }

      const data = responseData.data as ProposeStatusChangeResponse
      toast.success('Status change proposed successfully')
      
      // Add to pending changes list
      setPendingChanges((prev) => [data.pendingChange, ...prev])
      
      return data.pendingChange
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      toast.error(message)
      return null
    } finally {
      setIsProposing(false)
    }
  }

  const approveStatusChange = async (
    featureId: string,
    pendingChangeId: string
  ): Promise<boolean> => {
    try {
      setIsApproving(true)
      setError(null)

      const requestBody: ApproveStatusChangeRequest = {
        pendingChangeId,
      }

      const response = await fetch(`/api/feature/${featureId}/approve-status-change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const responseData = await response.json()

      if (!response.ok || !responseData.success) {
        if (response.status === 403) {
          throw new Error('Only PMs and Admins can approve status changes')
        }
        throw new Error(responseData.error || 'Failed to approve status change')
      }

      const data = responseData.data as ApproveStatusChangeResponse
      toast.success(data.message || 'Status change approved successfully')
      
      // Remove from pending changes list
      setPendingChanges((prev) => prev.filter((pc) => pc.id !== pendingChangeId))
      
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      toast.error(message)
      return false
    } finally {
      setIsApproving(false)
    }
  }

  const rejectStatusChange = async (
    featureId: string,
    pendingChangeId: string,
    reason?: string
  ): Promise<boolean> => {
    try {
      setIsRejecting(true)
      setError(null)

      const requestBody: RejectStatusChangeRequest = {
        pendingChangeId,
        reason,
      }

      const response = await fetch(`/api/feature/${featureId}/reject-status-change`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const responseData = await response.json()

      if (!response.ok || !responseData.success) {
        if (response.status === 403) {
          throw new Error('Only PMs and Admins can reject status changes')
        }
        throw new Error(responseData.error || 'Failed to reject status change')
      }

      const data = responseData.data as RejectStatusChangeResponse
      toast.success(data.message || 'Status change rejected')
      
      // Remove from pending changes list
      setPendingChanges((prev) => prev.filter((pc) => pc.id !== pendingChangeId))
      
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
      toast.error(message)
      return false
    } finally {
      setIsRejecting(false)
    }
  }

  return {
    pendingChanges,
    isLoading,
    error,
    count: pendingChanges.length,
    fetchPendingChanges,
    proposeStatusChange,
    approveStatusChange,
    rejectStatusChange,
    isProposing,
    isApproving,
    isRejecting,
  }
}

