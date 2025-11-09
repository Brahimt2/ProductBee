import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import dbConnect from '@/lib/db'
import { generateRoadmap } from '@/lib/gemini'
import User from '@/models/User'
import Project from '@/models/Project'
import Feature from '@/models/Feature'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const { projectName, projectDescription } = await request.json()

    if (!projectName || !projectDescription) {
      return NextResponse.json(
        { error: 'Project name and description are required' },
        { status: 400 }
      )
    }

    // Get or create user
    let user = await User.findOne({ auth0Id: session.user.sub })
    if (!user) {
      user = await User.create({
        auth0Id: session.user.sub,
        name: session.user.name || session.user.email || 'Unknown',
        email: session.user.email || '',
        role: 'pm', // Default role, can be updated later
      })
    }

    // Generate roadmap using Gemini
    const roadmapData = await generateRoadmap(projectName, projectDescription)

    // Create project
    const project = await Project.create({
      name: projectName,
      description: projectDescription,
      createdBy: user._id,
      teamId: user._id.toString(), // Simplified teamId
      roadmap: {
        summary: roadmapData.summary,
        riskLevel: roadmapData.riskLevel,
      },
    })

    // Create features
    const featurePromises = roadmapData.features.map(async (feature: any, index: number) => {
      const dependsOnIds: any[] = []
      
      // Resolve dependencies after all features are created
      if (feature.dependsOn && feature.dependsOn.length > 0) {
        // We'll update these after creation
        return { feature, dependsOn: feature.dependsOn, index }
      }
      
      return { feature, dependsOn: [], index }
    })

    const featureData = await Promise.all(featurePromises)
    const createdFeatures = await Feature.insertMany(
      featureData.map(({ feature }) => ({
        projectId: project._id,
        title: feature.title,
        description: feature.description,
        priority: feature.priority,
        effortEstimateWeeks: feature.effortEstimateWeeks,
        dependsOn: [],
        status: 'backlog',
      }))
    )

    // Update dependencies
    for (let i = 0; i < featureData.length; i++) {
      const { dependsOn } = featureData[i]
      if (dependsOn && dependsOn.length > 0) {
        const dependencyIds = dependsOn
          .map((depIndex: number) => createdFeatures[depIndex]?._id)
          .filter(Boolean)
        await Feature.findByIdAndUpdate(createdFeatures[i]._id, {
          dependsOn: dependencyIds,
        })
      }
    }

    return NextResponse.json({
      project: {
        id: project._id,
        name: project.name,
        description: project.description,
        roadmap: project.roadmap,
      },
      features: createdFeatures,
    })
  } catch (error: any) {
    console.error('Error generating roadmap:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate roadmap' },
      { status: 500 }
    )
  }
}

