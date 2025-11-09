import { getSession } from '@auth0/nextjs-auth0'
import { redirect } from 'next/navigation'
import ProjectDetailClient from '@/components/project/ProjectDetailClient'
import { createServerClient } from '@/lib/supabase'
import type { GetProjectResponse, FeatureResponse, FeedbackResponse } from '@/types'

async function getProjectData(id: string) {
  try {
    const supabase = createServerClient()

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return null
    }

    // Get project with creator info
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        *,
        created_by:users!projects_created_by_fkey (
          name,
          email
        )
      `)
      .eq('id', id)
      .single()

    if (projectError || !project) {
      return null
    }

    // Get features for this project
    const { data: features, error: featuresError } = await supabase
      .from('features')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: true })

    if (featuresError) {
      console.error('Error fetching features:', featuresError)
      return null
    }

    // Get feedback for this project
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .select(`
        *,
        user_id:users!feedback_user_id_fkey (
          name,
          email
        )
      `)
      .eq('project_id', id)
      .order('created_at', { ascending: false })

    if (feedbackError) {
      console.error('Error fetching feedback:', feedbackError)
      return null
    }

    // Group feedback by feature
    const feedbackByFeature: Record<string, FeedbackResponse[]> = {}
    feedback?.forEach((fb: any) => {
      const featureId = fb.feature_id
      if (!feedbackByFeature[featureId]) {
        feedbackByFeature[featureId] = []
      }
      feedbackByFeature[featureId].push({
        _id: fb.id,
        id: fb.id,
        projectId: fb.project_id,
        featureId: fb.feature_id,
        userId: fb.user_id ? {
          _id: fb.user_id.id,
          name: fb.user_id.name,
          email: fb.user_id.email,
        } : null,
        type: fb.type,
        content: fb.content,
        proposedRoadmap: fb.proposed_roadmap,
        aiAnalysis: fb.ai_analysis,
        status: fb.status,
        createdAt: fb.created_at,
      })
    })

    // Format project data
    const formattedProject: GetProjectResponse['project'] = {
      _id: project.id,
      id: project.id,
      name: project.name,
      description: project.description,
      roadmap: project.roadmap,
      createdAt: project.created_at,
      createdBy: project.created_by ? {
        name: project.created_by.name,
        email: project.created_by.email,
      } : undefined,
    }

    // Format features data
    const formattedFeatures: FeatureResponse[] = features?.map((feature): FeatureResponse => ({
      _id: feature.id,
      id: feature.id,
      projectId: feature.project_id,
      title: feature.title,
      description: feature.description,
      status: feature.status,
      priority: feature.priority,
      effortEstimateWeeks: feature.effort_estimate_weeks,
      dependsOn: feature.depends_on || [],
      createdAt: feature.created_at,
    })) || []

    const result: GetProjectResponse = {
      project: formattedProject,
      features: formattedFeatures,
      feedbackByFeature,
    }

    return result
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

