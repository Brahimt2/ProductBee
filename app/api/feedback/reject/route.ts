import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import dbConnect from '@/lib/db'
import Feedback from '@/models/Feedback'
import User from '@/models/User'
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
        { error: 'Only PMs and admins can reject proposals' },
        { status: 403 }
      )
    }

    const feedback = await Feedback.findById(feedbackId)
    if (!feedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
    }

    if (feedback.status !== 'pending') {
      return NextResponse.json(
        { error: 'Feedback already processed' },
        { status: 400 }
      )
    }

    feedback.status = 'rejected'
    await feedback.save()

    return NextResponse.json({ 
      message: 'Proposal rejected',
      feedback 
    })
  } catch (error: any) {
    console.error('Error rejecting feedback:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to reject feedback' },
      { status: 500 }
    )
  }
}

