import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import dbConnect from '@/lib/db'
import Feedback from '@/models/Feedback'
import User from '@/models/User'
import Feature from '@/models/Feature'
import Project from '@/models/Project'
import { compareRoadmaps } from '@/lib/gemini'
import mongoose from 'mongoose'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const { feedbackId } = await request.json()

    if (!feedbackId || !mongoose.Types.ObjectId.isValid(feedbackId)) {
      return NextResponse.json({ error: 'Invalid feedback ID' }, { status: 400 })
    }

    // Get user and check if they're a PM
    const user = await User.findOne({ auth0Id: session.user.sub })
    if (!user || (user.role !== 'pm' && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only PMs and admins can approve proposals' },
        { status: 403 }
      )
    }

    const feedback = await Feedback.findById(feedbackId)
    if (!feedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
    }

    if (feedback.type !== 'proposal') {
      return NextResponse.json(
        { error: 'Can only approve proposals' },
        { status: 400 }
      )
    }

    if (feedback.status !== 'pending') {
      return NextResponse.json(
        { error: 'Feedback already processed' },
        { status: 400 }
      )
    }

    const project = await Project.findById(feedback.projectId)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // If there's a proposed roadmap, compare and update
    if (feedback.proposedRoadmap) {
      try {
        const changes = await compareRoadmaps(
          { summary: project.roadmap.summary, features: [] },
          feedback.proposedRoadmap
        )
        
        // Update project roadmap if needed
        if (changes && changes.length > 0) {
          // Update features based on changes
          // This is simplified - in a real app you'd handle this more carefully
        }
      } catch (error) {
        console.error('Error comparing roadmaps:', error)
      }
    }

    // Update feedback status
    feedback.status = 'approved'
    await feedback.save()

    // Update related feature if needed (e.g., status, timeline)
    // This would depend on the proposal content

    return NextResponse.json({ 
      message: 'Proposal approved',
      feedback 
    })
  } catch (error: any) {
    console.error('Error approving feedback:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to approve feedback' },
      { status: 500 }
    )
  }
}

