import { NextRequest, NextResponse } from 'next/server';
import { llmService } from '@/lib/llm-service';
import { productParsingService } from '@/lib/services/product-parsing-service';

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
      // Use the modular product parsing service
      const { result: parsedResult, interaction: objInteraction } = await productParsingService.parseProduct(
        prompt,
        {
          enableWebSearch: true,
          temperature: 0.3,
          systemPrompt: systemPrompt
        }
      );
      result = parsedResult;
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
