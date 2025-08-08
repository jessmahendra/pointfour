import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  let query = '';
  try {
    const body = await request.json();
    query = body.query;
    
    console.log('=== DEBUG: Starting recommendation request ===');
    console.log('Query received:', query);
    console.log('OpenAI API Key exists:', !!process.env.OPENAI_API_KEY);
    console.log('OpenAI API Key preview:', process.env.OPENAI_API_KEY?.substring(0, 10) + '...');
    
    // DEBUG: Log all environment variables
    console.log('=== DEBUG: Environment Variables ===');
    console.log('NEXT_PUBLIC_AIRTABLE_BASE_ID:', process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID);
    console.log('NEXT_PUBLIC_AIRTABLE_API_KEY exists:', !!process.env.NEXT_PUBLIC_AIRTABLE_API_KEY);
    console.log('NEXT_PUBLIC_AIRTABLE_API_KEY preview:', process.env.NEXT_PUBLIC_AIRTABLE_API_KEY?.substring(0, 10) + '...');
    console.log('All env vars with AIRTABLE:', Object.keys(process.env).filter(key => key.includes('AIRTABLE')));
    
    const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID || process.env.AIRTABLE_BASE_ID;
    const AIRTABLE_API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY || process.env.AIRTABLE_API_KEY;
    
    console.log('=== DEBUG: Checking required vars ===');
    console.log('AIRTABLE_BASE_ID value:', AIRTABLE_BASE_ID);
    console.log('AIRTABLE_API_KEY value:', AIRTABLE_API_KEY ? 'EXISTS' : 'MISSING');
    
    if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
      console.log('Missing Airtable config - BASE_ID:', !!AIRTABLE_BASE_ID, 'API_KEY:', !!AIRTABLE_API_KEY);
      throw new Error(`Missing Airtable configuration. BASE_ID: ${!!AIRTABLE_BASE_ID}, API_KEY: ${!!AIRTABLE_API_KEY}`);
    }
    
    // Fetch your real brand data
    console.log('=== DEBUG: Fetching Airtable data ===');
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Brands`,
      {
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Airtable fetch failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Airtable records fetched:', data.records?.length || 0);
    
    // Process your Airtable data for AI
    interface Brand {
      name: string;
      category: string;
      garmentTypes: string[];
      fitSummary: string;
      bestForBodyTypes: string[];
      sizeRange: string;
      sizingSystem: string;
      priceRange: string;
      userQuotes: string;
      reviews: string;
      confidenceScore: number;
      commonFitInfo: string;
      fabricStretch: string;
      userFeedback: string;
      productURL: string;
      imageURL: string;
    }
    
    const brands = data.records.map((record: { fields: {  
      'Brand Name'?: string;
      'Category'?: string;
      'Garment Types'?: string[] | string;
      'Fit Summary'?: string;
      'Best For Body Types'?: string[] | string;
      'Size Range'?: string;
      'Sizing System'?: string;
      'Price Range'?: string;
      'User Quotes'?: string;
      'Reviews'?: string;
      'Confidence Score'?: number;
      'Common Fit Information'?: string;
      'Fabric Stretch'?: string;
      'User feedback'?: string;
      'Product URL'?: string;
      'Link'?: string;
      'Image'?: string;
      'Photo'?: string;
    }}) => ({
     name: record.fields['Brand Name'] || '',
     category: record.fields['Category'] || '',
     garmentTypes: Array.isArray(record.fields['Garment Types']) ? record.fields['Garment Types'] : [record.fields['Garment Types'] || ''],
     fitSummary: record.fields['Fit Summary'] || '',
     bestForBodyTypes: Array.isArray(record.fields['Best For Body Types']) ? record.fields['Best For Body Types'] : [record.fields['Best For Body Types'] || ''],
     sizeRange: record.fields['Size Range'] || '',
     sizingSystem: record.fields['Sizing System'] || '',
     priceRange: record.fields['Price Range'] || '',
     userQuotes: record.fields['User Quotes'] || '',
     reviews: record.fields['Reviews'] || '',
     confidenceScore: record.fields['Confidence Score'] || 0,
     commonFitInfo: record.fields['Common Fit Information'] || '',
     fabricStretch: record.fields['Fabric Stretch'] || '',
     userFeedback: record.fields['User feedback'] || '',
     productURL: record.fields['Product URL'] || record.fields['Link'] || '',
     imageURL: record.fields['Image'] || record.fields['Photo'] || ''
    })).filter((brand: { name: string }) => brand.name);
    
    console.log('Processed brands:', brands.length);
    console.log('Sample brand:', brands[0]);
    
    // Enhanced analysis: Check if this is a detailed brand analysis vs follow-up
    const isDetailedAnalysis = query.includes('Category:') && query.includes('Fit preference:');
    const isFollowUp = query.includes('Follow-up question about');
    
    console.log('=== DEBUG: Request type ===');
    console.log('Is detailed analysis:', isDetailedAnalysis);
    console.log('Is follow-up:', isFollowUp);
    
    let prompt;
    
    if (isFollowUp) {
      // Handle follow-up questions with context
      prompt = `You are a fashion expert answering a follow-up question about a brand analysis. 
      
${query}

Available brands with real user data:
${brands.slice(0, 10).map((brand: Brand) => `
${brand.name} (${brand.category}):
- Garments: ${brand.garmentTypes.join(', ')}
- Best for body types: ${brand.bestForBodyTypes.join(', ')}
- Fit: ${brand.fitSummary}
- Sizing: ${brand.sizingSystem} (${brand.sizeRange})
- Price: ${brand.priceRange}
- User quotes: ${brand.userQuotes}
- Common fit issues: ${brand.commonFitInfo}
- Fabric stretch: ${brand.fabricStretch}
- Customer reviews: ${brand.userFeedback}
- Product URL: ${brand.productURL}
- Confidence: ${brand.confidenceScore}/5
`).join('\n')}

Provide a focused, helpful answer to their specific follow-up question. Include real customer quotes when available using quotation marks. Keep under 200 words and be conversational.`;

    } else if (isDetailedAnalysis) {
      // Extract the brand name from the user query
      const queryLines = query.split('\n');
      const brandLine = queryLines.find(line => line.startsWith('Brand/Item:'));
      const requestedBrand = brandLine ? brandLine.replace('Brand/Item:', '').trim() : '';
      
      console.log('=== DEBUG: Brand matching ===');
      console.log('Requested brand:', requestedBrand);
      
      // Find the specific brand in our database
      const matchingBrand = brands.find((brand: { name: string }) => 
        brand.name.toLowerCase().includes(requestedBrand.toLowerCase()) ||
        requestedBrand.toLowerCase().includes(brand.name.toLowerCase())
      );

      console.log('Matching brand found:', !!matchingBrand);
      console.log('Matching brand data:', matchingBrand);

      if (matchingBrand) {
        // Analyze the SPECIFIC brand that was requested
        prompt = `You are analyzing the specific brand "${matchingBrand.name}" for a user with this profile:

${query}

IMPORTANT: You must ONLY analyze ${matchingBrand.name}. Do not recommend other brands.

Brand data for ${matchingBrand.name}:
- Category: ${matchingBrand.category}
- Garments: ${matchingBrand.garmentTypes.join(', ')}
- Best for body types: ${matchingBrand.bestForBodyTypes.join(', ')}
- Fit summary: ${matchingBrand.fitSummary}
- Sizing system: ${matchingBrand.sizingSystem} (${matchingBrand.sizeRange})
- Price range: ${matchingBrand.priceRange}
- User quotes: ${matchingBrand.userQuotes}
- Common fit issues: ${matchingBrand.commonFitInfo}
- Fabric stretch: ${matchingBrand.fabricStretch}
- Customer reviews: ${matchingBrand.userFeedback}
- Confidence score: ${matchingBrand.confidenceScore}/5

Provide analysis in this EXACT format:

**Recommendation**
Based on [X] reviews from users similar to you: [percentage]% would recommend ${matchingBrand.name}. [Specific reasons why this brand works/doesn't work for their profile]

**Sizing**
For ${matchingBrand.name}: [Specific sizing advice based on the brand data - should they size up, down, or go true to size for their body/foot type]

**⚠️ Warning**
[Any sizing issues or fit concerns specific to ${matchingBrand.name} for their profile. If none, write "No major concerns for your profile with ${matchingBrand.name}"]

**Price**
${matchingBrand.priceRange || 'Price information not available'}

**Customer Reviews**
[Include 1-2 actual quotes from the userQuotes or userFeedback data, using quotation marks]

Focus ONLY on ${matchingBrand.name}. Do not mention or recommend other brands.`;

      } else {
        // Brand not found in database - provide limited analysis
        console.log('=== DEBUG: Brand not found, using fallback ===');
        prompt = `The user is asking about "${requestedBrand}" but this brand is not in our database.

User request: ${query}

Provide a response in this EXACT format:

**Recommendation**
We don't have detailed sizing data for ${requestedBrand} in our database yet. However, based on general fashion industry standards: [provide general advice]

**Sizing**
For ${requestedBrand}: [General sizing advice - recommend checking size guide, contacting customer service, or looking at reviews]

**⚠️ Warning**
Without specific ${requestedBrand} sizing data, we recommend checking their official size guide and reading customer reviews before purchasing.

**Price**
Check retailer websites for current ${requestedBrand} pricing.

**Customer Reviews**
We don't have customer review data for ${requestedBrand} yet. Check retailer websites and review platforms for customer feedback.

Be honest that you don't have specific data for this brand.`;
      }

    } else {
      // General recommendations (shouldn't happen in analyze route, but just in case)
      prompt = `You are a critical fashion analyst who gives honest, balanced recommendations based on real user data.

User's request: "${query}"

Available brands with real user data:
${brands.slice(0, 15).map((brand: Brand) => `
${brand.name} (${brand.category}):
- Garments: ${brand.garmentTypes.join(', ')}
- Best for body types: ${brand.bestForBodyTypes.join(', ')}
- Fit: ${brand.fitSummary}
- Sizing: ${brand.sizingSystem} (${brand.sizeRange})
- Price: ${brand.priceRange}
- User quotes: ${brand.userQuotes}
- Common fit issues: ${brand.commonFitInfo}
- Fabric stretch: ${brand.fabricStretch}
- Customer reviews: ${brand.userFeedback}
- Product URL: ${brand.productURL}
- Confidence: ${brand.confidenceScore}/5
`).join('\n')}

Format your response with these sections:
**Recommendation**: Your top recommendation and why
**⚠️ Warning**: Any sizing/fit concerns
**Price**: Cost information
**Customer Reviews**: Real quotes from the data in quotation marks
**Avoid if**: Who should avoid this brand and why

Be honest about sizing issues and negative reviews. Keep under 250 words.`;
    }

    console.log('=== DEBUG: About to call OpenAI ===');
    console.log('Prompt length:', prompt.length);
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is missing');
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: isFollowUp 
            ? "You are a helpful fashion expert providing specific answers to follow-up questions. Be conversational and informative."
            : isDetailedAnalysis 
            ? "You are an expert fashion analyst providing comprehensive, personalized brand analysis. Use the EXACT format requested with proper section headers."
            : "You are a critical fashion analyst who prioritizes honest, balanced advice with proper section formatting."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: isFollowUp ? 250 : isDetailedAnalysis ? 500 : 350,
      temperature: 0.6
    });

    console.log('=== DEBUG: OpenAI Response ===');
    console.log('Choices length:', completion.choices?.length || 0);
    console.log('Response preview:', completion.choices[0]?.message?.content?.substring(0, 100));

    const recommendation = completion.choices[0]?.message?.content || 'Sorry, I could not generate a recommendation.';

    console.log('=== DEBUG: Success - returning response ===');
    
    return NextResponse.json({
      query,
      recommendation,
      totalBrands: brands.length
    });

  } catch (error) {
    console.error('=== DEBUG: Error occurred ===');
    console.error('Error details:', error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    
    // Generate a meaningful fallback based on the query
    let fallbackResponse = '';
    
    if (query.includes('Category:') && query.includes('Brand/Item:')) {
      // This is a brand analysis request
      const queryLines = query.split('\n');
      const brandLine = queryLines.find(line => line.startsWith('Brand/Item:'));
      const brandName = brandLine ? brandLine.replace('Brand/Item:', '').trim() : 'this brand';
      
      fallbackResponse = `**Recommendation**
Unable to access our full database right now, but I can provide general guidance for ${brandName}.

**Sizing**
Without specific data, I recommend checking the brand's official size guide and reading customer reviews on retailer websites.

**⚠️ Warning**
Since we can't access detailed sizing data right now, be sure to check the return policy before ordering.

**Price**
Check retailer websites for current pricing and availability.

**Customer Reviews**
Look for customer reviews on the brand's website, ASOS, Net-a-Porter, or other major retailers for the most current feedback.`;
    } else {
      // This is a chat follow-up
      fallbackResponse = `I'm having trouble accessing our full database right now. For the most accurate information about sizing, pricing, and customer reviews, I'd recommend:

• Checking the brand's official website for size guides
• Reading customer reviews on retailer sites
• Contacting the brand's customer service directly
• Looking at social media for real customer photos and feedback

Is there a specific aspect I can help you with using general fashion knowledge?`;
    }
  
    return NextResponse.json({
      query,
      recommendation: fallbackResponse,
      totalBrands: 0,
      error: error instanceof Error ? error.message : String(error),
      debug: true // Flag to indicate this was a fallback response
    });
  }
}