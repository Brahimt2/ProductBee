'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Sparkles, Loader2 } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import type { SuggestedTicket } from '@/types/chat'
import { PRIORITY_LEVELS } from '@/lib/constants'

interface TicketGenerationControlsProps {
  projectId: string
  onTicketsApplied?: (ticketIds: string[]) => void
}

type GenerationMode = 'all' | 'one' | 'none'

export default function TicketGenerationControls({
  projectId,
  onTicketsApplied,
}: TicketGenerationControlsProps) {
  const [generationMode, setGenerationMode] = useState<GenerationMode>('none')
  const [selectedTickets, setSelectedTickets] = useState<Set<number>>(new Set())
  const [visibleTickets, setVisibleTickets] = useState<number[]>([])
  const [firstTicketLoadTime, setFirstTicketLoadTime] = useState<number | null>(null)

  const {
    suggestedTickets,
    applyTickets,
    isApplying,
    isGenerating,
    setSuggestedTickets,
  } = useChat(projectId)

  // Handle lazy loading animations
  useEffect(() => {
    if (suggestedTickets.length === 0) {
      setVisibleTickets([])
      setFirstTicketLoadTime(null)
      return
    }

    // If generating, show skeleton loaders
    if (isGenerating) {
      return
    }

    // Fade in tickets with stagger animation
    const staggerDelay = 150 // ms between each ticket
    const baseDelay = firstTicketLoadTime ? 0 : 200 // Initial delay for first ticket

    suggestedTickets.forEach((_, index) => {
      setTimeout(() => {
        setVisibleTickets((prev) => {
          if (!prev.includes(index)) {
            return [...prev, index]
          }
          return prev
        })
      }, baseDelay + index * staggerDelay)
    })

    // Set first ticket load time for consistency
    if (firstTicketLoadTime === null && suggestedTickets.length > 0) {
      setFirstTicketLoadTime(Date.now())
    }
  }, [suggestedTickets, isGenerating, firstTicketLoadTime])

  const handleModeChange = (mode: GenerationMode) => {
    setGenerationMode(mode)
    if (mode === 'all') {
      // Select all tickets
      setSelectedTickets(new Set(suggestedTickets.map((_, index) => index)))
    } else if (mode === 'one') {
      // Select only first ticket
      setSelectedTickets(new Set([0]))
    } else {
      // Deselect all
      setSelectedTickets(new Set())
    }
  }

  const handleTicketToggle = (index: number) => {
    const newSelected = new Set(selectedTickets)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedTickets(newSelected)

    // Update mode based on selection
    if (newSelected.size === 0) {
      setGenerationMode('none')
    } else if (newSelected.size === suggestedTickets.length) {
      setGenerationMode('all')
    } else if (newSelected.size === 1) {
      setGenerationMode('one')
    } else {
      setGenerationMode('none') // Custom selection
    }
  }

  const handleApply = async () => {
    if (selectedTickets.size === 0) return

    const ticketsToApply = suggestedTickets.filter((_, index) =>
      selectedTickets.has(index)
    )

    const createdIds = await applyTickets(ticketsToApply)
    if (createdIds) {
      // Remove applied tickets from suggestions
      const remainingTickets = suggestedTickets.filter(
        (_, index) => !selectedTickets.has(index)
      )
      setSuggestedTickets(remainingTickets)
      setSelectedTickets(new Set())
      setGenerationMode('none')
      onTicketsApplied?.(createdIds)
    }
  }

  const handleDismiss = () => {
    setSuggestedTickets([])
    setSelectedTickets(new Set())
    setGenerationMode('none')
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case PRIORITY_LEVELS.CRITICAL:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case PRIORITY_LEVELS.HIGH:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case PRIORITY_LEVELS.MEDIUM:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case PRIORITY_LEVELS.LOW:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  // Show skeleton loaders while generating
  if (isGenerating && suggestedTickets.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Generating tickets...
          </h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 animate-pulse"
            >
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0 mt-1" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (suggestedTickets.length === 0) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI-Generated Tickets ({suggestedTickets.length})
          </h3>
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          aria-label="Dismiss"
        >
          <XCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Mode Selector */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Generation Mode
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => handleModeChange('all')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              generationMode === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Generate All
          </button>
          <button
            onClick={() => handleModeChange('one')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              generationMode === 'one'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            One at a Time
          </button>
          <button
            onClick={() => handleModeChange('none')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              generationMode === 'none'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            None
          </button>
        </div>
      </div>

      {/* Ticket List */}
      <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
        {suggestedTickets.map((ticket, index) => {
          const isVisible = visibleTickets.includes(index)
          const isLoading = isGenerating && !isVisible
          
          return (
            <div
              key={index}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                isLoading
                  ? 'opacity-0'
                  : isVisible
                  ? 'opacity-100 animate-fade-in'
                  : 'opacity-0'
              } ${
                selectedTickets.has(index)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => handleTicketToggle(index)}
              style={{
                animationDelay: `${index * 150}ms`,
              }}
            >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {selectedTickets.has(index) ? (
                  <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                ) : (
                  <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {ticket.title}
                  </h4>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${getPriorityColor(
                      ticket.priority
                    )}`}
                  >
                    {ticket.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                  {ticket.description}
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>Effort: {ticket.effortEstimateWeeks} weeks</span>
                  {ticket.storyPoints && <span>• {ticket.storyPoints} SP</span>}
                  {ticket.labels && ticket.labels.length > 0 && (
                    <span>• {ticket.labels.join(', ')}</span>
                  )}
                  {ticket.confidenceScore !== undefined && (
                    <span>• {ticket.confidenceScore}% confidence</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {selectedTickets.size} of {suggestedTickets.length} tickets selected
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            disabled={isApplying}
          >
            Dismiss
          </button>
          <button
            onClick={handleApply}
            disabled={selectedTickets.size === 0 || isApplying}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isApplying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Apply Selected ({selectedTickets.size})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

