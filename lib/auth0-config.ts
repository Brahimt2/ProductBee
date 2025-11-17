/**
 * Auth0 Configuration
 * 
 * This file exports Auth0 configuration for styling and customization.
 * 
 * IMPORTANT: The Auth0 Universal Login page is hosted by Auth0 and cannot be
 * styled directly from our codebase. The URL structure is also controlled by Auth0.
 * To customize the login page appearance and URL, you must configure it in the
 * Auth0 Dashboard (see instructions below).
 */

export const auth0Config = {
  // Base URL for Auth0 callbacks
  baseURL: process.env.AUTH0_BASE_URL || 'http://localhost:3000',
  
  // Styling configuration for Auth0 SDK
  // Note: This affects the SDK behavior, but full hosted page styling
  // requires Auth0 Dashboard configuration
  theme: {
    primaryColor: '#a855f7', // Purple accent color matching ProductBee theme
    logo: '/bee_logo.png',
  },
}

/**
 * Auth0 Dashboard Configuration Instructions:
 * 
 * To customize the Auth0 Universal Login page (the page users see when logging in):
 * 
 * 1. Login to your Auth0 Dashboard
 * 2. Navigate to Branding > Universal Login
 * 3. Enable "Customize Login Page"
 * 4. Choose your experience:
 *    - "Classic" - Full control with custom HTML/CSS/JS
 *    - "New" - Modern experience with limited customization
 * 
 * 5. For Classic experience, apply the following CSS in the Login Page template:
 * 
 * ```css
 * body {
 *   font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
 *   background-color: #f5f5f5;
 *   color: #0d0d0d;
 * }
 * 
 * .auth0-lock {
 *   border-radius: 24px;
 * }
 * 
 * .auth0-lock-widget {
 *   border-radius: 24px;
 *   box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
 * }
 * 
 * .auth0-lock-submit {
 *   background-color: #a855f7;
 *   border-radius: 24px;
 * }
 * 
 * .auth0-lock-submit:hover {
 *   background-color: #9333ea;
 * }
 * ```
 * 
 * 6. Set your logo in Branding > Universal Login > Logo
 *    - Upload `/public/bee_logo.png` or use a hosted URL
 * 
 * 7. Configure colors in Branding > Universal Login > Colors:
 *    - Primary: #a855f7
 *    - Background: #f5f5f5
 *    - Text: #0d0d0d
 * 
 * 8. For cleaner URLs, you can configure a custom domain in Auth0:
 *    - Navigate to Custom Domains in Auth0 Dashboard
 *    - This requires DNS configuration and is optional
 *    - Default Auth0 URLs will work fine
 * 
 * Note: The login page URL structure (e.g., `https://your-tenant.auth0.com/authorize?...`)
 * is controlled by Auth0 and cannot be changed from our codebase. The URL parameters
 * are automatically managed by the Auth0 Next.js SDK.
 */

