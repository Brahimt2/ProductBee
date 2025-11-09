/**
 * Database-specific types
 * These types represent the actual database schema (snake_case)
 */

export interface DatabaseUser {
  id: string
  auth0_id: string
  email: string
  name: string
  role: 'admin' | 'pm' | 'engineer' | 'viewer'
  team_id?: string
  created_at: string
}

export interface DatabaseProject {
  id: string
  name: string
  description: string
  created_by: string
  team_id: string
  roadmap: {
    summary: string
    riskLevel: 'low' | 'medium' | 'high'
  }
  created_at: string
}

export interface DatabaseFeature {
  id: string
  project_id: string
  title: string
  description: string
  status: 'backlog' | 'active' | 'blocked' | 'complete'
  priority: 'P0' | 'P1' | 'P2'
  effort_estimate_weeks: number
  depends_on: string[]
  created_at: string
}

export interface DatabaseFeedback {
  id: string
  project_id: string
  feature_id: string
  user_id: string
  type: 'comment' | 'proposal'
  content: string
  proposed_roadmap?: any
  ai_analysis?: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}
