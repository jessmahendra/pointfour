import { llmService } from '../llm-service';
import { ProductParsingSchema, ProductParsingResult } from '../schemas/product-parsing';
import { LLMInteraction } from '../llm-store';
import axios from 'axios';

// Type for Serper API search results
interface SerperSearchResult {
  title?: string;
  snippet?: string;
  link?: string;
  url?: string;
}

// Serper API configuration
const SERPER_API_KEY = process.env.SERPER_API_KEY;
const SERPER_API_URL = 'https://google.serper.dev/search';

export interface ProductParsingOptions {
  enableWebSearch?: boolean;
  temperature?: number;
  systemPrompt?: string;
}

export class ProductParsingService {
  private static instance: ProductParsingService;

  private constructor() {}

  static getInstance(): ProductParsingService {
    if (!ProductParsingService.instance) {
      ProductParsingService.instance = new ProductParsingService();
    }
    return ProductParsingService.instance;
  }

  /**
   * Perform web search for product information
   */
  private async performWebSearch(query: string): Promise<string> {
    if (!SERPER_API_KEY) {
      console.warn('SERPER_API_KEY not configured, skipping web search');
      return `Web search not available (API key missing). Query: "${query}"`;
    }

    try {
      const body = { q: query, num: 5 }; // Get top 5 results
      const headers = { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' as const };

      const { data } = await axios.post<{ organic: SerperSearchResult[] }>(SERPER_API_URL, body, { headers, timeout: 10000 });
      const organic = Array.isArray(data?.organic) ? data.organic : [];
      
      if (organic.length === 0) {
        return `No web search results found for: "${query}"`;
      }

      // Format search results for LLM context
      const searchResults = organic.map((result: SerperSearchResult, index: number) => 
        `${index + 1}. ${result.title || 'No title'}\n   URL: ${result.link || result.url || 'No URL'}\n   Snippet: ${result.snippet || 'No snippet'}\n`
      ).join('\n');

      return `WEB SEARCH RESULTS for "${query}":\n\n${searchResults}`;
    } catch (error) {
      console.error('Serper API error:', error);
      return `Web search failed for: "${query}". Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Extract product query from the full prompt
   */
  private extractProductQuery(prompt: string): string {
    const queryMatch = prompt.match(/Query: "([^"]+)"/);
    return queryMatch ? queryMatch[1] : prompt;
  }

  /**
   * Build the enhanced prompt with web search context
   */
  private buildEnhancedPrompt(originalPrompt: string, webSearchResults: string): string {
    return `${originalPrompt}

WEB SEARCH CONTEXT:
${webSearchResults}

Based on the web search results above, please parse the product query and provide accurate brand and product information. Use the search results to verify and correct any information.`;
  }

  /**
   * Get the default system prompt for product parsing
   */
  private getDefaultSystemPrompt(): string {
    return "You are an expert at parsing product queries and identifying brand and product information. Users may make typos, use incomplete names, or provide vague descriptions. Use the web search context provided to verify and correct any information, find the most likely brand and product they're referring to, and return accurate data. Be forgiving of typos and incomplete information - use your knowledge and the web search results to fill in the gaps and find the correct brand and product. Always return the official brand website and specific product URL when available. Return structured JSON data with brand name, brand website, product name, and product URL.";
  }

  /**
   * Parse a product query and return structured data
   */
  async parseProduct(
    prompt: string, 
    options: ProductParsingOptions = {}
  ): Promise<{ result: ProductParsingResult; interaction: LLMInteraction }> {
    const {
      enableWebSearch = true,
      temperature = 0.3,
      systemPrompt = this.getDefaultSystemPrompt()
    } = options;

    console.log('🔍 ProductParsingService: Starting product parsing...');

    let enhancedPrompt = prompt;

    // Perform web search if enabled
    if (enableWebSearch) {
      const productQuery = this.extractProductQuery(prompt);
      console.log(`🔍 Performing web search for: "${productQuery}"`);
      const webSearchResults = await this.performWebSearch(productQuery);
      enhancedPrompt = this.buildEnhancedPrompt(prompt, webSearchResults);
    }

    // Generate structured object using LLM service
    const { object, interaction } = await llmService.generateObject(
      enhancedPrompt,
      ProductParsingSchema,
      {
        systemPrompt,
        temperature,
        metadata: { 
          type: 'product-parsing', 
          userPrompt: prompt, 
          webSearchPerformed: enableWebSearch 
        },
        source: 'product-parsing-service'
      }
    );

    console.log('✅ ProductParsingService: Product parsing completed');

    return { result: object, interaction };
  }

  /**
   * Parse multiple products in batch
   */
  async parseProducts(
    prompts: string[], 
    options: ProductParsingOptions = {}
  ): Promise<Array<{ result: ProductParsingResult; interaction: LLMInteraction }>> {
    console.log(`🔍 ProductParsingService: Starting batch parsing of ${prompts.length} products...`);
    
    const results = await Promise.all(
      prompts.map(prompt => this.parseProduct(prompt, options))
    );

    console.log('✅ ProductParsingService: Batch parsing completed');
    return results;
  }
}

// Export singleton instance
export const productParsingService = ProductParsingService.getInstance();
