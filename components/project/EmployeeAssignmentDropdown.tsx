'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Search, User, Briefcase, Calendar, Check, Sparkles, Loader2 } from 'lucide-react'
import { useTeamMembers } from '@/hooks/useTeamMembers'
import { ROLES, SPECIALIZATIONS } from '@/lib/constants'
import type { TeamMemberResponse } from '@/types/api'

interface EmployeeAssignmentDropdownProps {
  value: string | null
  onChange: (userId: string | null) => void
  disabled?: boolean
  projectId?: string
  featureId?: string
  taskTitle?: string
  taskDescription?: string
  taskLabels?: string[]
  taskType?: 'feature' | 'bug' | 'epic' | 'story'
  userRole?: string
  showAISuggestion?: boolean
  onAISuggestion?: (userId: string) => void
}

/**
 * EmployeeAssignmentDropdown - Enhanced assignment dropdown with workload, specialization, and AI suggestions
 * Phase 8: Enhanced Team Workload & Assignment List
 * Phase 9: AI Smart Assignment Suggestions
 */
export default function EmployeeAssignmentDropdown({
  value,
  onChange,
  disabled = false,
  projectId,
  featureId,
  taskTitle,
  taskDescription,
  taskLabels,
  taskType,
  userRole,
  showAISuggestion = false,
  onAISuggestion,
}: EmployeeAssignmentDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAISuggestions, setShowAISuggestions] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<{
    requiredSpecialization: string | null
    recommendations: Array<{
      engineerId: string
      engineerName: string
      reasoning: string
      confidenceScore: number
      matchFactors: {
        specializationMatch: boolean
        workloadSuitable: boolean
        pastExperience: boolean
      }
    }>
  } | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const autosuggestTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { members, loading: membersLoading } = useTeamMembers()

  // Filter assignable members (Engineers, PMs, Admins)
  const assignableMembers = useMemo(() => {
    return members.filter(
      (member) =>
        member.role === ROLES.ENGINEER ||
        member.role === ROLES.PM ||
        member.role === ROLES.ADMIN
    )
  }, [members])

  // Group members by specialization
  const membersBySpecialization = useMemo(() => {
    const grouped: Record<string, TeamMemberResponse[]> = {
      All: assignableMembers,
    }

    assignableMembers.forEach((member) => {
      const spec = member.specialization || 'General'
      if (!grouped[spec]) {
        grouped[spec] = []
      }
      grouped[spec].push(member)
    })

    return grouped
  }, [assignableMembers])

  // Filter members based on search query
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) {
      return assignableMembers
    }

    const query = searchQuery.toLowerCase()
    return assignableMembers.filter(
      (member) =>
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member.specialization?.toLowerCase().includes(query) ||
        member.role.toLowerCase().includes(query)
    )
  }, [assignableMembers, searchQuery])

  // Get selected member
  const selectedMember = useMemo(() => {
    if (!value) return null
    return assignableMembers.find((m) => m.id === value) || null
  }, [value, assignableMembers])

  // Fetch AI suggestions
  const fetchAISuggestions = useCallback(async () => {
    if (!taskDescription || !taskTitle) {
      return
    }

    setLoadingSuggestions(true)
    setShowAISuggestions(true)

    try {
      const requestBody: any = {
        taskTitle,
        taskDescription,
      }

      if (taskLabels && taskLabels.length > 0) {
        requestBody.taskLabels = taskLabels
      }

      if (taskType) {
        requestBody.taskType = taskType
      }

      if (projectId) {
        requestBody.projectId = projectId
      }

      if (featureId) {
        requestBody.featureId = featureId
      }

      const response = await fetch('/api/feature/suggest-assignee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const responseData = await response.json()

      if (responseData.success && responseData.data) {
        setSuggestions(responseData.data.suggestion)
      } else {
        console.error('Failed to fetch AI suggestions:', responseData.error)
      }
    } catch (error) {
      console.error('Error fetching AI suggestions:', error)
    } finally {
      setLoadingSuggestions(false)
    }
  }, [taskDescription, taskTitle, taskLabels, taskType, projectId, featureId])

  // Autosuggest when description changes (debounced)
  useEffect(() => {
    // Clear existing timeout
    if (autosuggestTimeoutRef.current) {
      clearTimeout(autosuggestTimeoutRef.current)
    }

    // Only autosuggest if:
    // - Dropdown is open
    // - User has PM/Admin role
    // - Task description and title are available
    // - Description is at least 20 characters (to avoid too many requests)
    if (
      isOpen &&
      showAISuggestion &&
      (userRole === ROLES.PM || userRole === ROLES.ADMIN) &&
      taskDescription &&
      taskTitle &&
      taskDescription.length >= 20 &&
      !value // Only autosuggest if no one is assigned yet
    ) {
      autosuggestTimeoutRef.current = setTimeout(() => {
        fetchAISuggestions()
      }, 1500) // 1.5 second debounce
    }

    return () => {
      if (autosuggestTimeoutRef.current) {
        clearTimeout(autosuggestTimeoutRef.current)
      }
    }
  }, [isOpen, taskDescription, taskTitle, taskLabels, taskType, projectId, featureId, value, userRole, showAISuggestion, fetchAISuggestions])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowAISuggestions(false)
        setSearchQuery('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Helper function to get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case ROLES.ADMIN:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      case ROLES.PM:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case ROLES.ENGINEER:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  // Helper function to get specialization badge color
  const getSpecializationBadgeColor = (specialization: string | null | undefined) => {
    if (!specialization) return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'

    switch (specialization) {
      case SPECIALIZATIONS.BACKEND:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
      case SPECIALIZATIONS.FRONTEND:
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300'
      case SPECIALIZATIONS.QA:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case SPECIALIZATIONS.DEVOPS:
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  // Helper function to get workload color
  const getWorkloadColor = (ticketCount: number, storyPointCount: number) => {
    if (ticketCount === 0 && storyPointCount === 0) {
      return 'text-green-600 dark:text-green-400'
    }
    if (ticketCount <= 2 && storyPointCount <= 8) {
      return 'text-blue-600 dark:text-blue-400'
    }
    if (ticketCount <= 5 && storyPointCount <= 13) {
      return 'text-yellow-600 dark:text-yellow-400'
    }
    return 'text-red-600 dark:text-red-400'
  }

  const handleSelect = (userId: string) => {
    onChange(userId)
    setIsOpen(false)
    setShowAISuggestions(false)
    setSearchQuery('')
    if (onAISuggestion && userId) {
      onAISuggestion(userId)
    }
  }

  const handleClear = () => {
    onChange(null)
    setIsOpen(false)
    setShowAISuggestions(false)
    setSearchQuery('')
  }

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || membersLoading}
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed text-left flex items-center justify-between"
      >
        <span className="flex items-center gap-2">
          {selectedMember ? (
            <>
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-gray-900 dark:text-white">{selectedMember.name}</span>
              {selectedMember.specialization && (
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${getSpecializationBadgeColor(
                    selectedMember.specialization
                  )}`}
                >
                  {selectedMember.specialization}
                </span>
              )}
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">Unassigned</span>
          )}
        </span>
        {selectedMember && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleClear()
            }}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ×
          </button>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-hidden flex flex-col">
          {/* AI Suggestion Button */}
          {showAISuggestion &&
            (userRole === ROLES.PM || userRole === ROLES.ADMIN) &&
            taskTitle &&
            taskDescription && (
              <div className="border-b border-gray-200 dark:border-gray-700 p-2">
                <button
                  type="button"
                  onClick={fetchAISuggestions}
                  disabled={loadingSuggestions}
                  className="w-full px-3 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                >
                  {loadingSuggestions ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Getting AI Suggestions...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Get AI Suggestion</span>
                    </>
                  )}
                </button>
              </div>
            )}

          {/* AI Suggestions Display */}
          {showAISuggestions && suggestions && suggestions.recommendations.length > 0 && (
            <div className="border-b border-gray-200 dark:border-gray-700 p-3 bg-purple-50 dark:bg-purple-900/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-semibold text-purple-900 dark:text-purple-200">
                  AI Recommendations
                </span>
                {suggestions.requiredSpecialization && (
                  <span className="text-xs text-purple-700 dark:text-purple-300">
                    ({suggestions.requiredSpecialization} preferred)
                  </span>
                )}
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {suggestions.recommendations.slice(0, 3).map((rec, index) => {
                  const member = assignableMembers.find((m) => m.id === rec.engineerId)
                  if (!member) return null

                  return (
                    <div
                      key={rec.engineerId}
                      className="p-2 bg-white dark:bg-gray-800 rounded border border-purple-200 dark:border-purple-800 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors"
                      onClick={() => handleSelect(rec.engineerId)}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                            #{index + 1}
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {rec.engineerName}
                          </span>
                          <span className="text-xs text-purple-600 dark:text-purple-400">
                            {rec.confidenceScore}% confidence
                          </span>
                        </div>
                        {value === rec.engineerId && (
                          <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {rec.reasoning}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span
                          className={
                            rec.matchFactors.specializationMatch
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-400'
                          }
                        >
                          ✓ Specialization Match
                        </span>
                        <span
                          className={
                            rec.matchFactors.workloadSuitable
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-400'
                          }
                        >
                          ✓ Workload Suitable
                        </span>
                        <span
                          className={
                            rec.matchFactors.pastExperience
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-gray-400'
                          }
                        >
                          ✓ Past Experience
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <button
                type="button"
                onClick={() => setShowAISuggestions(false)}
                className="mt-2 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200"
              >
                Hide suggestions
              </button>
            </div>
          )}

          {/* Search Bar */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, specialization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>
          </div>

          {/* Members List */}
          <div className="flex-1 overflow-y-auto max-h-64">
            {filteredMembers.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                No team members found
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                      value === member.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                    onClick={() => handleSelect(member.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {member.name}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full ${getRoleBadgeColor(
                              member.role
                            )}`}
                          >
                            {member.role.toUpperCase()}
                          </span>
                          {member.specialization && (
                            <span
                              className={`px-2 py-0.5 text-xs rounded-full ${getSpecializationBadgeColor(
                                member.specialization
                              )}`}
                            >
                              {member.specialization}
                            </span>
                          )}
                          {member.isOnVacation && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Vacation
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          {member.email}
                        </p>
                        <div className="flex items-center gap-4 text-xs">
                          <div
                            className={`flex items-center gap-1 ${getWorkloadColor(
                              member.currentTicketCount,
                              member.currentStoryPointCount
                            )}`}
                          >
                            <Briefcase className="w-3 h-3" />
                            <span>
                              {member.currentTicketCount} tickets, {member.currentStoryPointCount}{' '}
                              pts
                            </span>
                          </div>
                        </div>
                      </div>
                      {value === member.id && (
                        <Check className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

