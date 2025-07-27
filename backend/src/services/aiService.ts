import { logger } from '../utils/logger.js'

export interface AIProvider {
  name: string
  generateContent(prompt: string, options?: AIGenerationOptions): Promise<string>
  generateSuggestion(request: AISuggestionRequest): Promise<AISuggestion[]>
}

export interface AIGenerationOptions {
  type?: 'content' | 'section' | 'improvement' | 'analysis'
  context?: string
  maxTokens?: number
  temperature?: number
}

export interface AISuggestionRequest {
  command: string
  description: string
  prdContent: string
  context: string
  selection: string
  prdTitle: string
}

export interface AISuggestion {
  type: string
  title: string
  content: string
  confidence: number
}

// Mock AI Provider for development (replace with real providers)
class MockAIProvider implements AIProvider {
  name = 'Mock AI Provider'

  async generateContent(prompt: string, options?: AIGenerationOptions): Promise<string> {
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

    const type = options?.type || 'content'
    const context = options?.context || ''

    switch (type) {
      case 'content':
        return `# Generated Content

Based on your prompt: "${prompt}"

This is AI-generated content that addresses your requirements. The content includes relevant details, proper structure, and actionable information.

## Key Points
- Comprehensive coverage of the topic
- Practical implementation guidance
- Clear action items and next steps

${context ? `\n## Context Integration\nThis content builds upon: ${context}` : ''}`

      case 'section':
        return `## New Section

### Overview
${prompt}

### Implementation Details
- Step-by-step approach
- Required resources
- Timeline considerations

### Success Criteria
- Measurable outcomes
- Quality standards
- Acceptance criteria`

      case 'improvement':
        return `## Suggested Improvements

Based on "${prompt}":

### Priority 1 - High Impact
- Critical improvements for immediate implementation
- Significant impact on user experience
- Quick wins with measurable results

### Priority 2 - Medium Impact
- Enhancements for better functionality
- Improved system reliability
- User interface optimizations

### Priority 3 - Low Impact
- Nice-to-have features
- Long-term considerations
- Future enhancement opportunities`

      case 'analysis':
        return `## Analysis Report

### Executive Summary
Analysis of "${prompt}" reveals several key insights and recommendations for improvement.

### Findings
- Current state assessment
- Gap analysis results
- Opportunity identification

### Recommendations
1. Immediate actions required
2. Short-term improvements
3. Long-term strategic initiatives

### Risk Assessment
- Potential challenges
- Mitigation strategies
- Success probability`

      default:
        return `Generated content for: ${prompt}

This is a comprehensive response that addresses your specific needs while maintaining quality and relevance.`
    }
  }

  async generateSuggestion(request: AISuggestionRequest): Promise<AISuggestion[]> {
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

    const { command, description, selection, prdTitle } = request
    const suggestions: AISuggestion[] = []

    switch (command) {
      case 'update':
        suggestions.push({
          type: 'replacement',
          title: 'Updated Content',
          content: `${selection}

**AI Enhancement:**
- Improved clarity and structure
- Added technical considerations
- Enhanced readability

${description ? `Specifically addressing: ${description}` : ''}`,
          confidence: 0.85
        })
        break

      case 'expand':
        suggestions.push({
          type: 'addition',
          title: 'Expanded Section',
          content: `## Additional Details

${selection}

### Implementation Considerations
- Technical requirements and constraints
- Timeline and resource allocation
- Risk mitigation strategies

### Success Metrics
- Key performance indicators
- Measurement criteria
- Acceptance criteria`,
          confidence: 0.78
        })
        break

      case 'summarize':
        suggestions.push({
          type: 'summary',
          title: 'Summary',
          content: `**Key Points:**
- Main objective: ${prdTitle}
- Core functionality defined
- Technical approach outlined
- Success criteria established

**Next Steps:**
- Implementation planning
- Resource allocation
- Timeline definition`,
          confidence: 0.92
        })
        break

      case 'rewrite':
        suggestions.push({
          type: 'replacement',
          title: 'Rewritten Content',
          content: `# ${prdTitle} - Executive Summary

**Strategic Value:** This initiative delivers significant business value through improved user experience and operational efficiency.

**Implementation Approach:** Our technical strategy leverages proven methodologies to ensure reliable delivery within established timelines.

**Expected Outcomes:** Measurable improvements in key performance indicators with reduced operational overhead.`,
          confidence: 0.81
        })
        break

      case 'suggest':
        suggestions.push({
          type: 'suggestions',
          title: 'Improvement Suggestions',
          content: `## Recommendations

### Content Structure
- Add user personas section
- Include competitive analysis
- Define clear acceptance criteria

### Technical Considerations
- Specify technology stack
- Define scalability requirements
- Include security considerations

### Project Management
- Add milestone definitions
- Define risk mitigation strategies
- Include resource requirements`,
          confidence: 0.88
        })
        break

      case 'analyze':
        suggestions.push({
          type: 'analysis',
          title: 'Content Analysis',
          content: `## Analysis Results

### Strengths
- Clear problem definition
- Well-structured requirements
- Appropriate level of detail

### Areas for Improvement
- Add quantitative success metrics
- Include edge case considerations
- Define error handling scenarios

### Completeness Score: 75%
**Missing Elements:**
- User acceptance criteria
- Performance requirements
- Integration specifications`,
          confidence: 0.91
        })
        break

      default:
        suggestions.push({
          type: 'general',
          title: 'AI Assistant',
          content: `I can help you with various tasks:

- @update - Improve selected content
- @expand - Add more details
- @summarize - Create summaries
- @rewrite - Change style/tone
- @suggest - Get recommendations
- @analyze - Analyze content

Try selecting some text and using one of these commands!`,
          confidence: 0.95
        })
    }

    return suggestions
  }
}

// OpenAI Provider (placeholder for future implementation)
class OpenAIProvider implements AIProvider {
  name = 'OpenAI GPT'
  
  constructor(private apiKey: string) {}

  async generateContent(prompt: string, options?: AIGenerationOptions): Promise<string> {
    // TODO: Implement OpenAI API integration
    throw new Error('OpenAI integration not yet implemented')
  }

  async generateSuggestion(request: AISuggestionRequest): Promise<AISuggestion[]> {
    // TODO: Implement OpenAI API integration
    throw new Error('OpenAI integration not yet implemented')
  }
}

// Anthropic Provider
class AnthropicProvider implements AIProvider {
  name = 'Anthropic Claude'
  
  constructor(private apiKey: string) {}

  async generateContent(prompt: string, options?: AIGenerationOptions): Promise<string> {
    const type = options?.type || 'content'
    const context = options?.context || ''
    
    const systemPrompt = this.getSystemPrompt(type)
    const userPrompt = this.formatUserPrompt(prompt, type, context)

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2000,
          temperature: 0.7,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: userPrompt
            }
          ]
        })
      })

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.content[0].text || 'No content generated'
    } catch (error) {
      console.error('Anthropic API error:', error)
      throw error
    }
  }

  async generateSuggestion(request: AISuggestionRequest): Promise<AISuggestion[]> {
    const { command, description, prdContent, context, selection, prdTitle } = request
    
    const systemPrompt = `You are an expert product manager and technical writer. Your role is to help improve Product Requirements Documents (PRDs) by providing specific, actionable suggestions.

When given a command and content, provide exactly one suggestion in the following JSON format:
{
  "type": "replacement|addition|summary|suggestions|analysis|general",
  "title": "Brief descriptive title",
  "content": "The actual content/suggestion in markdown format",
  "confidence": 0.85
}

Guidelines:
- For @update: Improve clarity, add technical details, enhance structure
- For @expand: Add implementation details, examples, technical considerations
- For @summarize: Create concise summaries with key points
- For @rewrite: Change tone, style, or target audience
- For @suggest: Provide actionable recommendations for improvement
- For @analyze: Identify strengths, weaknesses, and missing elements

Always provide practical, specific suggestions that improve the PRD quality.`

    const userPrompt = `Command: @${command} ${description || ''}
PRD Title: ${prdTitle}
Selected Text: ${selection || 'No text selected'}
Context: ${context || 'No additional context'}

Please provide a suggestion for improving this content.`

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1500,
          temperature: 0.7,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: userPrompt
            }
          ]
        })
      })

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const content = data.content[0].text

      // Try to parse as JSON first
      try {
        const suggestion = JSON.parse(content)
        return [suggestion]
      } catch {
        // If not JSON, create a structured response
        return [{
          type: this.getTypeFromCommand(command),
          title: `${command.charAt(0).toUpperCase() + command.slice(1)} Suggestion`,
          content: content,
          confidence: 0.85
        }]
      }
    } catch (error) {
      console.error('Anthropic API error:', error)
      throw error
    }
  }

  private getSystemPrompt(type: string): string {
    switch (type) {
      case 'content':
        return 'You are an expert product manager helping to create comprehensive PRD content. Provide detailed, structured content that follows PRD best practices.'
      case 'section':
        return 'You are an expert at creating specific PRD sections. Provide well-structured sections with clear headings, implementation details, and success criteria.'
      case 'improvement':
        return 'You are a product management consultant specializing in PRD improvements. Provide prioritized recommendations with clear impact assessments.'
      case 'analysis':
        return 'You are a senior product manager conducting PRD reviews. Provide thorough analysis with strengths, weaknesses, and actionable recommendations.'
      default:
        return 'You are an expert product manager helping to improve Product Requirements Documents. Provide clear, actionable, and well-structured content.'
    }
  }

  private formatUserPrompt(prompt: string, type: string, context: string): string {
    let formattedPrompt = `Please help me with the following request: ${prompt}`
    
    if (context) {
      formattedPrompt += `\n\nContext: ${context}`
    }

    switch (type) {
      case 'content':
        formattedPrompt += '\n\nPlease provide comprehensive content that includes relevant details, proper structure, and actionable information.'
        break
      case 'section':
        formattedPrompt += '\n\nPlease create a well-structured section with overview, implementation details, and success criteria.'
        break
      case 'improvement':
        formattedPrompt += '\n\nPlease provide prioritized improvement suggestions with clear impact assessments.'
        break
      case 'analysis':
        formattedPrompt += '\n\nPlease provide a thorough analysis with findings, recommendations, and risk assessment.'
        break
    }

    return formattedPrompt
  }

  private getTypeFromCommand(command: string): AISuggestion['type'] {
    switch (command) {
      case 'update':
      case 'rewrite':
        return 'replacement'
      case 'expand':
        return 'addition'
      case 'summarize':
        return 'summary'
      case 'suggest':
        return 'suggestions'
      case 'analyze':
        return 'analysis'
      default:
        return 'general'
    }
  }
}

export class AIService {
  private providers: Map<string, AIProvider> = new Map()
  private defaultProvider: string = 'mock'

  constructor() {
    // Initialize providers
    this.providers.set('mock', new MockAIProvider())
    
    // Add real providers if API keys are available
    const openaiKey = process.env.OPENAI_API_KEY
    if (openaiKey) {
      this.providers.set('openai', new OpenAIProvider(openaiKey))
      this.defaultProvider = 'openai'
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (anthropicKey) {
      this.providers.set('anthropic', new AnthropicProvider(anthropicKey))
      this.defaultProvider = 'anthropic'
    }

    logger.info(`AI Service initialized with provider: ${this.defaultProvider}`)
  }

  async generateContent(
    prompt: string, 
    options?: AIGenerationOptions & { provider?: string }
  ): Promise<string> {
    const providerName = options?.provider || this.defaultProvider
    const provider = this.providers.get(providerName)
    
    if (!provider) {
      throw new Error(`AI provider '${providerName}' not available`)
    }

    try {
      logger.info('Generating AI content', { 
        provider: providerName, 
        type: options?.type,
        promptLength: prompt.length 
      })
      
      const content = await provider.generateContent(prompt, options)
      
      logger.info('AI content generated successfully', { 
        provider: providerName,
        contentLength: content.length 
      })
      
      return content
    } catch (error) {
      logger.error('Failed to generate AI content', { 
        provider: providerName, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      throw error
    }
  }

  async generateSuggestion(
    request: AISuggestionRequest,
    provider?: string
  ): Promise<AISuggestion[]> {
    const providerName = provider || this.defaultProvider
    const aiProvider = this.providers.get(providerName)
    
    if (!aiProvider) {
      throw new Error(`AI provider '${providerName}' not available`)
    }

    try {
      logger.info('Generating AI suggestions', { 
        provider: providerName, 
        command: request.command,
        hasSelection: !!request.selection 
      })
      
      const suggestions = await aiProvider.generateSuggestion(request)
      
      logger.info('AI suggestions generated successfully', { 
        provider: providerName,
        suggestionCount: suggestions.length 
      })
      
      return suggestions
    } catch (error) {
      logger.error('Failed to generate AI suggestions', { 
        provider: providerName, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      throw error
    }
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys())
  }

  getCurrentProvider(): string {
    return this.defaultProvider
  }
}

// Singleton instance
export const aiService = new AIService()