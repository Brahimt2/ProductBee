import { handleAuth, handleLogin, handleLogout, handleCallback } from '@auth0/nextjs-auth0'

/**
 * Auth0 route handler with error handling
 * 
 * Handles all Auth0 authentication routes:
 * - /api/auth/login - Initiate login
 * - /api/auth/logout - Initiate logout
 * - /api/auth/callback - Handle OAuth callback
 * - /api/auth/me - Get user session
 * 
 * Error Handling:
 * - The Auth0 SDK automatically handles errors and redirects to /api/auth/error
 * - Common errors include: access_denied, login_required, invalid_request
 * - Errors are logged server-side for debugging
 * - Users see user-friendly error messages via the error page
 * 
 * Account Linking:
 * - Auth0 should be configured with "Auto-link accounts with same email address" enabled
 * - When users sign in with different providers (e.g., email/password vs Google) using the same email,
 *   Auth0 automatically links the accounts
 * - The getUserFromSession() function handles account linking in the database by updating auth0_id
 *   when a user with the same email but different auth0_id is found
 * 
 * Logout Configuration:
 * - Uses absolute URL for returnTo to ensure proper redirect
 * - Clears session and redirects to /home (public landing page)
 * - Handles both local and production environments
 */
const getBaseUrl = () => {
  // Use environment variable if available, otherwise construct from request
  return process.env.AUTH0_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
}

export const GET = handleAuth({
  login: handleLogin({
    authorizationParams: {
      // Add any custom authorization parameters here if needed
      // This helps ensure clean URLs in the Auth0 login flow
    },
    returnTo: '/dashboard',
  }),
  logout: handleLogout({
    // Use absolute URL for returnTo to ensure proper redirect
    // This fixes the issue where logout requires multiple clicks
    // Redirects to /home (public landing page) instead of root
    returnTo: `${getBaseUrl()}/home`,
  }),
  callback: handleCallback({
    // Callback error handling is automatic
    // On error, user is redirected to /api/auth/error with error details
    // The error page should handle displaying user-friendly messages
  }),
})

