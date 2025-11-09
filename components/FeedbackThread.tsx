'use client'

import { MessageSquare, User, Clock, CheckCircle, XCircle } from 'lucide-react'

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

interface FeedbackThreadProps {
  feedback: Feedback[]
  onApprove?: (feedbackId: string) => void
  onReject?: (feedbackId: string) => void
  canApprove?: boolean
}

export default function FeedbackThread({
  feedback,
  onApprove,
  onReject,
  canApprove = false,
}: FeedbackThreadProps) {
  if (feedback.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No feedback yet. Be the first to comment!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {feedback.map((item) => (
        <div
          key={item._id}
          className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-900 dark:text-white">
                {item.userId.name}
              </span>
              <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {item.type}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {item.status === 'pending' && item.type === 'proposal' && canApprove && (
                <>
                  <button
                    onClick={() => onApprove?.(item._id)}
                    className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900 rounded"
                    title="Approve"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onReject?.(item._id)}
                    className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                    title="Reject"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </>
              )}
              {item.status === 'approved' && (
                <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs">Approved</span>
                </span>
              )}
              {item.status === 'rejected' && (
                <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                  <XCircle className="w-4 h-4" />
                  <span className="text-xs">Rejected</span>
                </span>
              )}
            </div>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap">
            {item.content}
          </p>
          {item.aiAnalysis && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-medium text-blue-900 dark:text-blue-200 mb-1">
                AI Analysis:
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-300 whitespace-pre-wrap">
                {typeof item.aiAnalysis === 'string'
                  ? JSON.parse(item.aiAnalysis).summary || item.aiAnalysis
                  : item.aiAnalysis}
              </p>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{new Date(item.createdAt).toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

