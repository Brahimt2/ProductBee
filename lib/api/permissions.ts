import { createServerClient } from '@/lib/supabase'
import { APIErrors } from './errors'
import { ROLES, Role } from '@/lib/constants'
import type { User } from '@/models/User'

/**
 * Get user from session (Auth0)
 * Returns user from database or throws error
 */
export async function getUserFromSession(session: any): Promise<User> {
  if (!session || !session.user) {
    throw APIErrors.unauthorized()
  }

  const supabase = createServerClient()

  // Get or create user
  let { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('auth0_id', session.user.sub)
    .single()

  if (userError && userError.code === 'PGRST116') {
    // User doesn't exist, create it
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        auth0_id: session.user.sub,
        name: session.user.name || session.user.email || 'Unknown',
        email: session.user.email || '',
        role: 'viewer',
      })
      .select()
      .single()

    if (createError) {
      throw APIErrors.internalError('Failed to create user')
    }
    user = newUser
  } else if (userError) {
    throw APIErrors.internalError('Failed to fetch user')
  }

  if (!user) {
    throw APIErrors.unauthorized()
  }

  return user as User
}

/**
 * Check if user has required role
 */
export function hasRole(user: User, requiredRoles: Role[]): boolean {
  return requiredRoles.includes(user.role as Role)
}

/**
 * Require user to have one of the specified roles
 * Throws error if user doesn't have required role
 */
export function requireRole(user: User, requiredRoles: Role[]): void {
  if (!hasRole(user, requiredRoles)) {
    throw APIErrors.forbidden(
      `Access denied. Required roles: ${requiredRoles.join(', ')}`
    )
  }
}

/**
 * Check if user is PM or admin
 */
export function isPMOrAdmin(user: User): boolean {
  return hasRole(user, [ROLES.PM, ROLES.ADMIN])
}

/**
 * Require user to be PM or admin
 */
export function requirePMOrAdmin(user: User): void {
  requireRole(user, [ROLES.PM, ROLES.ADMIN])
}

/**
 * Check if user owns a resource (by created_by field)
 */
export function isOwner(user: User, resourceCreatedBy: string): boolean {
  return user.id === resourceCreatedBy
}

/**
 * Require user to own a resource or be admin
 */
export function requireOwnerOrAdmin(user: User, resourceCreatedBy: string): void {
  if (user.role === ROLES.ADMIN) {
    return
  }
  if (!isOwner(user, resourceCreatedBy)) {
    throw APIErrors.forbidden('Access denied. You do not own this resource.')
  }
}

/**
 * Check if user can access a project (by team_id or ownership)
 */
export async function canAccessProject(
  user: User,
  projectId: string
): Promise<boolean> {
  const supabase = createServerClient()

  const { data: project, error } = await supabase
    .from('projects')
    .select('team_id, created_by')
    .eq('id', projectId)
    .single()

  if (error || !project) {
    return false
  }

  // Admin can access all projects
  if (user.role === ROLES.ADMIN) {
    return true
  }

  // User can access if they created it or are in the team
  return (
    project.created_by === user.id ||
    project.team_id === user.team_id ||
    project.team_id === user.id
  )
}

/**
 * Require user to be able to access a project
 */
export async function requireProjectAccess(
  user: User,
  projectId: string
): Promise<void> {
  const hasAccess = await canAccessProject(user, projectId)
  if (!hasAccess) {
    throw APIErrors.forbidden('Access denied. You do not have access to this project.')
  }
}

