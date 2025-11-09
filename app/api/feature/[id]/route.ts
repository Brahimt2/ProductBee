import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import dbConnect from '@/lib/db'
import Feature from '@/models/Feature'
import mongoose from 'mongoose'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const featureId = params.id
    const updates = await request.json()

    if (!mongoose.Types.ObjectId.isValid(featureId)) {
      return NextResponse.json({ error: 'Invalid feature ID' }, { status: 400 })
    }

    const feature = await Feature.findByIdAndUpdate(
      featureId,
      updates,
      { new: true }
    )

    if (!feature) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 })
    }

    return NextResponse.json({ feature })
  } catch (error: any) {
    console.error('Error updating feature:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update feature' },
      { status: 500 }
    )
  }
}

