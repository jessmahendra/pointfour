import { NextRequest, NextResponse } from 'next/server';
import { llmService } from '@/lib/llm-service';
import { z } from 'zod';
import axios from 'axios';

// Serper API configuration (reusing from external-search)
const SERPER_API_KEY = process.env.SERPER_API_KEY;
const SERPER_API_URL = 'https://google.serper.dev/search';

// Web search function using Serper API (same as external-search)
async function performWebSearch(query: string): Promise<string> {
  if (!SERPER_API_KEY) {
    console.warn('SERPER_API_KEY not configured, skipping web search');
    return `Web search not available (API key missing). Query: "${query}"`;
  }

  try {
    const body = { q: query, num: 5 }; // Get top 5 results
    const headers = { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' as const };

    const { data } = await axios.post(SERPER_API_URL, body, { headers, timeout: 10000 });
    const organic = Array.isArray(data?.organic) ? data.organic : [];
    
    if (organic.length === 0) {
      return `No web search results found for: "${query}"`;
    }

    // Format search results for LLM context
    const searchResults = organic.map((result: any, index: number) => 
      `${index + 1}. ${result.title || 'No title'}\n   URL: ${result.link || result.url || 'No URL'}\n   Snippet: ${result.snippet || 'No snippet'}\n`
    ).join('\n');

    return `WEB SEARCH RESULTS for "${query}":\n\n${searchResults}`;
  } catch (error) {
    console.error('Serper API error:', error);
    return `Web search failed for: "${query}". Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

// Schema for product parsing
const ProductParsingSchema = z.object({
  brandName: z.string().describe('The brand name extracted from the query'),
  brandWebsite: z.string().describe('The official brand website URL'),
  productName: z.string().describe('The product name extracted from the query'),
  productUrl: z.string().describe('The specific product URL on the brand website'),
  confidence: z.enum(['low', 'medium', 'high']).describe('Confidence level in the parsing accuracy')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, type = 'text', systemPrompt } = body;

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log(`🤖 LLM Interactions API: Processing ${type} request`);

    let result: string | object;
    let interaction;

    if (type === 'object') {
      // Extract just the product query from the prompt for web search
      const queryMatch = prompt.match(/Query: "([^"]+)"/);
      const productQuery = queryMatch ? queryMatch[1] : prompt;
      
      // Perform web search on just the product query
      console.log('🔍 Performing web search for product parsing...');
      const webSearchResults = await performWebSearch(productQuery);
      
      // Enhanced prompt with web search context
      const enhancedPrompt = `${prompt}

WEB SEARCH CONTEXT:
${webSearchResults}

Based on the web search results above, please parse the product query and provide accurate brand and product information. Use the search results to verify and correct any information.`;

      // Generate structured object for product parsing with web search context
      const { object, interaction: objInteraction } = await llmService.generateObject(
        enhancedPrompt,
        ProductParsingSchema,
        {
          systemPrompt: systemPrompt || "You are an expert at parsing product queries and identifying brand and product information. Users may make typos, use incomplete names, or provide vague descriptions. Use the web search context provided to verify and correct any information, find the most likely brand and product they're referring to, and return accurate data. Be forgiving of typos and incomplete information - use your knowledge and the web search results to fill in the gaps and find the correct brand and product. Always return the official brand website and specific product URL when available. Return structured JSON data with brand name, brand website, product name, and product URL.",
          temperature: 0.3,
          metadata: { type: 'product-parsing', userPrompt: prompt, webSearchPerformed: true },
          source: 'product-parser'
        }
      );
      result = object;
      interaction = objInteraction;
    } else {
      // Generate text response
      const { text, interaction: textInteraction } = await llmService.generateText(
        prompt,
        {
          systemPrompt: systemPrompt || "You are a helpful assistant.",
          temperature: 0.7,
          metadata: { type: 'text', userPrompt: prompt },
          source: 'text-generator'
        }
      );
      result = text;
      interaction = textInteraction;
    }

    return NextResponse.json({
      success: true,
      data: result,
      interaction: {
        id: interaction.id,
        timestamp: interaction.timestamp,
        duration: interaction.duration,
        tokens: interaction.tokens
      }
    });

  } catch (error) {
    console.error('❌ LLM Interactions POST API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process LLM request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const source = url.searchParams.get('source');
    const model = url.searchParams.get('model');
    const type = url.searchParams.get('type');

    let interactions;

    if (source) {
      interactions = llmService.getInteractionsBySource(source);
    } else if (model) {
      interactions = llmService.getInteractionsByModel(model);
    } else if (type) {
      interactions = llmService.getInteractionsByType(type as 'text' | 'object');
    } else {
      interactions = llmService.getInteractions();
    }

    // Apply limit
    const limitedInteractions = interactions.slice(0, limit);

    return NextResponse.json({
      success: true,
      interactions: limitedInteractions,
      total: interactions.length,
      limit
    });

  } catch (error) {
    console.error('❌ LLM Interactions API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch interactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    llmService.clearLogs();
    
    return NextResponse.json({
      success: true,
      message: 'All interactions cleared'
    });

  } catch (error) {
    console.error('❌ LLM Interactions Clear API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to clear interactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
