/**
 * Roadmap generation prompts for Gemini API
 */

export interface RoadmapGenerationInput {
  projectName: string
  projectDescription: string
}

/**
 * Generate prompt for roadmap generation
 */
export function getRoadmapPrompt(input: RoadmapGenerationInput): string {
  return `Given this project description, return a JSON object with the following structure:
{
  "summary": "A brief summary of the project roadmap",
  "riskLevel": "low" | "medium" | "high",
  "features": [
    {
      "title": "Feature title",
      "description": "Feature description",
      "priority": "P0" | "P1" | "P2",
      "effortEstimateWeeks": number,
      "dependsOn": [] // array of feature indices (0-based) this feature depends on
    }
  ]
}

Project Name: ${input.projectName}
Project Description: ${input.projectDescription}

Return ONLY valid JSON, no markdown formatting, no code blocks.`
}

/**
 * Parse and validate roadmap response from Gemini
 */
export function parseRoadmapResponse(response: string): any {
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
    const roadmap = JSON.parse(cleanedText)
    
    // Validate the roadmap structure
    if (!roadmap || typeof roadmap !== 'object') {
      throw new Error('Invalid roadmap structure: not an object')
    }
    
    if (!roadmap.summary || typeof roadmap.summary !== 'string') {
      throw new Error('Invalid roadmap structure: missing or invalid summary')
    }
    
    if (!Array.isArray(roadmap.features)) {
      throw new Error('Invalid roadmap structure: features is not an array')
    }
    
    // Validate each feature
    roadmap.features.forEach((feature: any, index: number) => {
      if (!feature.title || typeof feature.title !== 'string') {
        throw new Error(`Invalid feature at index ${index}: missing or invalid title`)
      }
      if (!feature.description || typeof feature.description !== 'string') {
        throw new Error(`Invalid feature at index ${index}: missing or invalid description`)
      }
      if (!feature.priority || !['P0', 'P1', 'P2'].includes(feature.priority)) {
        throw new Error(`Invalid feature at index ${index}: missing or invalid priority`)
      }
      if (typeof feature.effortEstimateWeeks !== 'number') {
        throw new Error(`Invalid feature at index ${index}: missing or invalid effortEstimateWeeks`)
      }
    })
    
    return roadmap
  } catch (error: any) {
    console.error('[Parse Roadmap] Error parsing response:', error)
    console.error('[Parse Roadmap] Response text:', cleanedText.substring(0, 500))
    throw new Error(`Failed to parse roadmap response from AI: ${error.message}`)
  }
}

