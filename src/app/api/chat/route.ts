
import { NextRequest, NextResponse } from 'next/server';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
  userProfile?: {
    bodyShape?: string;
    footType?: string;
    ukClothingSize?: string;
    ukShoeSize?: string;
    height?: string;
    fitPreference?: string;
  };
  recentQuery?: string; // The item they just searched for
  recentRecommendations?: Array<{
    brandName: string;
    confidence: number;
    reason: string;
    fitAdvice: string;
    priceRange?: string;
    reviewSummary: string;
  }>;
}

interface ChatResponse {
  response: string;
  conversationHistory: ChatMessage[];
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { message, conversationHistory = [], userProfile, recentQuery, recentRecommendations } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // For now, let's create a simple response to test the endpoint
    const response = await generateSimpleResponse(
      message,
      conversationHistory,
      userProfile,
      recentQuery,
      recentRecommendations
    );

    // Update conversation history
    const updatedHistory = [
      ...conversationHistory,
      { role: 'user' as const, content: message },
      { role: 'assistant' as const, content: response }
    ];

    const chatResponse: ChatResponse = {
      response,
      conversationHistory: updatedHistory
    };

    return NextResponse.json(chatResponse);

  } catch (error) {
    console.error('Error processing chat request:', error);
    return NextResponse.json(
      { error: 'Sorry, I\'m having trouble processing your request right now. Please try again in a moment.' },
      { status: 500 }
    );
  }
}

// Simple response function for testing
async function generateSimpleResponse(
  message: string,
  conversationHistory: ChatMessage[],
  userProfile?: ChatRequest['userProfile'],
  recentQuery?: string,
  recentRecommendations?: ChatRequest['recentRecommendations']
): Promise<string> {
  
  const lowerMessage = message.toLowerCase().trim();
  
  // Test if we have recommendation context
  if (recentRecommendations && recentRecommendations.length > 0) {
    const brandNames = recentRecommendations.map(r => r.brandName).join(', ');
    
    if (lowerMessage.includes('why') || lowerMessage.includes('recommend')) {
      return `I recommended ${brandNames} based on your search for "${recentQuery || 'your query'}". Would you like me to explain more about any specific brand?`;
    }
    
    if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      return `Here are the price ranges for your recommendations: ${recentRecommendations.map(r => `${r.brandName}: ${r.priceRange || 'varies'}`).join(', ')}. Would you like more details about any of these?`;
    }
    
    if (lowerMessage.includes('size') || lowerMessage.includes('fit')) {
      return `For sizing: ${recentRecommendations[0].fitAdvice} Would you like specific sizing advice for any of the recommended brands?`;
    }
  }
  
  // Default responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! I'm here to help you with fashion questions. Ask me about sizing, styling, or brand recommendations!";
  }
  
  return `I'm here to help with your fashion questions! You asked: "${message}". I can help you with sizing advice, brand comparisons, styling tips, and more. What specific information would you like to know?`;
}