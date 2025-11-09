'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { ProjectResponse, GetProjectsResponse, GetProjectResponse } from '@/types'

export function useProjects() {
  const [projects, setProjects] = useState<ProjectResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/projects')
      
      const responseData = await response.json()

      if (!response.ok || !responseData.success) {
        throw new Error(responseData.error || 'Failed to fetch projects')
      }

      // Handle wrapped response: { success: true, data: { projects: [...] } }
      const data: GetProjectsResponse = responseData.data
      setProjects(data.projects || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching projects:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()

    // Subscribe to real-time changes
    const channel = supabase
      .channel('projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
        },
        () => {
          // Refresh projects when changes occur
          fetchProjects()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchProjects])

  return {
    projects,
    isLoading,
    error,
    refetch: fetchProjects,
  }
}

export function useProject(projectId: string) {
  const [projectData, setProjectData] = useState<GetProjectResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProject = useCallback(async () => {
    if (!projectId) return

    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch(`/api/project/${projectId}`)

      const responseData = await response.json()

      if (!response.ok || !responseData.success) {
        throw new Error(responseData.error || 'Failed to fetch project')
      }

      // Handle wrapped response: { success: true, data: { project: {...}, features: [...], feedbackByFeature: {...} } }
      const data: GetProjectResponse = responseData.data
      setProjectData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching project:', err)
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchProject()

    // Subscribe to real-time changes for features and feedback
    const featuresChannel = supabase
      .channel(`project-${projectId}-features`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'features',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchProject()
        }
      )
      .subscribe()

    const feedbackChannel = supabase
      .channel(`project-${projectId}-feedback`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'feedback',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchProject()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(featuresChannel)
      supabase.removeChannel(feedbackChannel)
    }
  }, [projectId, fetchProject])

  return {
    projectData,
    isLoading,
    error,
    refetch: fetchProject,
  }
}

