# Frontend Agent: Auth0 Public Landing Page & Error Handling

**Location:** `/docs/coordination/frontend-request-auth0-public-landing.md`

## Overview
Create a public landing page and fix authentication error handling to prevent redirect loops when users decline authorization or encounter authentication errors.

## Context
Currently:
1. Root page (`/`) immediately redirects to `/dashboard` (requires auth)
2. Error page redirects to login, which tries to go to `/dashboard` (requires auth)
3. This creates infinite redirect loops when users decline authorization
4. No public landing page for unauthenticated users

## Tasks

### 1. Create Public Landing Page
**File:** `/app/home/page.tsx` (NEW)

- [ ] **Create server component for public landing page**
  - Check if user is authenticated using `getSession()`
  - If authenticated, redirect to `/dashboard`
  - If not authenticated, show public landing page with:
    - ProductBee logo
    - Welcome message
    - "Get Started" or "Sign In" button that links to `/api/auth/login`
    - Optional: "Sign Up" button (Auth0 handles both login/signup)

- [ ] **Styling**
  - Match existing design system (use same colors, spacing, rounded cards)
  - Use dark mode support (match existing patterns)
  - Responsive design
  - Use Image component for logo (from `/public/bee_logo.png`)

### 2. Update Root Page
**File:** `/app/page.tsx`

- [ ] **Update redirect logic**
  - Check if user is authenticated using `getSession()`
  - If authenticated → redirect to `/dashboard`
  - If not authenticated → redirect to `/home` (public landing page)
  - This prevents redirect loops

### 3. Update Error Page
**File:** `/app/api/auth/error/page.tsx`

- [ ] **Fix "Try Again" button for access_denied**
  - For `access_denied` errors, redirect to logout first, then login
  - Use `window.location.href` for immediate redirect: `/api/auth/logout?returnTo=/api/auth/login`
  - This clears any partial session before retrying

- [ ] **Fix "Go to Home" button**
  - For `access_denied` errors, redirect to logout first, then home
  - Use `window.location.href`: `/api/auth/logout?returnTo=/home`
  - For other errors, use `router.push('/home')`

- [ ] **Update error messages**
  - Keep existing error messages
  - Ensure messages are user-friendly

### 4. Update Dashboard Page Redirects
**File:** `/app/dashboard/page.tsx`

- [ ] **Verify redirect behavior**
  - Ensure unauthenticated users redirect to `/api/auth/login` (existing behavior is correct)
  - No changes needed, but verify it works with new flow

### 5. Update Other Protected Pages
**Files:** `/app/project/[id]/page.tsx`, `/app/team/page.tsx`, `/app/onboarding/page.tsx`

- [ ] **Verify redirect behavior**
  - All should redirect to `/api/auth/login` when unauthenticated (existing behavior)
  - No changes needed, but verify consistency

### 6. Documentation
**Files:** `/docs/frontend/summary.md`, `/docs/features/frontend/` (create new file if needed)

- [ ] **Document public landing page**
  - Create or update feature documentation
  - Document the authentication flow
  - Document error handling improvements

- [ ] **Update frontend summary**
  - Add entry about public landing page
  - Document error page improvements

## Implementation Pattern

### Public Landing Page (`/app/home/page.tsx`)
```typescript
import { getSession } from '@auth0/nextjs-auth0'
import { redirect } from 'next/navigation'
import { headers, cookies } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'

export default async function HomePage() {
  const headersList = await headers()
  const cookiesList = await cookies()
  const session = await getSession({ 
    req: { headers: headersList, cookies: cookiesList } as any 
  })
  
  // If user is already authenticated, redirect to dashboard
  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        {/* Logo, welcome message, sign in button */}
      </div>
    </div>
  )
}
```

### Error Page Updates (`/app/api/auth/error/page.tsx`)
```typescript
const handleTryAgain = () => {
  if (error === 'access_denied') {
    // Clear session and redirect to login
    window.location.href = '/api/auth/logout?returnTo=/api/auth/login'
  } else {
    router.push('/api/auth/login')
  }
}

const handleGoHome = () => {
  if (error === 'access_denied') {
    // Clear session and redirect to home
    window.location.href = '/api/auth/logout?returnTo=/home'
  } else {
    router.push('/home')
  }
}
```

## Dependencies
- Backend Agent: Must update logout returnTo in Auth0 route handler to `/home`

## Design Requirements
- Match existing ProductBee design system
- Use existing color scheme: `#a855f7` for primary, `#d9d9d9` for secondary
- Use existing rounded card styles: `rounded-card`, `shadow-soft`
- Support dark mode
- Responsive (mobile-friendly)

## Completion Criteria
- [ ] Public landing page created at `/home`
- [ ] Root page (`/`) redirects authenticated users to `/dashboard`, unauthenticated to `/home`
- [ ] Error page handles `access_denied` properly (clears session before redirect)
- [ ] All redirects work without loops
- [ ] Documentation updated
- [ ] Design matches existing ProductBee style

