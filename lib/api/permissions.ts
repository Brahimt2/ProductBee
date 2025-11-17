import { createServerClient } from '@/lib/supabase'
import { APIErrors } from './errors'
import { ROLES, Role } from '@/lib/constants'
import type { User } from '@/models/User'

/**
 * Extract accountId from Auth0 session metadata
 * Checks app_metadata first, then user_metadata, then falls back to a default
 */
export function extractAccountIdFromSession(session: any): string {
  if (!session || !session.user) {
    throw APIErrors.unauthorized()
  }

  // Try app_metadata first (preferred for organization/account data)
  if (session.user.app_metadata?.account_id) {
    return session.user.app_metadata.account_id
  }

  // Try user_metadata as fallback
  if (session.user.user_metadata?.account_id) {
    return session.user.user_metadata.account_id
  }

  // Try organization claim (if using Auth0 Organizations)
  if (session.user.org_id) {
    return session.user.org_id
  }

  // Fallback: use auth0_id as account_id for single-tenant users
  // In production, you might want to throw an error instead
  // For now, we'll use a default account_id based on the domain or sub
  // This allows the system to work even if accountId isn't set in Auth0
  const accountId = session.user.sub.split('|')[0] + '|' + (session.user.email?.split('@')[1] || 'default')
  
  return accountId
}

/**
 * Get user from session (Auth0)
 * Returns user from database or throws error
 * Extracts accountId from Auth0 metadata and ensures user has accountId
 * 
 * Handles Auth0 account linking:
 * - When user signs in with different provider (e.g., email/password vs Google) using same email
 * - If auth0_id lookup fails, checks for existing user by email
 * - Updates existing user's auth0_id to link accounts (Auth0 handles the linking)
 * - Prevents duplicate accounts and authentication loops
 */
export async function getUserFromSession(session: any): Promise<User> {
  if (!session || !session.user) {
    throw APIErrors.unauthorized()
  }

  const supabase = createServerClient()
  const accountId = extractAccountIdFromSession(session)

  // Get or create user
  let { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('auth0_id', session.user.sub)
    .single()

  if (userError && userError.code === 'PGRST116') {
    // User doesn't exist with this auth0_id, check if user exists by email (account linking)
    if (session.user.email) {
      const { data: existingUser, error: emailError } = await supabase
        .from('users')
        .select('*')
        .eq('email', session.user.email)
        .single()

      if (existingUser && !emailError) {
        // Found user with same email but different auth0_id - account linking scenario
        // Update the user's auth0_id to the new one (Auth0 handles the linking)
        console.log('[Account Linking] Found existing user by email, updating auth0_id', {
          email: session.user.email,
          oldAuth0Id: existingUser.auth0_id,
          newAuth0Id: session.user.sub,
        })

        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({ auth0_id: session.user.sub })
          .eq('id', existingUser.id)
          .select()
          .single()

        if (!updateError && updatedUser) {
          user = updatedUser
        } else {
          // Account linking conflict - log for debugging
          console.error('[Account Linking] Failed to update auth0_id', {
            email: session.user.email,
            userId: existingUser.id,
            error: updateError,
          })
          throw APIErrors.internalError('Account linking conflict. Please contact support.')
        }
      } else {
        // No existing user, create new one
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            auth0_id: session.user.sub,
            name: session.user.name || session.user.email || 'Unknown',
            email: session.user.email || '',
            role: 'viewer',
            account_id: accountId,
          })
          .select()
          .single()

        if (createError) {
          // Check if it's a unique constraint violation on email (account linking scenario)
          if (createError.code === '23505' && session.user.email) {
            // Email already exists, try to update existing user's auth0_id
            console.log('[Account Linking] Email unique violation, attempting account linking', {
              email: session.user.email,
              newAuth0Id: session.user.sub,
            })

            const { data: existingUserByEmail, error: emailLookupError } = await supabase
              .from('users')
              .select('*')
              .eq('email', session.user.email)
              .single()

            if (existingUserByEmail && !emailLookupError) {
              // Update existing user's auth0_id
              const { data: linkedUser, error: linkError } = await supabase
                .from('users')
                .update({ auth0_id: session.user.sub })
                .eq('id', existingUserByEmail.id)
                .select()
                .single()

              if (!linkError && linkedUser) {
                user = linkedUser
              } else {
                console.error('[Account Linking] Failed to link account', {
                  email: session.user.email,
                  error: linkError,
                })
                throw APIErrors.badRequest('Account linking failed. Please contact support.')
              }
            } else {
              console.error('[Account Linking] Email exists but lookup failed', {
                email: session.user.email,
                error: emailLookupError,
              })
              throw APIErrors.internalError('Failed to create user')
            }
          } else {
            throw APIErrors.internalError('Failed to create user')
          }
        } else {
          user = newUser
        }
      }
    } else {
      // No email available, create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          auth0_id: session.user.sub,
          name: session.user.name || 'Unknown',
          email: '',
          role: 'viewer',
          account_id: accountId,
        })
        .select()
        .single()

      if (createError) {
        throw APIErrors.internalError('Failed to create user')
      }
      user = newUser
    }
  } else if (userError) {
    throw APIErrors.internalError('Failed to fetch user')
  }

  if (!user) {
    throw APIErrors.unauthorized()
  }

  // Update user's account_id if it's missing or different (migration support)
  // Preserve existing account_id during account linking
  if (!user.account_id || user.account_id !== accountId) {
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ account_id: accountId })
      .eq('id', user.id)
      .select()
      .single()

    if (!updateError && updatedUser) {
      user = updatedUser
    }
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
 * Check if user can view a project (account isolation + role-based)
 */
export async function canViewProject(
  user: User,
  projectId: string
): Promise<boolean> {
  const supabase = createServerClient()

  const { data: project, error } = await supabase
    .from('projects')
    .select('account_id, team_id, created_by')
    .eq('id', projectId)
    .single()

  if (error || !project) {
    return false
  }

  // Enforce account isolation - user must belong to the same account
  if (project.account_id !== user.account_id) {
    return false
  }

  // All roles in the same account can view projects
  return true
}

/**
 * Check if user can edit a project (PM or Admin only, within same account)
 */
export async function canEditProject(
  user: User,
  projectId: string
): Promise<boolean> {
  // First check if user can view the project (account isolation)
  const canView = await canViewProject(user, projectId)
  if (!canView) {
    return false
  }

  // Only PM and Admin can edit projects
  return isPMOrAdmin(user)
}

/**
 * Check if user can assign tasks (PM or Admin only, within same account)
 */
export async function canAssignTasks(
  user: User,
  projectId: string
): Promise<boolean> {
  // First check if user can view the project (account isolation)
  const canView = await canViewProject(user, projectId)
  if (!canView) {
    return false
  }

  // Only PM and Admin can assign tasks
  return isPMOrAdmin(user)
}

/**
 * Check if user can approve proposals (PM or Admin only, within same account)
 */
export async function canApproveProposals(
  user: User,
  projectId: string
): Promise<boolean> {
  // First check if user can view the project (account isolation)
  const canView = await canViewProject(user, projectId)
  if (!canView) {
    return false
  }

  // Only PM and Admin can approve proposals
  return isPMOrAdmin(user)
}

/**
 * Check if user can access a project (by team_id or ownership)
 * @deprecated Use canViewProject instead for account isolation
 */
export async function canAccessProject(
  user: User,
  projectId: string
): Promise<boolean> {
  return canViewProject(user, projectId)
}

/**
 * Require user to be able to view a project (account isolation enforced)
 */
export async function requireProjectAccess(
  user: User,
  projectId: string
): Promise<void> {
  const hasAccess = await canViewProject(user, projectId)
  if (!hasAccess) {
    throw APIErrors.forbidden('Access denied. You do not have access to this project.')
  }
}

/**
 * Require user to be able to edit a project (PM/Admin + account isolation)
 */
export async function requireProjectEdit(
  user: User,
  projectId: string
): Promise<void> {
  const canEdit = await canEditProject(user, projectId)
  if (!canEdit) {
    throw APIErrors.forbidden('Access denied. Only PMs and Admins can edit projects.')
  }
}

/**
 * Require user to be able to assign tasks (PM/Admin + account isolation)
 */
export async function requireTaskAssignment(
  user: User,
  projectId: string
): Promise<void> {
  const canAssign = await canAssignTasks(user, projectId)
  if (!canAssign) {
    throw APIErrors.forbidden('Access denied. Only PMs and Admins can assign tasks.')
  }
}

/**
 * Require user to be able to approve proposals (PM/Admin + account isolation)
 */
export async function requireProposalApproval(
  user: User,
  projectId: string
): Promise<void> {
  const canApprove = await canApproveProposals(user, projectId)
  if (!canApprove) {
    throw APIErrors.forbidden('Access denied. Only PMs and Admins can approve proposals.')
  }
}

