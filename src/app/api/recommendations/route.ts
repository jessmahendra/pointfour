import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  let query = '';
  let enableExternalSearch = true; // Default to enabled
  
  try {
    const body = await request.json();
    query = body.query;
    enableExternalSearch = body.enableExternalSearch !== false; // Allow disabling
    
    console.log('=== DEBUG: Starting recommendation request ===');
    console.log('Query received:', query);
    console.log('External search enabled:', enableExternalSearch);
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
    
    // Extract brand name from query for external search
    const brandMatch = query.match(/Brand\/Item:\s*([^\n]+)/);
    const brandName = brandMatch ? brandMatch[1].trim() : '';
    
    console.log('=== DEBUG: Extracted brand name ===');
    console.log('Brand name:', brandName);
    
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
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const brands = data.records.map((record: any) => ({
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
    }));
    
    console.log('=== DEBUG: Processed brands ===');
    console.log('Total brands processed:', brands.length);
    console.log('Sample brand names:', brands.slice(0, 5).map((b: Brand) => b.name));
    
    // Find matching brand
    const matchingBrand = brands.find((brand: Brand) => 
      brand.name.toLowerCase().includes(brandName.toLowerCase()) ||
      brandName.toLowerCase().includes(brand.name.toLowerCase())
    );
    
    console.log('=== DEBUG: Brand matching ===');
    console.log('Matching brand found:', !!matchingBrand);
    if (matchingBrand) {
      console.log('Matched brand:', matchingBrand.name);
      console.log('Has fit summary:', !!matchingBrand.fitSummary);
      console.log('Has reviews:', !!matchingBrand.reviews);
    }
    
    // Check if we have sufficient database data
    const hasSufficientData = matchingBrand && 
      (matchingBrand.fitSummary || matchingBrand.reviews || matchingBrand.userQuotes);
    
    console.log('=== DEBUG: Data sufficiency check ===');
    console.log('Has sufficient database data:', hasSufficientData);
    
    // If external search is enabled and database data is insufficient, try external search
    let externalSearchResults = null;
    if (enableExternalSearch && brandName && (!hasSufficientData || !matchingBrand?.fitSummary)) {
      try {
        console.log('=== DEBUG: Attempting external search ===');
        const externalResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/external-search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            brand: brandName, 
            itemName: '', // Could extract item name from query if needed
            userId: 'anonymous' // In production, get from auth
          })
        });
        
        if (externalResponse.ok) {
          externalSearchResults = await externalResponse.json();
          console.log('=== DEBUG: External search successful ===');
          console.log('External results count:', externalSearchResults.totalResults);
          console.log('Has brand fit summary:', !!externalSearchResults.brandFitSummary);
        } else {
          console.log('=== DEBUG: External search failed ===');
          console.log('Status:', externalResponse.status);
        }
      } catch (error) {
        console.log('=== DEBUG: External search error ===');
        console.error('External search error:', error);
      }
    }
    
    // Create enhanced context for AI
    let enhancedContext = '';
    
    if (matchingBrand) {
      enhancedContext += `Brand: ${matchingBrand.name}\n`;
      enhancedContext += `Category: ${matchingBrand.category}\n`;
      if (matchingBrand.fitSummary) enhancedContext += `Fit Summary: ${matchingBrand.fitSummary}\n`;
      if (matchingBrand.bestForBodyTypes.length > 0) enhancedContext += `Best For Body Types: ${matchingBrand.bestForBodyTypes.join(', ')}\n`;
      if (matchingBrand.sizeRange) enhancedContext += `Size Range: ${matchingBrand.sizeRange}\n`;
      if (matchingBrand.sizingSystem) enhancedContext += `Sizing System: ${matchingBrand.sizingSystem}\n`;
      if (matchingBrand.priceRange) enhancedContext += `Price Range: ${matchingBrand.priceRange}\n`;
      if (matchingBrand.userQuotes) enhancedContext += `User Quotes: ${matchingBrand.userQuotes}\n`;
      if (matchingBrand.reviews) enhancedContext += `Reviews: ${matchingBrand.reviews}\n`;
      if (matchingBrand.commonFitInfo) enhancedContext += `Common Fit Info: ${matchingBrand.commonFitInfo}\n`;
      if (matchingBrand.fabricStretch) enhancedContext += `Fabric Stretch: ${matchingBrand.fabricStretch}\n`;
      if (matchingBrand.userFeedback) enhancedContext += `User Feedback: ${matchingBrand.userFeedback}\n`;
    }
    
    // Add external search results to context if available
    if (externalSearchResults && externalSearchResults.brandFitSummary) {
      enhancedContext += `\nExternal Search Results:\n`;
      enhancedContext += `Brand Fit Summary: ${externalSearchResults.brandFitSummary.summary}\n`;
      enhancedContext += `Confidence: ${externalSearchResults.brandFitSummary.confidence}\n`;
      enhancedContext += `Sources: ${externalSearchResults.brandFitSummary.sources.join(', ')}\n`;
      enhancedContext += `Total External Results: ${externalSearchResults.totalResults}\n`;
      
      // Add some key external reviews
      if (externalSearchResults.reviews && externalSearchResults.reviews.length > 0) {
        enhancedContext += `\nKey External Reviews:\n`;
        externalSearchResults.reviews.slice(0, 3).forEach((review: { title: string, source: string, snippet: string }, index: number) => {
          enhancedContext += `${index + 1}. ${review.title} (${review.source}): ${review.snippet}\n`;
        });
      }
    }
    
    console.log('=== DEBUG: Enhanced context created ===');
    console.log('Context length:', enhancedContext.length);
    console.log('Has external data:', !!externalSearchResults);
    
    // Create the AI prompt with enhanced context
    const aiPrompt = `You are a fashion expert helping users find the right fit for clothing and footwear brands. 

${enhancedContext ? `Here's what I know about the brand:\n${enhancedContext}\n` : ''}

User Query: ${query}

Please provide a comprehensive analysis including:

**Recommendation**: Clear sizing advice and fit recommendations based on the user's profile
**Summary**: Brief overview of the brand's fit characteristics
**Sizing**: Specific sizing guidance (runs small/large, true to size, etc.)
**Warnings**: Any important fit or quality considerations
**Price**: Price range information if available
**Customer Reviews**: Include relevant user feedback and quotes

If you have external search results, incorporate them to provide more comprehensive advice. If the brand isn't in our database but we have external results, focus on those insights.

Make your response helpful, specific, and actionable. Use bullet points where appropriate and be encouraging but honest about any limitations in the data.`;
    
    console.log('=== DEBUG: AI prompt created ===');
    console.log('Prompt length:', aiPrompt.length);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful fashion expert who provides detailed, accurate sizing and fit advice based on available data. Always be encouraging but honest about data limitations."
        },
        {
          role: "user",
          content: aiPrompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });
    
    const aiResponse = completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
    
    console.log('=== DEBUG: AI response received ===');
    console.log('Response length:', aiResponse.length);
    
    // Create enhanced result with external search data
    const enhancedResult = {
      recommendation: aiResponse,
      query: query,
      totalBrands: brands.length,
      hasDatabaseData: !!matchingBrand,
      hasExternalData: !!externalSearchResults,
      searchType: externalSearchResults ? 'hybrid' : 'database',
      externalSearchResults: externalSearchResults || null
    };
    
    console.log('=== DEBUG: Final result created ===');
    console.log('Result type:', enhancedResult.searchType);
    console.log('Has external data:', enhancedResult.hasExternalData);
    
    return NextResponse.json(enhancedResult);
    
  } catch (error) {
    console.error('=== DEBUG: Error occurred ===');
    console.error('Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process recommendation request',
        details: error instanceof Error ? error.message : 'Unknown error',
        recommendation: "Sorry, I couldn't process your request. Please try again or check if the brand name is correct."
      },
      { status: 500 }
    );
  }
}