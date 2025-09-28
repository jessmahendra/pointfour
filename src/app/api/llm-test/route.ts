import { NextRequest, NextResponse } from 'next/server';
import { llmService } from '@/lib/llm-service';
import { z } from 'zod';

// Schema for structured data generation
const FashionRecommendationSchema = z.object({
  brand: z.string().describe('The brand name'),
  category: z.string().describe('The clothing category'),
  sizing: z.string().describe('Sizing advice'),
  quality: z.string().describe('Quality assessment'),
  recommendation: z.string().describe('Specific recommendation'),
  confidence: z.enum(['low', 'medium', 'high']).describe('Confidence level')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, type = 'text' } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log(`🧪 LLM Test API: Received ${type} request for query: "${query}"`);

    let result;
    let interaction;

    if (type === 'object') {
      // Test structured object generation
      const { object, interaction: objInteraction } = await llmService.generateObject(
        `Analyze this fashion query and provide a structured recommendation: "${query}"`,
        FashionRecommendationSchema,
        {
          systemPrompt: "You are a fashion expert who provides detailed, structured recommendations for clothing brands and sizing advice.",
          temperature: 0.7,
          maxTokens: 1000,
          metadata: { testType: 'object', userQuery: query },
          source: 'llm-test-api'
        }
      );

      result = object;
      interaction = objInteraction;
    } else {
      // Test text generation
      const { text, interaction: textInteraction } = await llmService.generateText(
        `Provide fashion advice for: "${query}"`,
        {
          systemPrompt: "You are a helpful fashion expert who provides detailed sizing and brand recommendations.",
          temperature: 0.7,
          maxTokens: 1000,
          metadata: { testType: 'text', userQuery: query },
          source: 'llm-test-api'
        }
      );

      result = text;
      interaction = textInteraction;
    }

    return NextResponse.json({
      success: true,
      result,
      interaction: {
        id: interaction.id,
        model: interaction.model,
        duration: interaction.duration,
        tokens: interaction.tokens,
        timestamp: interaction.timestamp
      }
    });

  } catch (error) {
    console.error('❌ LLM Test API Error:', error);
    return NextResponse.json(
      { 
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
    const action = url.searchParams.get('action');

    switch (action) {
      case 'stats':
        // Get usage statistics from Zustand store
        const stats = llmService.getUsageStats();
        return NextResponse.json({
          success: true,
          stats
        });

      case 'interactions':
        // Get all interactions from Zustand store
        const interactions = llmService.getInteractions();
        const limit = parseInt(url.searchParams.get('limit') || '50');
        return NextResponse.json({
          success: true,
          interactions: interactions.slice(0, limit),
          total: interactions.length
        });

      case 'clear':
        // Clear all logs
        llmService.clearLogs();
        return NextResponse.json({
          success: true,
          message: 'All interaction logs cleared'
        });

      default:
        return NextResponse.json({
          success: true,
          message: 'LLM Test API is running (now using Zustand store)',
          endpoints: {
            'POST /api/llm-test': 'Test LLM generation (text or object)',
            'GET /api/llm-test?action=stats': 'Get usage statistics',
            'GET /api/llm-test?action=interactions': 'Get interaction logs',
            'GET /api/llm-test?action=clear': 'Clear interaction logs'
          }
        });
    }
  } catch (error) {
    console.error('❌ LLM Test API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
