import { getSession } from '@auth0/nextjs-auth0'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/dashboard/DashboardClient'
import { createServerClient } from '@/lib/supabase'
import type { ProjectResponse } from '@/types'

async function getProjects() {
  try {
    const supabase = createServerClient()
    
    // Get or create user
    const session = await getSession()
    if (!session?.user) {
      return []
    }

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
        console.error('Error creating user:', createError)
        return []
      }
      user = newUser
    } else if (userError) {
      console.error('Error fetching user:', userError)
      return []
    }

    // Get all projects with creator info
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select(`
        *,
        created_by:users!projects_created_by_fkey (
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (projectsError) {
      console.error('Error fetching projects:', projectsError)
      return []
    }

    // Format projects to match expected structure
    return projects?.map((project: any): ProjectResponse => ({
      _id: project.id,
      id: project.id,
      name: project.name,
      description: project.description,
      roadmap: project.roadmap,
      createdAt: project.created_at,
      createdBy: project.created_by ? {
        name: project.created_by.name,
        email: project.created_by.email,
      } : null,
    })) || []
  } catch (error) {
    console.error('Error fetching projects:', error)
    return []
  }
}

export default async function DashboardPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/api/auth/login')
  }

  const projects = await getProjects()

  // Ensure we always pass an array
  return <DashboardClient projects={Array.isArray(projects) ? projects : []} />
}

