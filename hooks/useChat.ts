'use client'

import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import type { ChatMessage, SuggestedTicket, ChatResponse } from '@/types/chat'

const MAX_CHAT_HISTORY = 50

/**
 * Hook for managing AI chat functionality
 * Phase 11: AI-Powered Chatbot for Ticket Generation
 */
export function useChat(projectId: string) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([])
  const [suggestedTickets, setSuggestedTickets] = useState<SuggestedTicket[]>([])

  // Load chat history from localStorage
  const loadChatHistory = useCallback(() => {
    if (typeof window === 'undefined') return []
    
    try {
      const key = `chat-history-${projectId}`
      const stored = localStorage.getItem(key)
      if (stored) {
        const history = JSON.parse(stored) as ChatMessage[]
        setConversationHistory(history)
        return history
      }
    } catch (error) {
      console.error('Failed to load chat history:', error)
    }
    return []
  }, [projectId])

  // Save chat history to localStorage
  const saveChatHistory = useCallback((history: ChatMessage[]) => {
    if (typeof window === 'undefined') return
    
    try {
      const key = `chat-history-${projectId}`
      // Prune oldest messages if over limit
      const prunedHistory = history.length > MAX_CHAT_HISTORY 
        ? history.slice(-MAX_CHAT_HISTORY)
        : history
      localStorage.setItem(key, JSON.stringify(prunedHistory))
      setConversationHistory(prunedHistory)
    } catch (error) {
      console.error('Failed to save chat history:', error)
    }
  }, [projectId])

  // Clear chat history
  const clearChatHistory = useCallback(() => {
    if (typeof window === 'undefined') return
    
    try {
      const key = `chat-history-${projectId}`
      localStorage.removeItem(key)
      setConversationHistory([])
      setSuggestedTickets([])
    } catch (error) {
      console.error('Failed to clear chat history:', error)
    }
  }, [projectId])

  // Generate tickets via chat
  const generateTickets = useCallback(async (
    message: string
  ): Promise<ChatResponse | null> => {
    try {
      setIsGenerating(true)
      
      const currentHistory = conversationHistory.length > 0 
        ? conversationHistory 
        : loadChatHistory()

      const response = await fetch('/api/chat/generate-tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          message,
          conversationHistory: currentHistory,
        }),
      })

      const responseData = await response.json()

      if (!response.ok || !responseData.success) {
        if (response.status === 403 || responseData.error?.includes('Access denied')) {
          throw new Error('Only PMs and Admins can generate tickets via chat.')
        }
        if (response.status === 404) {
          throw new Error('Project not found or you do not have access to it.')
        }
        throw new Error(responseData.error || 'Failed to generate tickets')
      }

      const data = responseData.data as ChatResponse

      // Add user message and AI response to history
      const userMessage: ChatMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      }
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
      }

      const newHistory = [...currentHistory, userMessage, assistantMessage]
      saveChatHistory(newHistory)

      // Update suggested tickets
      setSuggestedTickets(data.suggestedTickets || [])

      return data
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate tickets'
      toast.error(message)
      console.error('Error generating tickets:', error)
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [projectId, conversationHistory, loadChatHistory, saveChatHistory])

  // Apply tickets (bulk create)
  const applyTickets = useCallback(async (
    tickets: SuggestedTicket[]
  ): Promise<string[] | null> => {
    try {
      setIsApplying(true)

      const response = await fetch('/api/chat/apply-tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          tickets,
        }),
      })

      const responseData = await response.json()

      if (!response.ok || !responseData.success) {
        if (response.status === 403 || responseData.error?.includes('Access denied')) {
          throw new Error('Only PMs and Admins can apply tickets.')
        }
        if (response.status === 404) {
          throw new Error('Project not found or you do not have access to it.')
        }
        throw new Error(responseData.error || 'Failed to apply tickets')
      }

      const data = responseData.data
      const createdIds = data.createdTicketIds || []

      toast.success(`Successfully created ${createdIds.length} ticket(s)`)
      
      // Clear suggested tickets after applying
      setSuggestedTickets([])

      return createdIds
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to apply tickets'
      toast.error(message)
      console.error('Error applying tickets:', error)
      return null
    } finally {
      setIsApplying(false)
    }
  }, [projectId])

  return {
    generateTickets,
    applyTickets,
    conversationHistory,
    suggestedTickets,
    isGenerating,
    isApplying,
    loadChatHistory,
    clearChatHistory,
    setSuggestedTickets,
  }
}

