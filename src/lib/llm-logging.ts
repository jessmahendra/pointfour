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
  static logFromApiResponse(apiResponse: unknown, source: string, prompt?: string): void {
    try {
      // Check if the response has LLM interaction data
      const response = apiResponse as Record<string, unknown>;
      const llmInteraction = response?.llmInteraction || response?.interaction;
      
      if (!llmInteraction) {
        console.warn('LLM Logging: No interaction data found in API response');
        return;
      }

      // Type the interaction data properly
      const interactionData = llmInteraction as Record<string, unknown>;

      const interaction: LLMInteraction = {
        id: interactionData.id as string,
        timestamp: new Date(interactionData.timestamp as string),
        type: (interactionData.type as 'text' | 'object') || 'text',
        model: interactionData.model as string,
        prompt: (interactionData.prompt as string) || prompt || '',
        response: (interactionData.response as string) || '',
        tokens: interactionData.tokens as { prompt: number; completion: number; total: number } | undefined,
        duration: interactionData.duration as number,
        error: interactionData.error as string | undefined,
        metadata: (interactionData.metadata as Record<string, unknown>) || {},
        source: (interactionData.source as string) || source,
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
