import { getSession } from '@auth0/nextjs-auth0'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/DashboardClient'
import dbConnect from '@/lib/db'
import Project from '@/models/Project'
import User from '@/models/User'

async function getProjects() {
  try {
    await dbConnect()
    
    // Get or create user
    const session = await getSession()
    if (!session?.user) {
      return []
    }

    let user = await User.findOne({ auth0Id: session.user.sub })
    if (!user) {
      user = await User.create({
        auth0Id: session.user.sub,
        name: session.user.name || session.user.email || 'Unknown',
        email: session.user.email || '',
        role: 'viewer',
      })
    }

    // Get all projects
    const projects = await Project.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean()

    return projects.map((p: any) => ({
      ...p,
      _id: p._id.toString(),
      createdAt: p.createdAt.toISOString(),
    }))
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

  return <DashboardClient projects={projects} />
}

