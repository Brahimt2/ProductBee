/**
 * Roadmap-related types
 * Note: These are kept for backward compatibility
 * New types should be added to feedback.ts
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

