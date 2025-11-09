import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

if (!GEMINI_API_KEY) {
  throw new Error('Please define the GEMINI_API_KEY environment variable inside .env.local')
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

export async function generateRoadmap(projectName: string, projectDescription: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

  const prompt = `Given this project description, return a JSON object with the following structure:
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

Project Name: ${projectName}
Project Description: ${projectDescription}

Return ONLY valid JSON, no markdown formatting, no code blocks.`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // Clean up the response (remove markdown code blocks if present)
    let cleanedText = text.trim()
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/g, '')
    }
    
    const roadmap = JSON.parse(cleanedText)
    return roadmap
  } catch (error) {
    console.error('Error generating roadmap:', error)
    throw new Error('Failed to generate roadmap')
  }
}

export async function analyzeProposal(proposalContent: string, originalRoadmap: any) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

  const prompt = `Summarize this engineer proposal and explain its impact on the timeline.

Original Roadmap Summary: ${JSON.stringify(originalRoadmap.summary)}

Engineer Proposal: ${proposalContent}

Return a JSON object with:
{
  "summary": "Brief summary of the proposal",
  "timelineImpact": "Description of timeline impact",
  "recommendedAdjustments": "Recommended roadmap adjustments"
}

Return ONLY valid JSON, no markdown formatting, no code blocks.`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    let cleanedText = text.trim()
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/g, '')
    }
    
    const analysis = JSON.parse(cleanedText)
    return analysis
  } catch (error) {
    console.error('Error analyzing proposal:', error)
    throw new Error('Failed to analyze proposal')
  }
}

export async function compareRoadmaps(originalRoadmap: any, proposedRoadmap: any) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

  const prompt = `Compare the original roadmap vs the proposal. Return only the changed features.

Original Roadmap: ${JSON.stringify(originalRoadmap, null, 2)}
Proposed Roadmap: ${JSON.stringify(proposedRoadmap, null, 2)}

Return a JSON array of changed features with the same structure as the original features array. Only include features that have changed.

Return ONLY valid JSON, no markdown formatting, no code blocks.`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    let cleanedText = text.trim()
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```\n?/g, '')
    }
    
    const changes = JSON.parse(cleanedText)
    return changes
  } catch (error) {
    console.error('Error comparing roadmaps:', error)
    throw new Error('Failed to compare roadmaps')
  }
}

