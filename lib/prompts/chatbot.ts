/**
 * Chatbot prompts for conversational ticket generation
 * Phase 11: AI-Powered Chatbot for Ticket Generation
 */

import type { ChatMessage, SuggestedTicket } from '@/types/chat'

export interface ChatbotInput {
  projectId: string
  projectName: string
  projectDescription: string
  message: string
  conversationHistory: ChatMessage[]
  existingFeatures?: Array<{
    id: string
    title: string
    status: string
    priority: string
    description?: string
  }>
  availableEngineers?: Array<{
    id: string
    name: string
    specialization: string | null
    currentTicketCount: number
    currentStoryPointCount: number
    isOnVacation: boolean
  }>
}

/**
 * Generate prompt for conversational ticket generation
 */
export function getChatbotPrompt(input: ChatbotInput): string {
  const conversationHistoryText = input.conversationHistory.length > 0
    ? `\n\nCONVERSATION HISTORY:\n${input.conversationHistory
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n')}`
    : ''

  const existingFeaturesText = input.existingFeatures && input.existingFeatures.length > 0
    ? `\n\nEXISTING FEATURES IN PROJECT:\n${input.existingFeatures
      .map((f) => `- ${f.title} (ID: ${f.id}, Status: ${f.status}, Priority: ${f.priority})${f.description ? ` - ${f.description.substring(0, 100)}...` : ''}`)
      .join('\n')}`
    : ''

  const engineersText = input.availableEngineers && input.availableEngineers.length > 0
    ? `\n\nAVAILABLE ENGINEERS:\n${input.availableEngineers
      .filter((eng) => !eng.isOnVacation)
      .map((eng) => `- ${eng.name} (ID: ${eng.id}, Specialization: ${eng.specialization || 'Not specified'}, Workload: ${eng.currentTicketCount} tickets, ${eng.currentStoryPointCount} story points)`)
      .join('\n')}`
    : ''

  return `You are an AI assistant helping a Product Manager generate and refine project tickets through conversation.

PROJECT CONTEXT:
Project ID: ${input.projectId}
Project Name: ${input.projectName}
Project Description: ${input.projectDescription}${existingFeaturesText}${engineersText}${conversationHistoryText}

USER MESSAGE:
${input.message}

Your task:
1. Understand the user's request (they may want to add tickets, modify existing ones, change priorities, assign tickets, etc.)
2. Generate appropriate ticket suggestions based on the conversation
3. If the user references existing tickets (e.g., "ticket 3", "the auth feature"), map them to the existing feature IDs provided
4. Suggest appropriate assignments based on engineer availability and specialization (if engineers are provided)
5. Provide a conversational response that acknowledges the request and explains your suggestions

COMMANDS YOU SHOULD UNDERSTAND:
- "add [feature]" - Add a new ticket/feature
- "change priority of ticket [X]" - Modify priority of existing ticket
- "assign [ticket] to [engineer]" - Suggest assignment
- "add [feature] to sprint 2" - Add ticket with timeline context
- "modify ticket [X]" - Modify existing ticket
- "generate tickets for [description]" - Generate multiple tickets from description

Return ONLY valid JSON in this exact format:
{
  "message": "Your conversational response to the user",
  "suggestedTickets": [
    {
      "title": "Ticket title",
      "description": "Detailed description",
      "priority": "critical" | "high" | "medium" | "low",
      "effortEstimateWeeks": number,
      "ticketType": "feature" | "bug" | "epic" | "story",
      "storyPoints": number | null,
      "labels": ["label1", "label2"],
      "acceptanceCriteria": "Criteria here" | null,
      "dependsOn": ["feature-id-1", "feature-id-2"] | [], // Use existing feature IDs if referencing existing tickets
      "assignedTo": "user-id" | null, // Suggest engineer ID if appropriate
      "confidenceScore": number (0-100) // Confidence in this suggestion
    }
  ],
  "confidenceScores": [number, number, ...] // Optional: array of confidence scores for each ticket
}

IMPORTANT:
- If the user is asking to modify existing tickets, you can still suggest new tickets or return an empty array if no new tickets are needed
- Always include existing feature IDs in dependsOn when referencing existing tickets
- Suggest assignments only if engineers are available and not on vacation
- Use confidence scores to indicate how certain you are about each suggestion
- Be conversational in your message response
- If the user asks questions or wants clarification, provide helpful responses in the message field
- Return empty suggestedTickets array if no new tickets should be created

Return ONLY valid JSON, no markdown formatting, no code blocks.`
}

/**
 * Parse and validate chatbot response from Gemini
 */
export interface ChatbotResponse {
  message: string
  suggestedTickets: SuggestedTicket[]
  confidenceScores?: number[]
}

export function parseChatbotResponse(response: string): ChatbotResponse {
  if (!response || typeof response !== 'string') {
    throw new Error('Invalid response from AI: response is not a string')
  }

  // Clean up the response (remove markdown code blocks if present)
  let cleanedText = response.trim()
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/```\n?/g, '')
  }

  try {
    const chatbotResponse = JSON.parse(cleanedText)

    // Validate the structure
    if (!chatbotResponse || typeof chatbotResponse !== 'object') {
      throw new Error('Invalid chatbot response structure: not an object')
    }

    // Validate message
    if (!chatbotResponse.message || typeof chatbotResponse.message !== 'string') {
      throw new Error('Invalid chatbot response: missing or invalid message')
    }

    // Validate suggestedTickets array
    if (!Array.isArray(chatbotResponse.suggestedTickets)) {
      throw new Error('Invalid chatbot response: suggestedTickets is not an array')
    }

    // Validate each suggested ticket
    chatbotResponse.suggestedTickets.forEach((ticket: any, index: number) => {
      if (!ticket.title || typeof ticket.title !== 'string') {
        throw new Error(`Invalid ticket at index ${index}: missing or invalid title`)
      }
      if (!ticket.description || typeof ticket.description !== 'string') {
        throw new Error(`Invalid ticket at index ${index}: missing or invalid description`)
      }
      if (!ticket.priority || !['critical', 'high', 'medium', 'low'].includes(ticket.priority)) {
        throw new Error(`Invalid ticket at index ${index}: missing or invalid priority`)
      }
      if (typeof ticket.effortEstimateWeeks !== 'number' || ticket.effortEstimateWeeks <= 0) {
        throw new Error(`Invalid ticket at index ${index}: missing or invalid effortEstimateWeeks`)
      }
      if (ticket.ticketType !== undefined && !['feature', 'bug', 'epic', 'story'].includes(ticket.ticketType)) {
        throw new Error(`Invalid ticket at index ${index}: invalid ticketType`)
      }
      if (ticket.storyPoints !== undefined && ticket.storyPoints !== null && typeof ticket.storyPoints !== 'number') {
        throw new Error(`Invalid ticket at index ${index}: storyPoints must be a number or null`)
      }
      if (ticket.labels !== undefined && !Array.isArray(ticket.labels)) {
        throw new Error(`Invalid ticket at index ${index}: labels must be an array`)
      }
      if (ticket.acceptanceCriteria !== undefined && ticket.acceptanceCriteria !== null && typeof ticket.acceptanceCriteria !== 'string') {
        throw new Error(`Invalid ticket at index ${index}: acceptanceCriteria must be a string or null`)
      }
      if (ticket.dependsOn !== undefined && !Array.isArray(ticket.dependsOn)) {
        throw new Error(`Invalid ticket at index ${index}: dependsOn must be an array`)
      }
      if (ticket.confidenceScore !== undefined && (typeof ticket.confidenceScore !== 'number' || ticket.confidenceScore < 0 || ticket.confidenceScore > 100)) {
        throw new Error(`Invalid ticket at index ${index}: confidenceScore must be a number between 0 and 100`)
      }
    })

    // Validate confidenceScores array if present
    if (chatbotResponse.confidenceScores !== undefined) {
      if (!Array.isArray(chatbotResponse.confidenceScores)) {
        throw new Error('Invalid chatbot response: confidenceScores is not an array')
      }
      chatbotResponse.confidenceScores.forEach((score: any, index: number) => {
        if (typeof score !== 'number' || score < 0 || score > 100) {
          throw new Error(`Invalid confidence score at index ${index}: must be a number between 0 and 100`)
        }
      })
    }

    return chatbotResponse
  } catch (error: any) {
    console.error('[Parse Chatbot Response] Error parsing response:', error)
    console.error('[Parse Chatbot Response] Response text:', cleanedText.substring(0, 500))
    throw new Error(`Failed to parse chatbot response from AI: ${error.message}`)
  }
}

