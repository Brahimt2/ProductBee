/**
 * Chat message and context types for AI-powered chatbot
 * Phase 11: AI-Powered Chatbot for Ticket Generation
 */

/**
 * Chat message role
 */
export type ChatRole = 'user' | 'assistant'

/**
 * Chat message in conversation history
 */
export interface ChatMessage {
  role: ChatRole
  content: string
  timestamp: string // ISO date string
}

/**
 * Suggested ticket from AI chat
 */
export interface SuggestedTicket {
  title: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  effortEstimateWeeks: number
  ticketType?: 'feature' | 'bug' | 'epic' | 'story'
  storyPoints?: number | null
  labels?: string[]
  acceptanceCriteria?: string | null
  dependsOn?: string[] // Array of existing feature IDs or suggested ticket indices
  assignedTo?: string | null // User ID (AI-suggested)
  confidenceScore?: number // 0-100, confidence in this suggestion
}

/**
 * Chat context for conversation
 */
export interface ChatContext {
  projectId: string
  conversationHistory: ChatMessage[]
  generatedTickets: SuggestedTicket[]
  existingFeatures?: Array<{
    id: string
    title: string
    status: string
    priority: string
  }>
}

/**
 * Chat AI response
 */
export interface ChatResponse {
  message: string // AI's conversational response
  suggestedTickets: SuggestedTicket[] // Array of suggested tickets
  confidenceScores?: number[] // Confidence scores for each ticket
}

