# Backend Request: Theme Switching & Logout Button Fixes

**Feature/Issue:** Theme switching and logout button improvements

**Context:** 
1. Onboarding page uses dark theme (`dark:bg-gray-900`) while the rest of the app uses light theme
2. Logout button requires multiple clicks to redirect properly
3. Need theme switching functionality (click logo to toggle)

**Requested Action:**

### 1. Theme Switching (Frontend)
- Add theme toggle functionality when clicking the logo
- Implement theme persistence (localStorage or cookies)
- Apply theme consistently across all pages:
  - Onboarding page should respect theme setting
  - Dashboard and all other pages should use the same theme
- Consider using Next.js theme provider or a custom hook

**Location:** 
- Logo is in `/components/dashboard/DashboardClient.tsx` (line ~739)
- Onboarding page: `/app/onboarding/page.tsx`
- May need to create a theme context/provider

### 2. Logout Button Fix (Frontend)
- Replace `<a href="/api/auth/logout">` with proper client-side handling
- Use `router.push('/api/auth/logout')` or handle logout programmatically
- Ensure single-click logout works reliably
- Consider adding loading state during logout

**Location:**
- Logout button: `/components/dashboard/DashboardClient.tsx` (line ~764)

**Backend Changes Made:**
- ✅ Updated Auth0 logout handler to use absolute URL for `returnTo` parameter
- ✅ Updated logout `returnTo` to `/home` (public landing page) instead of `/`
- ✅ Added comments to Auth0 route handler about logout configuration
- This should help with redirect reliability, but frontend logout button handling may still need improvement

## Status: ✅ Backend Implementation Complete

All backend tasks have been completed:
- ✅ Auth0 logout handler updated with absolute URL for `returnTo`
- ✅ Logout redirects to `/home` instead of root `/`
- ✅ Documentation updated in Auth0 route handler

**Note:** Theme switching functionality is frontend-only (ThemeProvider already exists). Frontend work for logout button handling may still be needed.

**Blocking:** No - these are UX improvements

**Timeline:** Should be completed before next release

**Additional Notes:**
- Auth0 Universal Login page styling must be done in Auth0 Dashboard (see `/lib/auth0-config.ts` for instructions)
- The Auth0 hosted page URL cannot be changed from our code, but the login flow can be customized in Auth0 Dashboard

