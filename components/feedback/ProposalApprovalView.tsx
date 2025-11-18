'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, ArrowRight, FileText, AlertCircle } from 'lucide-react'
import { ROLES } from '@/lib/constants'
import type { FeedbackResponse, ProjectResponse, FeatureResponse } from '@/types'

interface ProposalApprovalViewProps {
  feedback: FeedbackResponse
  project: ProjectResponse
  features: FeatureResponse[]
  onApprove: (feedbackId: string) => void
  onReject: (feedbackId: string) => void
  canApprove?: boolean
}

/**
 * ProposalApprovalView - Side-by-side comparison view for proposal approval
 * Phase 10: Feedback & Proposal System
 * 
 * Shows original roadmap vs proposed roadmap changes for PMs to review
 */
export default function ProposalApprovalView({
  feedback,
  project,
  features,
  onApprove,
  onReject,
  canApprove = false,
}: ProposalApprovalViewProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Parse AI analysis if available
  let aiAnalysis: {
    summary?: string
    timelineImpact?: string
    recommendedAdjustments?: string
    requires_timeline_change?: boolean
    suggested_action?: string
    affected_features?: string[]
    reasoning?: string
  } | null = null

  if (feedback.aiAnalysis) {
    try {
      if (typeof feedback.aiAnalysis === 'string') {
        aiAnalysis = JSON.parse(feedback.aiAnalysis)
      } else {
        aiAnalysis = feedback.aiAnalysis
      }
    } catch (error) {
      console.error('Error parsing AI analysis:', error)
    }
  }

  // Parse proposed roadmap if available
  const proposedRoadmap = feedback.proposedRoadmap || null

  // Only show for proposals (check both 'proposal' and 'timeline_proposal' as DB uses 'proposal')
  if (feedback.type !== 'proposal' && feedback.type !== 'timeline_proposal') {
    return null
  }

  return (
    <div className="border border-purple-200 dark:border-purple-800 rounded-lg bg-purple-50 dark:bg-purple-900/20 p-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-200 mb-2 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Proposal Review
          </h4>
          {feedback.status === 'pending' && (
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Review the proposal and AI analysis below to make an informed decision.
            </p>
          )}
        </div>
        {feedback.status === 'pending' && canApprove && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onReject(feedback._id || feedback.id)}
              className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
            <button
              onClick={() => onApprove(feedback._id || feedback.id)}
              className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Approve
            </button>
          </div>
        )}
      </div>

      {/* Proposal Content */}
      <div className="mb-4">
        <h5 className="text-sm font-semibold text-purple-900 dark:text-purple-200 mb-2">
          Proposal Description
        </h5>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {feedback.content}
          </p>
        </div>
      </div>

      {/* AI Analysis */}
      {aiAnalysis && (
        <div className="mb-4">
          <h5 className="text-sm font-semibold text-purple-900 dark:text-purple-200 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            AI Analysis
          </h5>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 space-y-3">
            {aiAnalysis.summary && (
              <div>
                <p className="text-xs font-medium text-blue-900 dark:text-blue-200 mb-1">
                  Summary:
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-300 whitespace-pre-wrap">
                  {aiAnalysis.summary}
                </p>
              </div>
            )}
            {aiAnalysis.timelineImpact && (
              <div>
                <p className="text-xs font-medium text-blue-900 dark:text-blue-200 mb-1">
                  Timeline Impact:
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-300 whitespace-pre-wrap">
                  {aiAnalysis.timelineImpact}
                </p>
              </div>
            )}
            {aiAnalysis.reasoning && (
              <div>
                <p className="text-xs font-medium text-blue-900 dark:text-blue-200 mb-1">
                  Reasoning:
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-300 whitespace-pre-wrap">
                  {aiAnalysis.reasoning}
                </p>
              </div>
            )}
            {aiAnalysis.suggested_action && (
              <div>
                <p className="text-xs font-medium text-blue-900 dark:text-blue-200 mb-1">
                  Suggested Action:
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-300 whitespace-pre-wrap">
                  {aiAnalysis.suggested_action}
                </p>
              </div>
            )}
            {aiAnalysis.affected_features && aiAnalysis.affected_features.length > 0 && (
              <div>
                <p className="text-xs font-medium text-blue-900 dark:text-blue-200 mb-1">
                  Affected Features:
                </p>
                <div className="flex flex-wrap gap-2">
                  {aiAnalysis.affected_features.map((featureId, index) => {
                    const feature = features.find((f) => f._id === featureId || f.id === featureId)
                    return (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs"
                      >
                        {feature ? feature.title : featureId}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
            {aiAnalysis.requires_timeline_change !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-blue-900 dark:text-blue-200">
                  Requires Timeline Change:
                </span>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    aiAnalysis.requires_timeline_change
                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}
                >
                  {aiAnalysis.requires_timeline_change ? 'Yes' : 'No'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Proposed Roadmap Changes */}
      {proposedRoadmap && (
        <div className="mb-4">
          <h5 className="text-sm font-semibold text-purple-900 dark:text-purple-200 mb-2">
            Proposed Roadmap Changes
          </h5>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-x-auto">
              {JSON.stringify(proposedRoadmap, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Status Indicator */}
      {feedback.status !== 'pending' && (
        <div
          className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
            feedback.status === 'approved'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
          }`}
        >
          {feedback.status === 'approved' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
          <span className="font-semibold text-sm">
            {feedback.status === 'approved' ? 'Approved' : 'Rejected'}
          </span>
        </div>
      )}
    </div>
  )
}

