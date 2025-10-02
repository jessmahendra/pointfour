/**
 * Product Parsing Prompt
 * Used for parsing product queries and identifying brand and product information
 */

export interface ProductParsingVariables {
  originalPrompt: string;
  webSearchResults?: string;
}

export const PRODUCT_PARSING_SYSTEM_PROMPT = 
  "You are an expert at parsing product queries and identifying brand and product information. Users may make typos, use incomplete names, or provide vague descriptions. Use the web search context provided to verify and correct any information, find the most likely brand and product they're referring to, and return accurate data. Be forgiving of typos and incomplete information - use your knowledge and the web search results to fill in the gaps and find the correct brand and product. Always return the official brand website and specific product URL when available. Return structured JSON data with brand name, brand website, product name, and product URL.";

export function buildProductParsingPrompt(variables: ProductParsingVariables): string {
  const { originalPrompt, webSearchResults } = variables;

  if (!webSearchResults) {
    return originalPrompt;
  }

  return `${originalPrompt}

WEB SEARCH CONTEXT:
${webSearchResults}

Based on the web search results above, please parse the product query and provide accurate brand and product information. Use the search results to verify and correct any information.`;
}

export function extractProductQuery(prompt: string): string {
  const queryMatch = prompt.match(/Query: "([^"]+)"/);
  return queryMatch ? queryMatch[1] : prompt;
}
