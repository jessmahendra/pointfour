import { generateText, generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { useLLMStore, LLMInteraction } from './llm-store';

// LLMInteraction interface is now imported from llm-store

// Get the Zustand store instance
const getStore = () => useLLMStore.getState();

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
      metadata?: Record<string, unknown>;
      source?: string;
    } = {}
  ): Promise<{ text: string; interaction: LLMInteraction }> {
    const startTime = Date.now();
    const interactionId = this.generateInteractionId();
    
    const {
      model = this.selectModel(),
      systemPrompt = "You are a helpful assistant.",
      temperature = 0.7,
      // maxTokens = 2000, // TODO: Fix AI SDK v5 property name
      metadata = {},
      source = 'llm-service'
    } = options;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: prompt }
    ];

    console.log(`🤖 LLM Service: Starting text generation (ID: ${interactionId})`);
    console.log(`🤖 Model: ${model}`);
    console.log(`🤖 Prompt length: ${prompt.length} characters`);

    // Log interaction in progress
    const inProgressInteraction: LLMInteraction = {
      id: interactionId,
      timestamp: new Date(),
      type: 'text',
      model,
      prompt,
      response: '',
      duration: 0,
      metadata,
      source,
      status: 'in-progress'
    };
    
    getStore().addInteraction(inProgressInteraction);

    try {
      const result = await generateText({
        model: openai(model),
        messages,
        temperature,
        // maxTokens: maxTokens, // TODO: Fix AI SDK v5 property name
      });

      const duration = Date.now() - startTime;
      
      // Update the existing interaction with completion data
      getStore().updateInteraction(interactionId, {
        response: result.text,
        tokens: result.usage ? {
          prompt: 0, // TODO: Fix AI SDK v5 property names
          completion: 0, // TODO: Fix AI SDK v5 property names  
          total: result.usage.totalTokens || 0
        } : undefined,
        duration,
        status: 'completed'
      });

      const interaction: LLMInteraction = {
        id: interactionId,
        timestamp: new Date(),
        type: 'text',
        model,
        prompt,
        response: result.text,
        tokens: result.usage ? {
          prompt: 0, // TODO: Fix AI SDK v5 property names
          completion: 0, // TODO: Fix AI SDK v5 property names  
          total: result.usage.totalTokens || 0
        } : undefined,
        duration,
        metadata,
        source,
        status: 'completed'
      };

      console.log(`✅ LLM Service: Text generation completed (ID: ${interactionId})`);
      console.log(`✅ Duration: ${duration}ms`);
      console.log(`✅ Tokens: ${interaction.tokens?.total || 'unknown'}`);

      return { text: result.text, interaction };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Update the existing interaction with error data
      getStore().updateInteraction(interactionId, {
        response: '',
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'error'
      });

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
      metadata?: Record<string, unknown>;
      source?: string;
    } = {}
  ): Promise<{ object: T; interaction: LLMInteraction }> {
    const startTime = Date.now();
    const interactionId = this.generateInteractionId();
    
    const {
      model = this.selectModel(),
      systemPrompt = "You are a helpful assistant that returns structured data.",
      temperature = 0.3,
      // maxTokens = 2000, // TODO: Fix AI SDK v5 property name
      metadata = {},
      source = 'llm-service'
    } = options;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: prompt }
    ];

    console.log(`🤖 LLM Service: Starting object generation (ID: ${interactionId})`);
    console.log(`🤖 Model: ${model}`);
    console.log(`🤖 Prompt length: ${prompt.length} characters`);

    // Log interaction in progress
    const inProgressInteraction: LLMInteraction = {
      id: interactionId,
      timestamp: new Date(),
      type: 'object',
      model,
      prompt,
      response: '',
      duration: 0,
      metadata,
      source,
      status: 'in-progress'
    };
    
    getStore().addInteraction(inProgressInteraction);

    try {
      const result = await generateObject({
        model: openai(model),
        messages,
        schema,
        temperature,
        // maxTokens, // TODO: Fix AI SDK v5 property name
      });

      const duration = Date.now() - startTime;
      
      // Update the existing interaction with completion data
      getStore().updateInteraction(interactionId, {
        response: JSON.stringify(result.object, null, 2),
        tokens: result.usage ? {
          prompt: 0, // TODO: Fix AI SDK v5 property names
          completion: 0, // TODO: Fix AI SDK v5 property names  
          total: result.usage.totalTokens || 0
        } : undefined,
        duration,
        status: 'completed'
      });

      const interaction: LLMInteraction = {
        id: interactionId,
        timestamp: new Date(),
        type: 'object',
        model,
        prompt,
        response: JSON.stringify(result.object, null, 2),
        tokens: result.usage ? {
          prompt: 0, // TODO: Fix AI SDK v5 property names
          completion: 0, // TODO: Fix AI SDK v5 property names  
          total: result.usage.totalTokens || 0
        } : undefined,
        duration,
        metadata,
        source,
        status: 'completed'
      };

      console.log(`✅ LLM Service: Object generation completed (ID: ${interactionId})`);
      console.log(`✅ Duration: ${duration}ms`);
      console.log(`✅ Tokens: ${interaction.tokens?.total || 'unknown'}`);

      return { object: result.object, interaction };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Update the existing interaction with error data
      getStore().updateInteraction(interactionId, {
        response: '',
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'error'
      });

      console.error(`❌ LLM Service: Object generation failed (ID: ${interactionId})`, error);
      throw error;
    }
  }

  /**
   * Get all logged interactions for debugging
   */
  getInteractions(): LLMInteraction[] {
    return getStore().getRecentInteractions();
  }

  /**
   * Get interactions by model
   */
  getInteractionsByModel(model: string): LLMInteraction[] {
    return getStore().getInteractionsByModel(model);
  }

  /**
   * Get interactions by type
   */
  getInteractionsByType(type: 'text' | 'object'): LLMInteraction[] {
    return getStore().getInteractionsByType(type);
  }

  /**
   * Get interactions by source
   */
  getInteractionsBySource(source: string): LLMInteraction[] {
    return getStore().getInteractionsBySource(source);
  }

  /**
   * Clear all interaction logs
   */
  clearLogs(): void {
    getStore().clearInteractions();
    console.log('🧹 LLM Service: Cleared all interaction logs');
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    return getStore().getStats();
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

  // logInteraction method removed - now using Zustand store
}

// Export singleton instance
export const llmService = LLMService.getInstance();
