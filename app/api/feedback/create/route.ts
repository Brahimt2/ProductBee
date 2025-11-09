import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import dbConnect from '@/lib/db'
import Feedback from '@/models/Feedback'
import User from '@/models/User'
import Project from '@/models/Project'
import Feature from '@/models/Feature'
import { analyzeProposal } from '@/lib/gemini'
import mongoose from 'mongoose'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const { projectId, featureId, type, content, proposedRoadmap } = await request.json()

    if (!projectId || !featureId || !type || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(featureId)) {
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 })
    }

    // Verify project and feature exist
    const project = await Project.findById(projectId)
    const feature = await Feature.findById(featureId)
    
    if (!project || !feature) {
      return NextResponse.json({ error: 'Project or feature not found' }, { status: 404 })
    }

    // Get or create user
    let user = await User.findOne({ auth0Id: session.user.sub })
    if (!user) {
      user = await User.create({
        auth0Id: session.user.sub,
        name: session.user.name || session.user.email || 'Unknown',
        email: session.user.email || '',
        role: 'engineer',
      })
    }

    let aiAnalysis = undefined

    // If it's a proposal, analyze it with AI
    if (type === 'proposal') {
      try {
        const analysis = await analyzeProposal(content, project.roadmap)
        aiAnalysis = JSON.stringify(analysis)
      } catch (error) {
        console.error('Error analyzing proposal:', error)
        // Continue without AI analysis if it fails
      }
    }

    const feedback = await Feedback.create({
      projectId,
      featureId,
      userId: user._id,
      type,
      content,
      proposedRoadmap: proposedRoadmap || undefined,
      aiAnalysis,
      status: 'pending',
    })

    const populatedFeedback = await Feedback.findById(feedback._id)
      .populate('userId', 'name email')

    return NextResponse.json({ feedback: populatedFeedback })
  } catch (error: any) {
    console.error('Error creating feedback:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create feedback' },
      { status: 500 }
    )
  }
}

