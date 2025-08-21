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
    // Remove enableExternalSearch parameter - we'll decide automatically
    
    console.log('=== DEBUG: Starting recommendation request ===');
    console.log('Query received:', query);
    console.log('OpenAI API Key exists:', !!process.env.OPENAI_API_KEY);
    
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
    
    // AUTOMATIC DECISION: Check if we have sufficient database data
    const hasSufficientData = matchingBrand && 
      matchingBrand.fitSummary && 
      matchingBrand.fitSummary.length > 20 && // Has meaningful fit summary
      (matchingBrand.reviews || matchingBrand.userQuotes); // Has some review data
    
    // Check test flag for external search behavior
    const enableExternalForAll = process.env.ENABLE_EXTERNAL_SEARCH_FOR_ALL_BRANDS === 'true';
    const shouldUseExternal = enableExternalForAll ? !!brandName : (!hasSufficientData && !!brandName);
    
    console.log('=== DEBUG: Data sufficiency check ===');
    console.log('Has sufficient database data:', hasSufficientData);
    console.log('External search for all brands enabled:', enableExternalForAll);
    console.log('Will use external search:', shouldUseExternal);
    
    // AUTOMATICALLY use external search when database data is insufficient OR test flag is enabled
    let externalSearchResults = null;
    let externalSearchAttempted = false;
    let externalSearchError = null;
    
    // Search externally based on test flag or data sufficiency
    if (shouldUseExternal) {
      try {
        console.log(enableExternalForAll 
          ? '=== DEBUG: AUTOMATICALLY attempting external search (test flag enabled) ===' 
          : '=== DEBUG: AUTOMATICALLY attempting external search (insufficient database data) ===');
        externalSearchAttempted = true;
        
        // More robust URL construction for Vercel
        let baseUrl = 'http://localhost:3000';
        if (process.env.VERCEL_URL) {
          baseUrl = `https://${process.env.VERCEL_URL}`;
        } else if (process.env.NEXTAUTH_URL) {
          baseUrl = process.env.NEXTAUTH_URL;
        } else if (typeof window !== 'undefined') {
          baseUrl = window.location.origin;
        }
        
        console.log('=== DEBUG: API fetch details ===');
        console.log('Base URL:', baseUrl);
        console.log('VERCEL_URL:', process.env.VERCEL_URL || 'Not set');
        console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'Not set');
        console.log('NODE_ENV:', process.env.NODE_ENV);
        
        const externalResponse = await fetch(`${baseUrl}/api/extension/search-reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            brand: brandName, 
            itemName: '', // Could extract item name from query if needed
            userInfo: {
              bodyType: query.includes('Body Shape:') ? query.match(/Body Shape:\s*([^\n]+)/)?.[1]?.trim() : '',
              height: query.includes('Height:') ? query.match(/Height:\s*([^\n]+)/)?.[1]?.trim() : '',
              ukClothingSize: query.includes('UK clothing size:') ? query.match(/UK clothing size:\s*([^\n]+)/)?.[1]?.trim() : '',
              ukShoeSize: query.includes('UK shoe size:') ? query.match(/UK shoe size:\s*([^\n]+)/)?.[1]?.trim() : ''
            }
          })
        });
        
        if (externalResponse.ok) {
          externalSearchResults = await externalResponse.json();
          console.log('=== DEBUG: External search successful ===');
          console.log('External results count:', externalSearchResults.totalResults || 0);
          console.log('Has brand fit summary:', !!externalSearchResults.brandFitSummary);
          console.log('Reviews count:', externalSearchResults.reviews?.length || 0);
        } else {
          console.log('=== DEBUG: External search failed ===');
          console.log('Status:', externalResponse.status);
          const errorText = await externalResponse.text();
          console.log('Error response:', errorText);
          externalSearchError = `HTTP ${externalResponse.status}: ${errorText}`;
        }
      } catch (error) {
        console.log('=== DEBUG: External search error ===');
        console.error('External search error:', error);
        externalSearchError = error instanceof Error ? error.message : 'Unknown error';
      }
    } else if (hasSufficientData) {
      console.log('=== DEBUG: Skipping external search - sufficient database data available ===');
    }
    
    // Log external search status
    console.log('=== DEBUG: External search summary ===');
    console.log('Attempted:', externalSearchAttempted);
    console.log('Successful:', !!externalSearchResults);
    console.log('Error:', externalSearchError);
    console.log('Results:', externalSearchResults ? {
      totalResults: externalSearchResults.totalResults || 0,
      hasBrandFitSummary: !!externalSearchResults.brandFitSummary,
      hasReviews: !!(externalSearchResults.reviews && externalSearchResults.reviews.length > 0),
      brandFitSummary: externalSearchResults.brandFitSummary?.summary?.substring(0, 100) + '...' || 'None'
    } : 'None');
    
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
      
      // Handle brand fit summary from search-reviews endpoint
      if (externalSearchResults.brandFitSummary.summary) {
        enhancedContext += `Brand Fit Summary: ${externalSearchResults.brandFitSummary.summary}\n`;
        enhancedContext += `Confidence: ${externalSearchResults.brandFitSummary.confidence}\n`;
        
        // Add sections if available
        if (externalSearchResults.brandFitSummary.sections) {
          const sections = externalSearchResults.brandFitSummary.sections;
          if (sections.fit) enhancedContext += `Fit Details: ${sections.fit}\n`;
          if (sections.quality) enhancedContext += `Quality Details: ${sections.quality}\n`;
          if (sections.fabric) enhancedContext += `Fabric Details: ${sections.fabric}\n`;
          if (sections.sizing) enhancedContext += `Sizing Details: ${sections.sizing}\n`;
        }
      }
      
      // Add results count
      enhancedContext += `Total External Results: ${externalSearchResults.totalResults}\n`;
      
      // Add some key external reviews if available
      if (externalSearchResults.reviews && externalSearchResults.reviews.length > 0) {
        enhancedContext += `\nKey External Reviews:\n`;
        externalSearchResults.reviews.slice(0, 3).forEach((review: { title: string, source: string, snippet: string }, index: number) => {
          enhancedContext += `${index + 1}. ${review.title} (${review.source}): ${review.snippet}\n`;
        });
      }
      
      // Note that we're using web data because database was insufficient
      enhancedContext += `\nNote: Limited database information available, so we searched the web for additional reviews and fit data.\n`;
    } else if (!matchingBrand && !externalSearchResults) {
      // No data at all
      enhancedContext += `\nNote: This brand is not in our database and we couldn't find web reviews. The recommendation below is based on general fashion industry standards.\n`;
    } else if (matchingBrand && !externalSearchAttempted) {
      // Only database data (sufficient)
      enhancedContext += `\nNote: This recommendation is based on our comprehensive database information for this brand.\n`;
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

**IMPORTANT INSTRUCTIONS:**
- If we have good database data, use that as the primary source
- If database data is limited but we have web search results, focus on the web data
- If we have no data at all, be honest about this and suggest checking the brand's official size guide
- Always be encouraging but transparent about data availability
- When data is limited, provide general sizing advice based on the category

Make your response helpful, specific, and actionable. Use bullet points where appropriate.`;
    
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
      hasDatabaseData: !!matchingBrand && hasSufficientData,
      hasExternalData: !!externalSearchResults,
      searchType: (hasSufficientData && externalSearchResults) ? 'hybrid' : 
                 hasSufficientData ? 'database' : 
                 (externalSearchResults ? 'external' : 'fallback'),
      externalSearchResults: externalSearchResults || null,
      externalSearchAttempted: externalSearchAttempted,
      externalSearchError: externalSearchError,
      dataSource: (hasSufficientData && externalSearchResults) ? 'hybrid_data' :
                  hasSufficientData ? 'database' : 
                  (externalSearchResults ? 'web_search' : 'no_data')
    };
    
    console.log('=== DEBUG: Final result created ===');
    console.log('Result type:', enhancedResult.searchType);
    console.log('Data source:', enhancedResult.dataSource);
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