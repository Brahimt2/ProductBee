# Environment Variables Template

Copy this to `.env.local` and fill in your values:

```env
# Auth0 Configuration
AUTH0_SECRET=your-auth0-secret-here
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key-here
```

## Getting Your Credentials

### Auth0
1. Sign up at https://auth0.com
2. Create a new application (Regular Web Application)
3. Set callback URL: `http://localhost:3000/api/auth/callback`
4. Set logout URL: `http://localhost:3000`
5. Copy the credentials to your `.env.local`

### Supabase
1. Sign up at https://supabase.com
2. Create a new project
3. Go to Project Settings > API
4. Copy your Project URL to `NEXT_PUBLIC_SUPABASE_URL`
5. Copy your `anon` `public` key to `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Run the SQL schema from `supabase/schema.sql` in the SQL Editor
7. Enable Realtime in Database > Replication settings for tables: projects, features, feedback

### Gemini API
1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Copy to `.env.local`

