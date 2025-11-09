'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@auth0/nextjs-auth0/client'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import FeatureCard from './FeatureCard'
import FeatureModal from './FeatureModal'

interface Feature {
  _id: string
  title: string
  description: string
  priority: 'P0' | 'P1' | 'P2'
  effortEstimateWeeks: number
  status: 'backlog' | 'active' | 'blocked' | 'complete'
}

interface Feedback {
  _id: string
  type: 'comment' | 'proposal'
  content: string
  aiAnalysis?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  userId: {
    name: string
    email: string
  }
}

interface Project {
  _id: string
  name: string
  description: string
  roadmap: {
    summary: string
    riskLevel: string
  }
  createdBy?: {
    name: string
    email: string
  }
}

interface ProjectDetailClientProps {
  projectData: {
    project: Project
    features: Feature[]
    feedbackByFeature: Record<string, Feedback[]>
  }
  userRole?: string
}

export default function ProjectDetailClient({
  projectData: initialData,
  userRole,
}: ProjectDetailClientProps) {
  const router = useRouter()
  const { user } = useUser()
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null)
  const [projectData, setProjectData] = useState(initialData)

  const refreshData = async () => {
    try {
      const response = await fetch(`/api/project/${projectData.project._id}`)
      if (response.ok) {
        const data = await response.json()
        setProjectData(data)
      }
    } catch (error) {
      console.error('Error refreshing data:', error)
    }
  }

  const handleFeatureClick = (feature: Feature) => {
    setSelectedFeature(feature)
  }

  const handleFeatureUpdate = async (featureId: string, updates: Partial<Feature>) => {
    try {
      const response = await fetch(`/api/feature/${featureId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        await refreshData()
      }
    } catch (error) {
      console.error('Error updating feature:', error)
    }
  }

  const handleDrop = async (featureId: string, newStatus: Feature['status']) => {
    await handleFeatureUpdate(featureId, { status: newStatus })
  }

  const columns = [
    { id: 'backlog', title: 'Backlog' },
    { id: 'active', title: 'In Progress' },
    { id: 'blocked', title: 'Blocked' },
    { id: 'complete', title: 'Complete' },
  ]

  const getFeaturesByStatus = (status: string) => {
    return projectData.features.filter((f) => f.status === status)
  }

  const riskColors: Record<string, string> = {
    low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <a
              href="/dashboard"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {projectData.project.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {projectData.project.description}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                riskColors[projectData.project.roadmap.riskLevel.toLowerCase()] ||
                'bg-gray-100 text-gray-800'
              }`}
            >
              {projectData.project.roadmap.riskLevel} Risk
            </span>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Roadmap Summary
            </h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {projectData.project.roadmap.summary}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Features
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((column) => {
            const features = getFeaturesByStatus(column.id)
            return (
              <div
                key={column.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  {column.title} ({features.length})
                </h3>
                <div className="space-y-3 min-h-[200px]">
                  {features.map((feature) => (
                    <FeatureCard
                      key={feature._id}
                      feature={feature}
                      onClick={() => handleFeatureClick(feature)}
                    />
                  ))}
                  {features.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No features
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {selectedFeature && (
        <FeatureModal
          isOpen={!!selectedFeature}
          onClose={() => setSelectedFeature(null)}
          feature={selectedFeature}
          projectId={projectData.project._id}
          feedback={
            projectData.feedbackByFeature[selectedFeature._id] || []
          }
          userRole={userRole}
          onFeatureUpdate={refreshData}
        />
      )}
    </div>
  )
}

