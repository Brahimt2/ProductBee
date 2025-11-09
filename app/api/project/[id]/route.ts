import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import dbConnect from '@/lib/db'
import Project from '@/models/Project'
import Feature from '@/models/Feature'
import Feedback from '@/models/Feedback'
import User from '@/models/User'
import mongoose from 'mongoose'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const projectId = params.id

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }

    const project = await Project.findById(projectId).populate('createdBy', 'name email')
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const features = await Feature.find({ projectId }).sort({ createdAt: 1 })

    const feedback = await Feedback.find({ projectId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })

    // Group feedback by feature
    const feedbackByFeature: Record<string, any[]> = {}
    feedback.forEach((fb) => {
      const featureId = fb.featureId.toString()
      if (!feedbackByFeature[featureId]) {
        feedbackByFeature[featureId] = []
      }
      feedbackByFeature[featureId].push(fb)
    })

    return NextResponse.json({
      project,
      features,
      feedbackByFeature,
    })
  } catch (error: any) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

