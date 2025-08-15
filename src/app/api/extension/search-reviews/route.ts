import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Category definitions with keywords and patterns
const ANALYSIS_CATEGORIES = {
  fit: {
    keywords: ['true to size', 'runs small', 'runs large', 'size up', 'size down', 'tight', 'loose', 'baggy', 'snug', 'roomy', 'fits', 'sizing'],
    patterns: {
      runsSmall: ['runs small', 'size up', 'tight', 'snug fit', 'order a size up', 'smaller than expected'],
      runsLarge: ['runs large', 'size down', 'loose', 'baggy', 'oversized', 'order a size down', 'bigger than expected'],
      trueToSize: ['true to size', 'fits as expected', 'perfect fit', 'accurate sizing', 'fits perfectly'],
      inconsistent: ['inconsistent', 'varies', 'depends on style', 'different fits', 'some run small some run large']
    }
  },
  washing: {
    keywords: ['wash', 'shrink', 'stretch', 'laundry', 'care', 'machine wash', 'dry clean', 'after washing'],
    patterns: {
      shrinks: ['shrinks', 'shrank', 'got smaller', 'reduced in size', 'shrinkage'],
      holds: ['holds up', 'maintains shape', "doesn't shrink", 'keeps its form', 'washes well'],
      stretches: ['stretches out', 'loses shape', 'gets baggy', 'stretched after wash']
    }
  },
  quality: {
    keywords: ['quality', 'durable', 'last', 'wear', 'pilling', 'fade', 'tear', 'holds up', 'construction', 'stitching'],
    patterns: {
      highQuality: ['high quality', 'durable', 'lasts', 'holds up well', 'well-made', 'excellent quality', 'sturdy'],
      lowQuality: ['poor quality', 'falls apart', 'pilling', 'fades quickly', 'cheap', 'flimsy', 'thin material']
    }
  },
  fabric: {
    keywords: ['cotton', 'polyester', 'wool', 'linen', 'silk', 'blend', 'material', 'fabric', 'rayon', 'viscose', 'spandex'],
    patterns: {
      natural: ['100% cotton', 'pure wool', 'linen', 'silk', 'organic cotton'],
      synthetic: ['polyester', 'nylon', 'acrylic', 'spandex', 'elastane'],
      blend: ['cotton blend', 'wool blend', 'mixed fabric', 'poly blend']
    }
  }
};

// Calculate relevance score for a piece of text
function calculateRelevanceScore(text: string, brandName: string): number {
  let score = 0;
  const lowerText = text.toLowerCase();
  const brandLower = brandName.toLowerCase();
  
  // Check for brand mention (required)
  if (!lowerText.includes(brandLower)) {
    return 0;
  }
  
  // Base score for brand mention
  score += 10;
  
  // Score based on category mentions
  let categoriesFound = 0;
  
  for (const [category, config] of Object.entries(ANALYSIS_CATEGORIES)) {
    const hasKeywords = config.keywords.some(keyword => 
      lowerText.includes(keyword.toLowerCase())
    );
    
    if (hasKeywords) {
      score += 15;
      categoriesFound++;
    }
  }
  
  // Bonus for multiple categories
  if (categoriesFound >= 2) score += 20;
  
  // Check for specific user experience indicators
  const experienceIndicators = [
    /i (bought|purchased|ordered|wear|have)/i,
    /size \d+/i,
    /usually wear|normally a|typical size/i,
    /months? ago|years? ago|weeks? ago/i,
    /returned|kept|exchange/i
  ];
  
  experienceIndicators.forEach(pattern => {
    if (pattern.test(text)) score += 10;
  });
  
  return score;
}

// Extract specific insights from text
function extractInsights(text: string, category: keyof typeof ANALYSIS_CATEGORIES) {
  const insights = {
    mentions: [] as string[],
    patterns: {} as Record<string, number>
  };
  
  const config = ANALYSIS_CATEGORIES[category];
  const lowerText = text.toLowerCase();
  
  // Count pattern occurrences
  for (const [patternName, keywords] of Object.entries(config.patterns)) {
    let count = 0;
    keywords.forEach(keyword => {
      if (lowerText.includes(keyword.toLowerCase())) {
        count++;
        // Extract the sentence containing this keyword
        const sentences = text.split(/[.!?]+/);
        const relevantSentence = sentences.find(s => 
          s.toLowerCase().includes(keyword.toLowerCase())
        );
        if (relevantSentence && relevantSentence.length < 200) {
          insights.mentions.push(relevantSentence.trim());
        }
      }
    });
    if (count > 0) {
      insights.patterns[patternName] = count;
    }
  }
  
  return insights;
}

// Create structured prompt for GPT analysis
function createAnalysisPrompt(brandName: string, relevantContent: Array<{source: string, text: string, score: number}>) {
  const contentText = relevantContent.map(item => 
    `Source: ${item.source}\nContent: ${item.text}\nRelevance Score: ${item.score}`
  ).join('\n\n---\n\n');

  return `
    Analyze the following search results for ${brandName} clothing reviews.
    
    Your task is to extract ONLY explicitly mentioned information about:
    1. Fit (true to size, runs small/large, sizing recommendations)
    2. Washing behavior (shrinking, stretching, care instructions)
    3. Quality over time (durability, pilling, fading)
    4. Fabric composition (materials mentioned)
    
    STRICT RULES:
    - Only include information that is EXPLICITLY stated in the reviews
    - If a category has no relevant mentions, set it to null
    - Require at least 2-3 consistent mentions to establish a pattern
    - Include confidence scores: "high" (5+ mentions), "medium" (3-4 mentions), "low" (1-2 mentions)
    - If the brand name is mentioned but no relevant fit/quality info, mark as "irrelevant"
    
    Return a JSON object with this structure:
    {
      "relevant": true/false,
      "fit": {
        "pattern": "runs_small" | "runs_large" | "true_to_size" | "inconsistent" | null,
        "confidence": "low" | "medium" | "high",
        "evidence": ["quote1", "quote2"],
        "recommendation": "Size up" | "Size down" | "Order your usual size" | null
      },
      "washing": {
        "behavior": "shrinks" | "holds_shape" | "stretches" | null,
        "confidence": "low" | "medium" | "high",
        "evidence": ["quote1", "quote2"]
      },
      "quality": {
        "assessment": "high" | "medium" | "low" | null,
        "confidence": "low" | "medium" | "high",
        "evidence": ["quote1", "quote2"],
        "durability_notes": "specific observations"
      },
      "fabric": {
        "composition": ["material1", "material2"],
        "confidence": "low" | "medium" | "high",
        "evidence": ["quote1"]
      },
      "summary": "2-3 sentence summary of key findings"
    }
    
    Content to analyze:
    ${contentText}
  `;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brand, itemName, category } = body;
    
    console.log('API received request for:', { brand, itemName, category });
    
    if (!brand) {
      return NextResponse.json(
        { error: 'Brand name is required' },
        { status: 400 }
      );
    }

         // Check if we have Serper API key
     const serperApiKey = process.env.SERPER_API_KEY;
     
     if (!serperApiKey) {
       console.error('SERPER_API_KEY not found in environment variables');
       // Return a fallback response instead of erroring
       return NextResponse.json({
         brandFitSummary: {
           summary: `Unable to fetch live reviews for ${brand}. Search API not configured.`,
           confidence: 'low'
         },
         reviews: [],
         groupedReviews: {},
         totalResults: 0,
         isFallback: true,
         error: 'Search API not configured'
       });
     }

    // Construct search queries
    const searchQueries = [
      `${brand} clothing fit review "runs small" OR "runs large" OR "true to size"`,
      `${brand} fashion sizing guide review experience`,
      `${brand} clothes quality washing shrink review`
    ];
    
              interface SerperResult {
       title?: string;
       snippet?: string;
       link?: string;
       displayed_link?: string;
       organic?: SerperResult[];
     }
     
     let allResults: SerperResult[] = [];
    
         // Perform searches using Serper API
     for (const searchQuery of searchQueries) {
       try {
         const serperResponse = await fetch('https://google.serper.dev/search', {
           method: 'POST',
           headers: {
             'X-API-KEY': serperApiKey,
             'Content-Type': 'application/json'
           },
           body: JSON.stringify({
             q: searchQuery,
             gl: 'us',
             num: 10
           })
         });
         
         if (serperResponse.ok) {
           const data = await serperResponse.json();
           if (data.organic) {
             allResults = [...allResults, ...data.organic];
           }
         } else {
           console.error('Serper API error:', serperResponse.status);
         }
       } catch (searchError) {
         console.error('Error performing search:', searchError);
       }
     }
    
         // If no results from Serper API, try a different approach or return fallback
     if (allResults.length === 0) {
       console.log('No results from Serper API, returning fallback');
       return NextResponse.json({
         brandFitSummary: {
           summary: `No reviews found for ${brand}. Try searching for specific items or check back later.`,
           confidence: 'low'
         },
         reviews: [],
         groupedReviews: {},
         totalResults: 0,
         isFallback: true
       });
     }
    
    // Process and score all results
         interface RelevantContent {
       text: string;
       source: string;
       score: number;
       insights: {
         fit: ReturnType<typeof extractInsights>;
         washing: ReturnType<typeof extractInsights>;
         quality: ReturnType<typeof extractInsights>;
         fabric: ReturnType<typeof extractInsights>;
       };
     }

    interface ProcessedReview {
      source: string;
      title: string;
      snippet: string;
      content: string;
      relevanceScore: number;
      tags: string[];
    }

    const relevantContent: RelevantContent[] = [];
    const processedReviews: ProcessedReview[] = [];
    
    for (const result of allResults) {
      const text = `${result.title || ''} ${result.snippet || ''}`;
      const score = calculateRelevanceScore(text, brand);
      
             // Create review object for response
       const review = {
         source: result.link || result.displayed_link || 'Unknown',
         title: result.title || '',
         snippet: result.snippet || '',
         content: text,
         relevanceScore: score,
         tags: score >= 30 ? ['relevant'] : ['not-relevant']
       };
      
      processedReviews.push(review);
      
      if (score >= 30) { // Minimum threshold for relevance
        relevantContent.push({
          text,
          source: result.link || result.displayed_link || 'Unknown',
          score,
          insights: {
            fit: extractInsights(text, 'fit'),
            washing: extractInsights(text, 'washing'),
            quality: extractInsights(text, 'quality'),
            fabric: extractInsights(text, 'fabric')
          }
        });
      }
    }
    
    // Sort by relevance score
    relevantContent.sort((a, b) => b.score - a.score);
    processedReviews.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
         // Generate summary
     const brandFitSummary: {
       summary: string;
       confidence: 'low' | 'medium' | 'high';
     } = {
       summary: `Found ${allResults.length} search results for ${brand}.`,
       confidence: 'low'
     };
     if (relevantContent.length === 0) {
       brandFitSummary.summary = `No relevant sizing or quality information found for ${brand} in ${allResults.length} search results.`;
     } else {
       // Use GPT to analyze if we have relevant content and API key
       if (process.env.OPENAI_API_KEY && relevantContent.length > 0) {
         try {
           const analysisPrompt = createAnalysisPrompt(brand, relevantContent.slice(0, 10));
           
           const completion = await openai.chat.completions.create({
             model: 'gpt-4-turbo-preview',
             messages: [
               {
                 role: 'system',
                 content: 'You are a fashion retail analyst specializing in fit and quality assessment. Analyze reviews and provide structured insights based only on explicit mentions in the text.'
               },
               {
                 role: 'user',
                 content: analysisPrompt
               }
             ],
             response_format: { type: 'json_object' },
             temperature: 0.3,
             max_tokens: 1000
           });
           
           const analysis = JSON.parse(completion.choices[0].message.content || '{}');
           
           if (analysis.summary) {
             brandFitSummary.summary = analysis.summary;
             brandFitSummary.confidence = analysis.fit?.confidence || 'low';
           }
         } catch (gptError) {
           console.error('Error using GPT for analysis:', gptError);
           // Fallback to simple summary
           brandFitSummary.summary = `Found ${relevantContent.length} relevant reviews for ${brand}. Check individual reviews for specific sizing advice.`;
         }
       } else {
         // No GPT API key, provide basic summary
         brandFitSummary.summary = `Found ${relevantContent.length} relevant reviews for ${brand}. Reviews mention fit and quality information.`;
         brandFitSummary.confidence = relevantContent.length >= 5 ? 'medium' as const : 'low' as const;
       }
     }
    
         // Transform reviews to match frontend expectations
     const reviews = processedReviews.map(review => ({
       title: review.title || review.snippet.substring(0, 60) + '...',
       snippet: review.snippet || review.content.substring(0, 200) + '...',
       url: review.source,
       source: new URL(review.source).hostname.replace('www.', ''),
       tags: review.tags,
       confidence: review.relevanceScore >= 50 ? "high" as const : review.relevanceScore >= 30 ? "medium" as const : "low" as const,
       brandLevel: true,
       fullContent: review.content
     }));
     
     // Group reviews by source type (matching frontend expectations)
     const groupedReviews = {
       primary: reviews.filter(r => r.source.includes('reddit') || r.source.includes('substack')),
       community: reviews.filter(r => r.source.includes('forum') || r.source.includes('community')),
       blogs: reviews.filter(r => r.source.includes('blog') || r.source.includes('medium')),
       videos: reviews.filter(r => r.source.includes('youtube') || r.source.includes('video')),
       social: reviews.filter(r => r.source.includes('instagram') || r.source.includes('twitter')),
       publications: reviews.filter(r => r.source.includes('magazine') || r.source.includes('vogue')),
       other: reviews.filter(r => !['reddit', 'substack', 'forum', 'community', 'blog', 'medium', 'youtube', 'video', 'instagram', 'twitter', 'magazine', 'vogue'].some(s => r.source.includes(s)))
     };
    
    // Return response in expected format
    return NextResponse.json({
      brandFitSummary,
      reviews: processedReviews.slice(0, 20), // Return top 20 reviews
      groupedReviews,
      totalResults: allResults.length,
      relevantResults: relevantContent.length,
      isFallback: false,
      metadata: {
        searchQueriesUsed: searchQueries.length,
        analysisDate: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error in search-reviews API:', error);
    
    // Return error response in expected format
    return NextResponse.json({
      brandFitSummary: {
        summary: 'Unable to load reviews due to an error. Please try again.',
        confidence: 'low'
      },
      reviews: [],
      groupedReviews: {},
      totalResults: 0,
      isFallback: true,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}