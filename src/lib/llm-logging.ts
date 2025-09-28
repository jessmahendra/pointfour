import { useLLMStore, LLMInteraction } from './llm-store';

/**
 * Utility to log LLM interactions from API responses to the store
 */
export class LLMLogging {
  private static getStore() {
    return useLLMStore.getState();
  }

  /**
   * Log an interaction from an API response
   */
  static logFromApiResponse(apiResponse: any, source: string, prompt?: string): void {
    try {
      // Check if the response has LLM interaction data
      const llmInteraction = apiResponse?.llmInteraction || apiResponse?.interaction;
      
      if (!llmInteraction) {
        console.warn('LLM Logging: No interaction data found in API response');
        return;
      }

      const interaction: LLMInteraction = {
        id: llmInteraction.id,
        timestamp: new Date(llmInteraction.timestamp),
        type: llmInteraction.type || 'text',
        model: llmInteraction.model,
        prompt: llmInteraction.prompt || prompt || '',
        response: llmInteraction.response || '',
        tokens: llmInteraction.tokens,
        duration: llmInteraction.duration,
        error: llmInteraction.error,
        metadata: llmInteraction.metadata || {},
        source: llmInteraction.source || source,
        status: 'completed'
      };

      this.getStore().addInteraction(interaction);
      console.log(`📝 LLM Logging: Logged interaction ${interaction.id} from ${source}`);
    } catch (error) {
      console.error('❌ LLM Logging: Failed to log interaction:', error);
    }
  }

  /**
   * Log an in-progress interaction
   */
  static logInProgress(id: string, type: 'text' | 'object', model: string, prompt: string, source: string, metadata?: Record<string, unknown>): void {
    try {
      const interaction: LLMInteraction = {
        id,
        timestamp: new Date(),
        type,
        model,
        prompt,
        response: '',
        duration: 0,
        metadata: metadata || {},
        source,
        status: 'in-progress'
      };

      this.getStore().addInteraction(interaction);
      console.log(`⏳ LLM Logging: Logged in-progress interaction ${id} from ${source}`);
    } catch (error) {
      console.error('❌ LLM Logging: Failed to log in-progress interaction:', error);
    }
  }

  /**
   * Update an existing interaction
   */
  static updateInteraction(id: string, updates: Partial<LLMInteraction>): void {
    try {
      this.getStore().updateInteraction(id, updates);
    } catch (error) {
      console.error('❌ LLM Logging: Failed to update interaction:', error);
    }
  }
}
