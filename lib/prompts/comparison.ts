/**
 * Roadmap comparison prompts for Gemini API
 */

export interface RoadmapComparisonInput {
  originalRoadmap: any
  proposedRoadmap: any
}

/**
 * Generate prompt for roadmap comparison
 */
export function getRoadmapComparisonPrompt(input: RoadmapComparisonInput): string {
  return `Compare the original roadmap vs the proposal. Return only the changed features.

Original Roadmap: ${JSON.stringify(input.originalRoadmap, null, 2)}
Proposed Roadmap: ${JSON.stringify(input.proposedRoadmap, null, 2)}

Return a JSON array of changed features with the same structure as the original features array. Only include features that have changed.

Return ONLY valid JSON, no markdown formatting, no code blocks.`
}

/**
 * Parse and validate roadmap comparison response from Gemini
 */
export function parseRoadmapComparisonResponse(response: string): any {
  // Clean up the response (remove markdown code blocks if present)
  let cleanedText = response.trim()
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/```\n?/g, '')
  }
  
  try {
    const changes = JSON.parse(cleanedText)
    return changes
  } catch (error) {
    throw new Error('Failed to parse roadmap comparison response from AI')
  }
}

