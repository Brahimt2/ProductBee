# Backend Agent: Auth0 Account Linking Implementation

**Location:** `/docs/coordination/backend-request-auth0-account-linking.md`

## Overview
Implement Auth0 account linking support to handle users who sign in with different providers (e.g., email/password vs Google) using the same email address. This prevents duplicate accounts and authentication loops.

## Context
Currently, `getUserFromSession()` in `/lib/api/permissions.ts` only looks up users by `auth0_id`. When a user signs up with email/password then later tries to log in with Google (same email), they get treated as two different users, causing:
1. Database constraint violations (email UNIQUE)
2. Duplicate accounts
3. Lost data association

## Tasks

### 1. Update `getUserFromSession()` Function
**File:** `/lib/api/permissions.ts`

- [ ] **Add email-based fallback lookup**
  - When user lookup by `auth0_id` fails (PGRST116 error), check if user exists by email
  - If found, update the existing user's `auth0_id` to the new one (Auth0 handles linking)
  - This handles the case where Auth0 links accounts but our DB still has old `auth0_id`

- [ ] **Handle account linking conflicts**
  - If email exists but `auth0_id` update fails, throw `APIErrors.internalError()` with message about account linking conflict
  - Log the conflict for debugging

- [ ] **Handle unique constraint violations**
  - If creating new user fails with code `23505` (unique violation on email), check if it's an account linking scenario
  - If email matches existing user, update that user's `auth0_id` instead of creating new user
  - Throw `APIErrors.badRequest()` with user-friendly message if account linking fails

- [ ] **Maintain account_id consistency**
  - When updating `auth0_id` for account linking, preserve existing `account_id`
  - Only update `account_id` if it's missing or different (existing migration support)

### 2. Error Handling
**File:** `/lib/api/permissions.ts`

- [ ] **Add specific error for account linking conflicts**
  - Create clear error message: "Account linking conflict. Please contact support."
  - Log detailed information for debugging (email, old auth0_id, new auth0_id)

- [ ] **Handle edge cases**
  - User with email but no `auth0_id` (shouldn't happen, but handle gracefully)
  - Multiple users with same email (shouldn't happen with UNIQUE constraint, but log warning)

### 3. Update Auth0 Route Handler (Configuration)
**File:** `/app/api/auth/[...auth0]/route.ts`

- [ ] **Update logout returnTo**
  - Change from `${getBaseUrl()}/` to `${getBaseUrl()}/home`
  - This ensures unauthenticated users go to public landing page instead of redirecting to dashboard

- [ ] **Add comments about account linking**
  - Document that Auth0 should be configured with "Auto-link accounts with same email" enabled
  - Add note about account linking behavior in callback handler

### 4. Documentation
**Files:** `/docs/api.md`, `/docs/architecture-supabase.md`

- [ ] **Update API documentation**
  - Document account linking behavior in authentication section
  - Explain how `getUserFromSession()` handles account linking

- [ ] **Update architecture docs**
  - Add section about Auth0 account linking configuration
  - Document the email-based fallback lookup pattern
  - Explain error handling for account conflicts

### 5. Testing Considerations
- [ ] **Test scenarios to verify:**
  - User signs up with email/password, then logs in with Google (same email) → should link accounts
  - User signs up with Google, then tries email/password (same email) → should link accounts
  - User with existing account tries different provider → should update auth0_id, not create duplicate
  - Error handling when account linking fails

## Implementation Pattern

```typescript
// In getUserFromSession(), after checking by auth0_id fails:
if (userError && userError.code === 'PGRST116') {
  // User doesn't exist with this auth0_id, check by email
  if (session.user.email) {
    const { data: existingUser, error: emailError } = await supabase
      .from('users')
      .select('*')
      .eq('email', session.user.email)
      .single()

    if (existingUser && !emailError) {
      // Found user with same email but different auth0_id
      // Update the user's auth0_id to the new one (Auth0 handles the linking)
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ auth0_id: session.user.sub })
        .eq('id', existingUser.id)
        .select()
        .single()

      if (!updateError && updatedUser) {
        user = updatedUser
      } else {
        throw APIErrors.internalError('Account linking conflict. Please contact support.')
      }
    } else {
      // No existing user, create new one
      // ... existing create logic
    }
  }
}
```

## Dependencies
- Frontend Agent: Must create public landing page at `/home` before this can be fully tested
- Auth0 Configuration: Should enable "Auto-link accounts with same email address" in Auth0 Dashboard

## Notes
- This implementation assumes Auth0 is configured to auto-link accounts with the same verified email
- The email-based lookup is a fallback for when Auth0 links accounts but our DB hasn't been updated yet
- Account linking preserves all user data (role, account_id, etc.) - only updates auth0_id

## Completion Criteria
- [x] `getUserFromSession()` handles account linking via email fallback
- [x] Error handling for account conflicts is implemented
- [x] Auth0 route handler updated with new logout returnTo
- [x] Documentation updated
- [ ] All test scenarios pass (manual testing required)

## Status: ✅ Backend Implementation Complete

All backend tasks have been completed:
- ✅ `getUserFromSession()` updated with email-based fallback lookup
- ✅ Account linking conflict error handling implemented
- ✅ Unique constraint violation handling for email during user creation
- ✅ Auth0 logout returnTo updated to `/home`
- ✅ Documentation updated in `/docs/api.md` and `/docs/architecture-supabase.md`
- ✅ Comments added to Auth0 route handler about account linking

**Note:** Manual testing is required to verify account linking scenarios work correctly.

