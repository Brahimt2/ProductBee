import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import dbConnect from '@/lib/db'
import Project from '@/models/Project'
import User from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    // Get or create user
    let user = await User.findOne({ auth0Id: session.user.sub })
    if (!user) {
      user = await User.create({
        auth0Id: session.user.sub,
        name: session.user.name || session.user.email || 'Unknown',
        email: session.user.email || '',
        role: 'viewer',
      })
    }

    // Get all projects (in a real app, you'd filter by team/user)
    const projects = await Project.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })

    return NextResponse.json({ projects })
  } catch (error: any) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

