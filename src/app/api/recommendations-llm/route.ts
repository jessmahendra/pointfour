import { NextRequest, NextResponse } from 'next/server';
import { llmService } from '@/lib/llm-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, userProfile } = body;

    if (!query?.trim()) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Query is required',
          recommendation: "Please provide a valid query."
        },
        { status: 400 }
      );
    }

    console.log('=== LLM RECOMMENDATIONS API: Starting request ===');
    console.log('Query received:', query);
    console.log('User profile provided:', !!userProfile);

    // Create the same prompt structure as the original recommendations API
    const aiPrompt = `You are a fashion expert helping users find the right fit for clothing and footwear brands. 

User Query: ${query}

**MANDATORY: You MUST include ALL of the following sections in your response, even if data is limited:**

**Summary**: Structure this section exactly as follows:
[Brand name] is a [1-2 sentence concise brand description]. [NO user-specific information]

**Fit summary**
[1-2 sentences about fit for this specific user based on available data]

**Quality**  
[1-2 sentences about brand quality and materials - ALWAYS include this section, even if you must state "Quality information is limited based on available reviews"]

**Sizing**: Include all sizing advice, fit considerations, and specific guidance (runs small/large, true to size, etc.) based on customer reviews. This should contain all the detailed sizing information and fit considerations.

**Recommendations**: Provide 3-4 specific, actionable recommendations based on the available customer review data and user profile. Include:
- A summary of what customers say about this brand (comfort, fit, quality)
- Specific advice for the user's measurements and preferences
- Any important considerations or tips based on review patterns
- Action items (e.g., "Order your usual size", "Size up/down", "Check return policy")

**Warnings**: Any important fit or quality considerations (if none, state "No specific warnings identified")

**Price**: Price range information if available (if not available, state "Price information not available")

**Customer Reviews**: Include relevant user feedback and quotes (if limited, state "Limited customer review data available")

**CRITICAL REQUIREMENTS:**
- ALL sections above must be present in every response
- Quality section is MANDATORY - never omit it
- If data is limited for any section, acknowledge this but still provide the section
- Keep all sections concise (1-2 sentences each)
- Make recommendations DATA-DRIVEN based on the customer reviews provided
- If we have good database data, use that as the primary source
- If database data is limited but we have web search results, focus on the web data
- Base recommendations on actual customer feedback patterns, not generic advice
- Include specific insights from the review data when available
- Provide actionable next steps based on the available data
- Always be encouraging but transparent about data availability

Make your response helpful, specific, and actionable. Be concise and avoid verbose descriptions.`;

    console.log('=== LLM RECOMMENDATIONS API: Calling LLM service ===');
    console.log('Prompt length:', aiPrompt.length);

    // Use the centralized LLM service
    const { text: aiResponse, interaction } = await llmService.generateText(
      aiPrompt,
      {
        systemPrompt: "You are a helpful fashion expert who provides detailed, accurate sizing and fit advice based on available data. Always be encouraging but honest about data limitations.",
        temperature: 1,
        maxTokens: 2000,
        metadata: { 
          userQuery: query,
          hasUserProfile: !!userProfile
        },
        source: 'recommendations-api'
      }
    );

    console.log('=== LLM RECOMMENDATIONS API: Response received ===');
    console.log('Response length:', aiResponse.length);
    console.log('Model used:', interaction.model);
    console.log('Duration:', interaction.duration + 'ms');
    console.log('Tokens used:', interaction.tokens?.total || 0);

    // Create the same response structure as the original API
    const enhancedResult = {
      recommendation: aiResponse,
      query: query,
      totalBrands: 0, // Not applicable for LLM-only approach
      hasDatabaseData: false, // Not applicable for LLM-only approach
      hasExternalData: false, // Not applicable for LLM-only approach
      searchType: 'llm', // New search type to indicate LLM-only
      externalSearchResults: null, // Not applicable for LLM-only approach
      externalSearchAttempted: false,
      externalSearchError: null,
      dataSource: 'llm_service',
      llmInteraction: {
        id: interaction.id,
        model: interaction.model,
        duration: interaction.duration,
        tokens: interaction.tokens,
        timestamp: interaction.timestamp,
        type: interaction.type,
        prompt: interaction.prompt,
        response: interaction.response,
        metadata: interaction.metadata,
        source: interaction.source,
        error: interaction.error
      }
    };

    console.log('=== LLM RECOMMENDATIONS API: Final result created ===');
    console.log('Result type:', enhancedResult.searchType);
    console.log('Data source:', enhancedResult.dataSource);

    return NextResponse.json({
      success: true,
      data: enhancedResult
    });

  } catch (error) {
    console.error('=== LLM RECOMMENDATIONS API: Error occurred ===');
    console.error('Error:', error);

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process recommendation request',
        details: error instanceof Error ? error.message : 'Unknown error',
        recommendation: "Sorry, I couldn't process your request. Please try again or check if the brand name is correct."
      },
      { status: 500 }
    );
  }
}
