import { BaseModel } from './base'
import type { PendingChangeStatus } from '@/lib/constants'

/**
 * PendingChange model - Represents a pending status change proposal for a feature
 * Extends BaseModel for consistent structure
 */
export interface PendingChange extends BaseModel {
  feature_id: string
  proposed_by: string // User ID
  from_status: string // DB format status (backlog, active, blocked, complete)
  to_status: string // DB format status (backlog, active, blocked, complete)
  status: PendingChangeStatus // pending, approved, rejected
  account_id: string
  rejection_reason?: string | null // Optional reason for rejection
}

