import { logger } from '../utils/logger.js'
import { prisma } from '../db/client.js'
import { env } from '../config/env.js'

export interface AIProvider {
  name: string
  generateContent(prompt: string, options?: AIGenerationOptions): Promise<AIResponse>
  generateSuggestion(request: AISuggestionRequest): Promise<AISuggestionResponse>
}

export interface AIResponse {
  content: string
  usage: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  model: string
  costCents: number
}

export interface AISuggestionResponse {
  suggestions: AISuggestion[]
  usage: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  model: string
  costCents: number
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

  async generateContent(prompt: string, options?: AIGenerationOptions): Promise<AIResponse> {
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

    const type = options?.type || 'content'
    const context = options?.context || ''
    let content: string

    switch (type) {
      case 'content':
        content = `# Generated Content

Based on your prompt: "${prompt}"

This is AI-generated content that addresses your requirements. The content includes relevant details, proper structure, and actionable information.

## Key Points
- Comprehensive coverage of the topic
- Practical implementation guidance
- Clear action items and next steps

${context ? `\n## Context Integration\nThis content builds upon: ${context}` : ''}`
        break

      case 'section':
        content = `## New Section

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
        break

      case 'improvement':
        content = `## Suggested Improvements

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
        break

      case 'analysis':
        content = `## Analysis Report

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
        break

      default:
        content = `Generated content for: ${prompt}

This is a comprehensive response that addresses your specific needs while maintaining quality and relevance.`
    }

    // Mock usage data
    const inputTokens = Math.floor(prompt.length / 4)
    const outputTokens = Math.floor(content.length / 4)
    
    return {
      content,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens
      },
      model: 'mock-ai-1.0',
      costCents: 0 // Free for mock
    }
  }

  async generateSuggestion(request: AISuggestionRequest): Promise<AISuggestionResponse> {
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

    // Mock usage data
    const totalContent = JSON.stringify(request)
    const suggestionContent = suggestions.map(s => s.content).join(' ')
    const inputTokens = Math.floor(totalContent.length / 4)
    const outputTokens = Math.floor(suggestionContent.length / 4)

    return {
      suggestions,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens
      },
      model: 'mock-ai-1.0',
      costCents: 0 // Free for mock
    }
  }
}

// OpenAI Provider
class OpenAIProvider implements AIProvider {
  name = 'OpenAI GPT'
  private readonly model = 'gpt-4-turbo-preview'
  
  constructor(private apiKey: string) {}

  async generateContent(prompt: string, options?: AIGenerationOptions): Promise<AIResponse> {
    const type = options?.type || 'content'
    const context = options?.context || ''
    
    const systemPrompt = this.getSystemPrompt(type)
    const userPrompt = this.formatUserPrompt(prompt, type, context)

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: options?.maxTokens || 2000,
          temperature: options?.temperature || 0.7
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content || 'No content generated'
      const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }

      // Calculate cost (GPT-4 Turbo pricing as of 2024)
      const inputCostPer1K = 0.01 // $0.01 per 1K input tokens
      const outputCostPer1K = 0.03 // $0.03 per 1K output tokens
      const costCents = Math.round(
        (usage.prompt_tokens / 1000 * inputCostPer1K + 
         usage.completion_tokens / 1000 * outputCostPer1K) * 100
      )

      return {
        content,
        usage: {
          inputTokens: usage.prompt_tokens,
          outputTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens
        },
        model: this.model,
        costCents
      }
    } catch (error) {
      logger.error('OpenAI API error:', error)
      throw error
    }
  }

  async generateSuggestion(request: AISuggestionRequest): Promise<AISuggestionResponse> {
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
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 1500,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content || 'No content generated'
      const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }

      // Calculate cost
      const inputCostPer1K = 0.01
      const outputCostPer1K = 0.03
      const costCents = Math.round(
        (usage.prompt_tokens / 1000 * inputCostPer1K + 
         usage.completion_tokens / 1000 * outputCostPer1K) * 100
      )

      // Try to parse as JSON first
      let suggestions: AISuggestion[]
      try {
        const suggestion = JSON.parse(content)
        suggestions = [suggestion]
      } catch {
        // If not JSON, create a structured response
        suggestions = [{
          type: this.getTypeFromCommand(command),
          title: `${command.charAt(0).toUpperCase() + command.slice(1)} Suggestion`,
          content: content,
          confidence: 0.85
        }]
      }

      return {
        suggestions,
        usage: {
          inputTokens: usage.prompt_tokens,
          outputTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens
        },
        model: this.model,
        costCents
      }
    } catch (error) {
      logger.error('OpenAI API error:', error)
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

// Anthropic Provider
class AnthropicProvider implements AIProvider {
  name = 'Anthropic Claude'
  
  constructor(private apiKey: string) {}

  async generateContent(prompt: string, options?: AIGenerationOptions): Promise<AIResponse> {
    const type = options?.type || 'content'
    const context = options?.context || ''
    const model = 'claude-3-5-sonnet-20241022'
    
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
          model,
          max_tokens: options?.maxTokens || 2000,
          temperature: options?.temperature || 0.7,
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
        const errorData = await response.json()
        throw new Error(`Anthropic API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      const content = data.content[0]?.text || 'No content generated'
      const usage = data.usage || { input_tokens: 0, output_tokens: 0 }

      // Calculate cost (Claude 3.5 Sonnet pricing as of 2024)
      const inputCostPer1K = 0.003 // $0.003 per 1K input tokens
      const outputCostPer1K = 0.015 // $0.015 per 1K output tokens
      const costCents = Math.round(
        (usage.input_tokens / 1000 * inputCostPer1K + 
         usage.output_tokens / 1000 * outputCostPer1K) * 100
      )

      return {
        content,
        usage: {
          inputTokens: usage.input_tokens,
          outputTokens: usage.output_tokens,
          totalTokens: usage.input_tokens + usage.output_tokens
        },
        model,
        costCents
      }
    } catch (error) {
      logger.error('Anthropic API error:', error)
      throw error
    }
  }

  async generateSuggestion(request: AISuggestionRequest): Promise<AISuggestionResponse> {
    const { command, description, prdContent, context, selection, prdTitle } = request
    const model = 'claude-3-5-sonnet-20241022'
    
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
          model,
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
        const errorBody = await response.text()
        logger.error('Anthropic API error details:', {
          status: response.status,
          statusText: response.statusText,
          body: errorBody
        })
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText} - ${errorBody}`)
      }

      const data = await response.json()
      const content = data.content[0]?.text || 'No content generated'
      const usage = data.usage || { input_tokens: 0, output_tokens: 0 }

      // Calculate cost
      const inputCostPer1K = 0.003
      const outputCostPer1K = 0.015
      const costCents = Math.round(
        (usage.input_tokens / 1000 * inputCostPer1K + 
         usage.output_tokens / 1000 * outputCostPer1K) * 100
      )

      // Try to parse as JSON first
      let suggestions: AISuggestion[]
      try {
        const suggestion = JSON.parse(content)
        suggestions = [suggestion]
      } catch {
        // If not JSON, create a structured response
        suggestions = [{
          type: this.getTypeFromCommand(command),
          title: `${command.charAt(0).toUpperCase() + command.slice(1)} Suggestion`,
          content: content,
          confidence: 0.85
        }]
      }

      return {
        suggestions,
        usage: {
          inputTokens: usage.input_tokens,
          outputTokens: usage.output_tokens,
          totalTokens: usage.input_tokens + usage.output_tokens
        },
        model,
        costCents
      }
    } catch (error) {
      logger.error('Anthropic API error:', error)
      
      // If API credits are low, provide helpful error message
      if (error instanceof Error && error.message.includes('credit balance is too low')) {
        logger.warn('Anthropic API credits exhausted')
        throw new Error('AI service temporarily unavailable: API credit balance is too low. Please add credits to your Anthropic account.')
      }
      
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
    options?: AIGenerationOptions & { provider?: string; userId?: string; prdId?: string }
  ): Promise<AIResponse> {
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
      
      const response = await provider.generateContent(prompt, options)
      
      logger.info('AI content generated successfully', { 
        provider: providerName,
        contentLength: response.content.length,
        totalTokens: response.usage.totalTokens,
        costCents: response.costCents
      })
      
      // Track AI usage in database if user/prd context provided
      if (options?.userId) {
        await this.trackAIUsage({
          userId: options.userId,
          prdId: options.prdId || null,
          provider: providerName,
          model: response.model,
          inputTokens: response.usage.inputTokens,
          outputTokens: response.usage.outputTokens,
          totalTokens: response.usage.totalTokens,
          costCents: response.costCents,
          type: 'content_generation',
          prompt: prompt.substring(0, 500), // Store truncated prompt for debugging
          response: response.content.substring(0, 1000) // Store truncated response
        })
      }
      
      return response
    } catch (error) {
      logger.error('Failed to generate AI content', { 
        provider: providerName, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      throw error
    }
  }

  async generateSuggestion(
    request: AISuggestionRequest & { userId?: string; prdId?: string },
    provider?: string
  ): Promise<AISuggestionResponse> {
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
      
      const response = await aiProvider.generateSuggestion(request)
      
      logger.info('AI suggestions generated successfully', { 
        provider: providerName,
        suggestionCount: response.suggestions.length,
        totalTokens: response.usage.totalTokens,
        costCents: response.costCents
      })
      
      // Track AI usage in database if user/prd context provided
      if (request.userId) {
        await this.trackAIUsage({
          userId: request.userId,
          prdId: request.prdId || null,
          provider: providerName,
          model: response.model,
          inputTokens: response.usage.inputTokens,
          outputTokens: response.usage.outputTokens,
          totalTokens: response.usage.totalTokens,
          costCents: response.costCents,
          type: 'suggestion_generation',
          prompt: `@${request.command} ${request.description || ''}`.substring(0, 500),
          response: JSON.stringify(response.suggestions).substring(0, 1000)
        })
      }
      
      return response
    } catch (error) {
      logger.error('Failed to generate AI suggestions', { 
        provider: providerName, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
      
      // Return development mock response when AI services are unavailable
      if (error instanceof Error && (error.message.includes('credit balance') || error.message.includes('API key'))) {
        logger.warn('AI service unavailable, returning development mock response')
        const mockSuggestions = [{
          type: this.getTypeFromCommand(request.command) as AISuggestion['type'],
          title: `${request.command.charAt(0).toUpperCase() + request.command.slice(1)} Suggestion`,
          content: this.generateMockSuggestion(request),
          confidence: 0.7
        }]
        
        return {
          suggestions: mockSuggestions,
          usage: {
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0
          },
          model: 'mock-fallback',
          costCents: 0
        }
      }
      
      throw error
    }
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys())
  }

  getCurrentProvider(): string {
    return this.defaultProvider
  }

  private generateMockSuggestion(request: AISuggestionRequest): string {
    const { command, description, selection } = request
    
    const suggestions = {
      expand: `Here are some ways to expand on "${selection || 'the content'}":

• Add specific technical details and implementation considerations
• Include relevant examples and use cases  
• Provide acceptance criteria and success metrics
• Consider edge cases and error handling scenarios

${description ? `Additional context: ${description}` : ''}`,
      
      update: `Consider these improvements for "${selection || 'the content'}":

• Make the language more precise and technical
• Add specific metrics and KPIs
• Include technical constraints and dependencies  
• Reference industry best practices

${description ? `Focus area: ${description}` : ''}`,
      
      summarize: `Key points summary:

• Main objective: [Core goal of this section]
• Requirements: [Key requirements identified]
• Success criteria: [How success will be measured]
• Next steps: [Action items and dependencies]`,
      
      rewrite: `Alternative version with ${description || 'improved clarity'}:

[This would be a rewritten version focusing on better structure, clarity, and professional tone while maintaining all key information]`,
      
      suggest: `Improvement suggestions:

• Structure: Organize content with clear headers and bullet points
• Specificity: Add concrete examples and measurable outcomes
• Completeness: Ensure all stakeholder needs are addressed
• Clarity: Use precise technical language appropriate for the audience`,
      
      analyze: `Content analysis:

Strengths:
• [Identifies strong aspects of the content]

Areas for improvement:
• [Specific suggestions for enhancement]

Recommendations:
• [Actionable next steps]`
    }
    
    return suggestions[command] || `Mock suggestion for @${command} command. This demonstrates the expected response format when AI services are available.`
  }

  private async trackAIUsage(data: {
    userId: string
    prdId: string | null
    provider: string
    model: string
    inputTokens: number
    outputTokens: number
    totalTokens: number
    costCents: number
    type: string
    prompt: string
    response: string
  }): Promise<void> {
    try {
      await prisma.aIInteraction.create({
        data: {
          userId: data.userId,
          prdId: data.prdId,
          provider: data.provider,
          model: data.model,
          inputTokens: data.inputTokens,
          outputTokens: data.outputTokens,
          totalTokens: data.totalTokens,
          costCents: data.costCents,
          type: data.type,
          prompt: data.prompt,
          response: data.response
        }
      })
      
      logger.debug('AI usage tracked successfully', {
        userId: data.userId,
        provider: data.provider,
        totalTokens: data.totalTokens,
        costCents: data.costCents
      })
    } catch (error) {
      logger.error('Failed to track AI usage', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: data.userId,
        provider: data.provider
      })
    }
  }

  async getUsageStats(userId: string, timeframe?: { start: Date; end: Date }): Promise<{
    totalInteractions: number
    totalTokens: number
    totalCostCents: number
    byProvider: Record<string, { interactions: number; tokens: number; costCents: number }>
    byType: Record<string, { interactions: number; tokens: number; costCents: number }>
  }> {
    const where = {
      userId,
      ...(timeframe && {
        createdAt: {
          gte: timeframe.start,
          lte: timeframe.end
        }
      })
    }

    const interactions = await prisma.aIInteraction.findMany({ where })
    
    const stats = {
      totalInteractions: interactions.length,
      totalTokens: interactions.reduce((sum, i) => sum + i.totalTokens, 0),
      totalCostCents: interactions.reduce((sum, i) => sum + i.costCents, 0),
      byProvider: {} as Record<string, { interactions: number; tokens: number; costCents: number }>,
      byType: {} as Record<string, { interactions: number; tokens: number; costCents: number }>
    }

    // Group by provider
    interactions.forEach(interaction => {
      if (!stats.byProvider[interaction.provider]) {
        stats.byProvider[interaction.provider] = { interactions: 0, tokens: 0, costCents: 0 }
      }
      stats.byProvider[interaction.provider].interactions++
      stats.byProvider[interaction.provider].tokens += interaction.totalTokens
      stats.byProvider[interaction.provider].costCents += interaction.costCents
    })

    // Group by type
    interactions.forEach(interaction => {
      if (!stats.byType[interaction.type]) {
        stats.byType[interaction.type] = { interactions: 0, tokens: 0, costCents: 0 }
      }
      stats.byType[interaction.type].interactions++
      stats.byType[interaction.type].tokens += interaction.totalTokens
      stats.byType[interaction.type].costCents += interaction.costCents
    })

    return stats
  }

  private getTypeFromCommand(command: string): string {
    const typeMap = {
      expand: 'addition',
      update: 'replacement', 
      summarize: 'summary',
      rewrite: 'replacement',
      suggest: 'suggestions',
      analyze: 'analysis'
    }
    return typeMap[command] || 'general'
  }
}

// Singleton instance
export const aiService = new AIService()