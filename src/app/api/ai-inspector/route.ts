import { NextRequest, NextResponse } from 'next/server';
import { llmService } from '@/lib/llm-service';
import { z } from 'zod';
import { 
  FASHION_EXPERT_STRUCTURED_SYSTEM_PROMPT,
  FASHION_EXPERT_GENERAL_SYSTEM_PROMPT,
  buildFashionExpertTestPrompt
} from '@/prompts';

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

    console.log('🤖 AI Inspector API: Processing request');
    console.log('Query:', query);
    console.log('Type:', type);

    let result: string | object;
    let interaction;

    if (type === 'object') {
      // Test structured object generation
      const { object, interaction: objInteraction } = await llmService.generateObject(
        buildFashionExpertTestPrompt(query, 'structured'),
        z.object({
          brand: z.string().describe('The brand name'),
          category: z.string().describe('The clothing category'),
          sizing: z.string().describe('Sizing advice'),
          quality: z.string().describe('Quality assessment'),
          recommendation: z.string().describe('Specific recommendation'),
          confidence: z.enum(['low', 'medium', 'high']).describe('Confidence level')
        }),
        {
          systemPrompt: FASHION_EXPERT_STRUCTURED_SYSTEM_PROMPT,
          temperature: 0.7,
          metadata: { testType: 'object', userQuery: query },
          source: 'ai-inspector-api'
        }
      );
      result = object;
      interaction = objInteraction;
    } else {
      // Test text generation
      const { text, interaction: textInteraction } = await llmService.generateText(
        buildFashionExpertTestPrompt(query, 'general'),
        {
          systemPrompt: FASHION_EXPERT_GENERAL_SYSTEM_PROMPT,
          temperature: 0.7,
          metadata: { testType: 'text', userQuery: query },
          source: 'ai-inspector-api'
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
        timestamp: interaction.timestamp.toISOString()
      }
    });

  } catch (error) {
    console.error('❌ AI Inspector API: Error:', error);
    
    return NextResponse.json({
      success: false,
      result: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      interaction: {
        id: 'error',
        model: 'unknown',
        duration: 0,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}
