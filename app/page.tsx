import { getSession } from '@auth0/nextjs-auth0'
import { redirect } from 'next/navigation'
import { headers, cookies } from 'next/headers'

/**
 * Root Page
 * 
 * Redirects authenticated users to /dashboard
 * Redirects unauthenticated users to /home (public landing page)
 */
export default async function Home() {
  const headersList = await headers()
  const cookiesList = await cookies()
  
  // Check if user is authenticated
  const session = await getSession({ 
    req: { headers: headersList, cookies: cookiesList } as any 
  })
  
  // If authenticated, redirect to dashboard
  if (session) {
    redirect('/dashboard')
  }
  
  // If not authenticated, redirect to public landing page
  redirect('/home')
}

