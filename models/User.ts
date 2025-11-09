import { BaseModel } from './base'

/**
 * User model - Represents a user in the system
 * Extends BaseModel for consistent structure
 */
export interface User extends BaseModel {
  auth0_id: string
  email: string
  name: string
  role: 'admin' | 'pm' | 'engineer' | 'viewer'
  team_id?: string
}

