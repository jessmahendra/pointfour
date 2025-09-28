import { generateText, generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

// Types for our debug logging
export interface LLMInteraction {
  id: string;
  timestamp: Date;
  type: 'text' | 'object';
  model: string;
  prompt: string;
  response: string;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  duration: number;
  error?: string;
  metadata?: Record<string, any>;
}

// In-memory store for debug data (in production, use a database)
const interactionLog: LLMInteraction[] = [];

// Configuration
const DEFAULT_MODEL = 'gpt-4o-mini';
const GPT5_MODEL = 'gpt-5-mini';
const ENABLE_GPT5_TESTING = process.env.ENABLE_GPT5_TESTING === 'true';
const GPT5_TEST_PERCENTAGE = parseInt(process.env.GPT5_TEST_PERCENTAGE || '10') || 10;

export class LLMService {
  private static instance: LLMService;
  private interactionCounter = 0;

  private constructor() {}

  static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService();
    }
    return LLMService.instance;
  }

  /**
   * Generate text using the AI SDK
   */
  async generateText(
    prompt: string,
    options: {
      model?: string;
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<{ text: string; interaction: LLMInteraction }> {
    const startTime = Date.now();
    const interactionId = this.generateInteractionId();
    
    const {
      model = this.selectModel(),
      systemPrompt = "You are a helpful assistant.",
      temperature = 0.7,
      maxTokens = 2000,
      metadata = {}
    } = options;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: prompt }
    ];

    console.log(`🤖 LLM Service: Starting text generation (ID: ${interactionId})`);
    console.log(`🤖 Model: ${model}`);
    console.log(`🤖 Prompt length: ${prompt.length} characters`);

    try {
      const result = await generateText({
        model: openai(model),
        messages,
        temperature,
        maxTokens: maxTokens,
      });

      const duration = Date.now() - startTime;
      const interaction: LLMInteraction = {
        id: interactionId,
        timestamp: new Date(),
        type: 'text',
        model,
        prompt,
        response: result.text,
        tokens: result.usage ? {
          prompt: result.usage.promptTokens || 0,
          completion: result.usage.completionTokens || 0,
          total: result.usage.totalTokens || 0
        } : undefined,
        duration,
        metadata
      };

      // Log the interaction
      this.logInteraction(interaction);

      console.log(`✅ LLM Service: Text generation completed (ID: ${interactionId})`);
      console.log(`✅ Duration: ${duration}ms`);
      console.log(`✅ Tokens: ${interaction.tokens?.total || 'unknown'}`);

      return { text: result.text, interaction };
    } catch (error) {
      const duration = Date.now() - startTime;
      const interaction: LLMInteraction = {
        id: interactionId,
        timestamp: new Date(),
        type: 'text',
        model,
        prompt,
        response: '',
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata
      };

      this.logInteraction(interaction);
      console.error(`❌ LLM Service: Text generation failed (ID: ${interactionId})`, error);
      throw error;
    }
  }

  /**
   * Generate structured object using the AI SDK
   */
  async generateObject<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    options: {
      model?: string;
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<{ object: T; interaction: LLMInteraction }> {
    const startTime = Date.now();
    const interactionId = this.generateInteractionId();
    
    const {
      model = this.selectModel(),
      systemPrompt = "You are a helpful assistant that returns structured data.",
      temperature = 0.3,
      maxTokens = 2000,
      metadata = {}
    } = options;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: prompt }
    ];

    console.log(`🤖 LLM Service: Starting object generation (ID: ${interactionId})`);
    console.log(`🤖 Model: ${model}`);
    console.log(`🤖 Prompt length: ${prompt.length} characters`);

    try {
      const result = await generateObject({
        model: openai(model),
        messages,
        schema,
        temperature,
        maxTokens,
      });

      const duration = Date.now() - startTime;
      const interaction: LLMInteraction = {
        id: interactionId,
        timestamp: new Date(),
        type: 'object',
        model,
        prompt,
        response: JSON.stringify(result.object, null, 2),
        tokens: result.usage ? {
          prompt: result.usage.promptTokens || 0,
          completion: result.usage.completionTokens || 0,
          total: result.usage.totalTokens || 0
        } : undefined,
        duration,
        metadata
      };

      // Log the interaction
      this.logInteraction(interaction);

      console.log(`✅ LLM Service: Object generation completed (ID: ${interactionId})`);
      console.log(`✅ Duration: ${duration}ms`);
      console.log(`✅ Tokens: ${interaction.tokens?.total || 'unknown'}`);

      return { object: result.object, interaction };
    } catch (error) {
      const duration = Date.now() - startTime;
      const interaction: LLMInteraction = {
        id: interactionId,
        timestamp: new Date(),
        type: 'object',
        model,
        prompt,
        response: '',
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata
      };

      this.logInteraction(interaction);
      console.error(`❌ LLM Service: Object generation failed (ID: ${interactionId})`, error);
      throw error;
    }
  }

  /**
   * Get all logged interactions for debugging
   */
  getInteractions(): LLMInteraction[] {
    return [...interactionLog].reverse(); // Most recent first
  }

  /**
   * Get interactions by model
   */
  getInteractionsByModel(model: string): LLMInteraction[] {
    return interactionLog.filter(interaction => interaction.model === model).reverse();
  }

  /**
   * Get interactions by type
   */
  getInteractionsByType(type: 'text' | 'object'): LLMInteraction[] {
    return interactionLog.filter(interaction => interaction.type === type).reverse();
  }

  /**
   * Clear all interaction logs
   */
  clearLogs(): void {
    interactionLog.length = 0;
    console.log('🧹 LLM Service: Cleared all interaction logs');
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): {
    totalInteractions: number;
    totalTokens: number;
    averageDuration: number;
    modelBreakdown: Record<string, number>;
    typeBreakdown: Record<string, number>;
    errorRate: number;
  } {
    const totalInteractions = interactionLog.length;
    const totalTokens = interactionLog.reduce((sum, interaction) => sum + (interaction.tokens?.total || 0), 0);
    const totalDuration = interactionLog.reduce((sum, interaction) => sum + interaction.duration, 0);
    const averageDuration = totalInteractions > 0 ? totalDuration / totalInteractions : 0;
    
    const modelBreakdown = interactionLog.reduce((acc, interaction) => {
      acc[interaction.model] = (acc[interaction.model] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const typeBreakdown = interactionLog.reduce((acc, interaction) => {
      acc[interaction.type] = (acc[interaction.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const errorCount = interactionLog.filter(interaction => interaction.error).length;
    const errorRate = totalInteractions > 0 ? (errorCount / totalInteractions) * 100 : 0;

    return {
      totalInteractions,
      totalTokens,
      averageDuration,
      modelBreakdown,
      typeBreakdown,
      errorRate
    };
  }

  private selectModel(): string {
    if (ENABLE_GPT5_TESTING && Math.random() * 100 < GPT5_TEST_PERCENTAGE) {
      console.log(`🧪 GPT-5 Testing: Selected GPT-5 model (${GPT5_TEST_PERCENTAGE}% chance)`);
      return GPT5_MODEL;
    }
    return DEFAULT_MODEL;
  }

  private generateInteractionId(): string {
    return `llm_${Date.now()}_${++this.interactionCounter}`;
  }

  private logInteraction(interaction: LLMInteraction): void {
    interactionLog.push(interaction);
    
    // Keep only last 1000 interactions to prevent memory issues
    if (interactionLog.length > 1000) {
      interactionLog.shift();
    }
  }
}

// Export singleton instance
export const llmService = LLMService.getInstance();
