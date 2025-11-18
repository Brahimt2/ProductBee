/**
 * Feedback analysis prompts for Gemini API
 */

export interface ProposalAnalysisInput {
  proposalContent: string
  originalRoadmap: {
    summary: string
    riskLevel?: string
  }
}

/**
 * Generate prompt for proposal analysis
 */
export function getProposalAnalysisPrompt(input: ProposalAnalysisInput): string {
  return `Summarize this engineer proposal and explain its impact on the timeline.

Original Roadmap Summary: ${JSON.stringify(input.originalRoadmap.summary)}

Engineer Proposal: ${input.proposalContent}

Return a JSON object with:
{
  "summary": "Brief summary of the proposal",
  "timelineImpact": "Description of timeline impact",
  "recommendedAdjustments": "Recommended roadmap adjustments"
}

Return ONLY valid JSON, no markdown formatting, no code blocks.`
}

/**
 * Parse and validate proposal analysis response from Gemini
 */
export function parseProposalAnalysisResponse(response: string): any {
  // Clean up the response (remove markdown code blocks if present)
  let cleanedText = response.trim()
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/```\n?/g, '')
  }
  
  try {
    const analysis = JSON.parse(cleanedText)
    return analysis
  } catch (error) {
    throw new Error('Failed to parse proposal analysis response from AI')
  }
}

