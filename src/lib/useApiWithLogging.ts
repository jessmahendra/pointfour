"use client";

import { useCallback } from 'react';
import { LLMLogging } from './llm-logging';

interface ApiWithLoggingOptions {
  source: string;
  logInProgress?: boolean;
  prompt?: string;
  type?: 'text' | 'object';
}

/**
 * Hook that wraps API calls with automatic LLM interaction logging
 */
export function useApiWithLogging() {
  const callApiWithLogging = useCallback(async (
    url: string,
    options: RequestInit = {},
    loggingOptions: ApiWithLoggingOptions
  ) => {
    const { source, logInProgress = false, prompt, type = 'text' } = loggingOptions;
    const requestId = `${source}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Log in-progress if requested
      if (logInProgress && prompt) {
        LLMLogging.logInProgress(
          requestId,
          type,
          'unknown', // Will be updated when response comes back
          prompt,
          source
        );
      }

      const response = await fetch(url, options);
      const data = await response.json();

      // Update the in-progress interaction with completion data
      if (logInProgress) {
        // Handle different API response structures
        const llmInteraction = data?.data?.llmInteraction || data?.llmInteraction || data?.interaction;
        
        if (llmInteraction) {
          LLMLogging.updateInteraction(requestId, {
            response: llmInteraction.response || (typeof data.result === 'string' ? data.result : JSON.stringify(data.result, null, 2)),
            tokens: llmInteraction.tokens,
            duration: llmInteraction.duration,
            model: llmInteraction.model,
            type: llmInteraction.type || type,
            status: 'completed'
          });
        } else {
          // Fallback: update with basic completion info if no interaction data
          LLMLogging.updateInteraction(requestId, {
            response: typeof data.result === 'string' ? data.result : JSON.stringify(data.result, null, 2),
            status: 'completed'
          });
        }
      } else {
        // If not logging in-progress, log the completed interaction
        LLMLogging.logFromApiResponse(data, source, prompt);
      }

      return data;
    } catch (error) {
      // Update in-progress interaction with error if it was logged
      if (logInProgress) {
        LLMLogging.updateInteraction(requestId, {
          response: '',
          error: error instanceof Error ? error.message : "Unknown error",
          status: 'error'
        });
      }

      throw error;
    }
  }, []);

  return { callApiWithLogging };
}
