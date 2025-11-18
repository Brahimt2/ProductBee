# Frontend Request: Auth0 URL and Styling Configuration

**Feature/Issue:** Auth0 login page has weird URL and no styling  
**Context:** Users are seeing Auth0 login page with an unusual URL format and no custom styling. The login page is hosted by Auth0, so we need backend configuration to customize it.  
**Requested Action:** Configure Auth0 to use cleaner URLs and apply custom branding/styling  
**Blocking:** No - Frontend has created error page styling  
**Timeline:** When convenient for Backend Agent

## Frontend Work Completed

The Frontend Agent has completed:
- ✅ Created styled error page at `/app/api/auth/error/page.tsx`
- ✅ Error page matches app theme (light/dark mode support)
- ✅ User-friendly error messages for common Auth0 errors
- ✅ Proper navigation and retry functionality

## Backend Configuration Needed

### 1. Auth0 URL Configuration

The Auth0 login page URL might be showing something like:
- `https://your-tenant.auth0.com/u/login?state=...` (default Auth0 URL)

**Requested Changes:**
- Configure custom domain (if available) for cleaner URLs
- Or document the expected URL format for users
- Ensure callback URLs are properly configured

### 2. Auth0 Universal Login Styling

The Auth0 Universal Login page can be customized through:
- Auth0 Dashboard → Branding → Universal Login
- Custom CSS and HTML templates
- Logo and color scheme customization

**Requested Actions:**
1. Customize Auth0 Universal Login page to match ProductBee branding:
   - Add ProductBee logo
   - Use app color scheme (#a855f7 purple, #f5f5f5 background)
   - Match typography and styling
   - Support dark mode if possible

2. Configure Auth0 settings:
   - Update login page template
   - Apply custom CSS
   - Set brand colors

### 3. Auth0 Application Settings

Verify/update the following in Auth0 Dashboard:
- **Allowed Callback URLs:** Should include production and development URLs
- **Allowed Logout URLs:** Should include production and development URLs
- **Allowed Web Origins:** Should include production and development URLs
- **Application Logo:** Set ProductBee logo

## Notes

- The Auth0 Universal Login page is hosted by Auth0, so styling must be done through Auth0 Dashboard
- Custom domain can be configured in Auth0 for cleaner URLs (requires Auth0 subscription)
- The error page (`/api/auth/error`) is now styled and ready
- Frontend cannot directly style the Auth0 login page - it requires backend/Auth0 configuration

## Resources

- [Auth0 Universal Login Customization](https://auth0.com/docs/customize/universal-login-pages)
- [Auth0 Branding](https://auth0.com/docs/customize/universal-login-pages/universal-login-page-customization)
- [Auth0 Custom Domains](https://auth0.com/docs/customize/custom-domains)

## Status

- [x] Frontend error page created and styled
- [ ] Auth0 Universal Login page customized (Backend/Auth0 Dashboard)
- [ ] Auth0 URL configuration reviewed
- [ ] Custom domain configured (if applicable)

---

**Requested By:** Frontend Agent  
**Date:** 2024  
**Related Issue:** Auth0 page has weird URL and no styling

