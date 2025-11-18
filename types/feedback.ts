/**
 * Feedback-related types
 */

export interface RoadmapFeature {
  title: string
  description: string
  priority: 'P0' | 'P1' | 'P2'
  effortEstimateWeeks: number
  dependsOn: number[]
}

export interface RoadmapResponse {
  summary: string
  riskLevel: string
  features: RoadmapFeature[]
}

export interface ProposalAnalysis {
  summary: string
  timelineImpact: string
  recommendedAdjustments: string
}

export interface RoadmapComparison {
  changedFeatures: RoadmapFeature[]
}
