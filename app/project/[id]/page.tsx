import { getSession } from '@auth0/nextjs-auth0'
import { redirect } from 'next/navigation'
import ProjectDetailClient from '@/components/ProjectDetailClient'
import dbConnect from '@/lib/db'
import Project from '@/models/Project'
import Feature from '@/models/Feature'
import Feedback from '@/models/Feedback'
import mongoose from 'mongoose'

async function getProjectData(id: string) {
  try {
    await dbConnect()

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null
    }

    const project = await Project.findById(id)
      .populate('createdBy', 'name email')
      .lean()

    if (!project) {
      return null
    }

    const features = await Feature.find({ projectId: id })
      .sort({ createdAt: 1 })
      .lean()

    const feedback = await Feedback.find({ projectId: id })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .lean()

    // Group feedback by feature
    const feedbackByFeature: Record<string, any[]> = {}
    feedback.forEach((fb: any) => {
      const featureId = fb.featureId.toString()
      if (!feedbackByFeature[featureId]) {
        feedbackByFeature[featureId] = []
      }
      feedbackByFeature[featureId].push({
        ...fb,
        _id: fb._id.toString(),
        createdAt: fb.createdAt.toISOString(),
        userId: {
          name: fb.userId.name,
          email: fb.userId.email,
        },
      })
    })

    return {
      project: {
        ...project,
        _id: project._id.toString(),
        createdAt: project.createdAt.toISOString(),
      },
      features: features.map((f: any) => ({
        ...f,
        _id: f._id.toString(),
        projectId: f.projectId.toString(),
        dependsOn: f.dependsOn.map((d: any) => d.toString()),
        createdAt: f.createdAt.toISOString(),
      })),
      feedbackByFeature,
    }
  } catch (error) {
    console.error('Error fetching project:', error)
    return null
  }
}

export default async function ProjectPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getSession()
  
  if (!session) {
    redirect('/api/auth/login')
  }

  const data = await getProjectData(params.id)

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Project Not Found
          </h1>
          <a
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    )
  }

  return <ProjectDetailClient projectData={data} userRole={session.user?.role as string} />
}

