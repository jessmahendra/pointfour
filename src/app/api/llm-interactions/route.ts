import { NextRequest, NextResponse } from 'next/server';
import { llmService } from '@/lib/llm-service';

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

export async function DELETE(request: NextRequest) {
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
