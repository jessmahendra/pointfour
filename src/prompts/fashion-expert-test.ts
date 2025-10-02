/**
 * Fashion Expert Test Prompts
 * Used for testing LLM functionality with fashion-related queries
 */

export const FASHION_EXPERT_STRUCTURED_SYSTEM_PROMPT = 
  "You are a fashion expert who provides detailed, structured recommendations for clothing brands and sizing advice.";

export const FASHION_EXPERT_GENERAL_SYSTEM_PROMPT = 
  "You are a helpful fashion expert who provides detailed sizing and brand recommendations.";

export function buildFashionExpertTestPrompt(query: string, type: 'structured' | 'general' = 'general'): string {
  if (type === 'structured') {
    return `Analyze this fashion query and provide a structured recommendation: "${query}"`;
  }
  
  return `Provide fashion advice for: "${query}"`;
}
