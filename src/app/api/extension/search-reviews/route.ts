import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface SerperResult {
  title?: string;
  snippet?: string;
  link?: string;
  displayed_link?: string;
}

interface Review {
  title: string;
  snippet: string;
  url: string;
  source: string;
  tags: string[];
  confidence: "high" | "medium" | "low";
  brandLevel: boolean;
  fullContent: string;
}

interface AnalysisResult {
  fit?: {
    recommendation: string;
    confidence: 'low' | 'medium' | 'high';
    evidence: string[];
  };
  quality?: {
    recommendation: string;
    confidence: 'low' | 'medium' | 'high';
    evidence: string[];
  };
  fabric?: {
    recommendation: string;
    confidence: 'low' | 'medium' | 'high';
    evidence: string[];
  };
  washCare?: {
    recommendation: string;
    confidence: 'low' | 'medium' | 'high';
    evidence: string[];
  };
  materials?: {
    composition: string[];
    confidence: 'low' | 'medium' | 'high';
    evidence: string[];
  };
  overallConfidence?: 'low' | 'medium' | 'high';
}

// Product category detection
function detectProductCategory(brand: string, itemName: string = ''): 'clothing' | 'bags' | 'shoes' | 'accessories' | 'general' {
  const text = `${brand} ${itemName}`.toLowerCase();
  
  // Bag indicators
  if (text.includes('bag') || text.includes('handbag') || text.includes('purse') || text.includes('wallet') || 
      text.includes('backpack') || text.includes('tote') || text.includes('clutch') || text.includes('crossbody') ||
      text.includes('satchel') || text.includes('messenger') || text.includes('briefcase')) {
    return 'bags';
  }
  
  // Shoe indicators
  if (text.includes('shoe') || text.includes('boot') || text.includes('sneaker') || text.includes('heel') ||
      text.includes('sandal') || text.includes('loafer') || text.includes('oxford') || text.includes('footwear')) {
    return 'shoes';
  }
  
  // Accessory indicators
  if (text.includes('jewelry') || text.includes('watch') || text.includes('belt') || text.includes('scarf') ||
      text.includes('sunglasses') || text.includes('hat') || text.includes('gloves') || text.includes('earring') ||
      text.includes('necklace') || text.includes('bracelet') || text.includes('ring')) {
    return 'accessories';
  }
  
  // Clothing indicators (or default)
  if (text.includes('dress') || text.includes('shirt') || text.includes('pants') || text.includes('jacket') ||
      text.includes('sweater') || text.includes('blouse') || text.includes('skirt') || text.includes('jeans') ||
      text.includes('coat') || text.includes('top') || text.includes('clothing') || text.includes('apparel') ||
      text.includes('tee') || text.includes('t-shirt') || text.includes('cotton') || text.includes('silk') ||
      text.includes('denim') || text.includes('knit') || text.includes('fabric') || text.includes('garment')) {
    return 'clothing';
  }
  
  // Known shoe brands that don't have obvious category indicators in their name
  const shoeBrands = [
    'norda', 'hoka', 'salomon', 'merrell', 'altra', 'topo', 'la sportiva',
    'scarpa', 'mammut', 'dynafit', 'tecnica', 'arc\'teryx', 'patagonia',
    'black diamond', 'petzl', 'mammut', 'rab', 'montane', 'haglofs',
    'on', 'on running', 'allbirds', 'veja', 'golden goose', 'common projects'
  ];
  
  // Known clothing/fashion brands that don't have obvious category indicators in their name
  const clothingBrands = [
    'proche', 'celine', 'ganni', 'staud', 'reformation', 'nanushka', 'toteme',
    'arket', 'cos', 'acne', 'mansur gavriel', 'khaite', 'lemaire', 'jacquemus',
    'marine serre', 'gauchere', 'cecilie bahnsen', 'simone rocha', 'rejina pyo'
  ];
  
  const brandLower = brand.toLowerCase().trim();
  if (shoeBrands.includes(brandLower)) {
    return 'shoes';
  }
  if (clothingBrands.includes(brandLower)) {
    return 'clothing';
  }
  
  return 'general';
}

// Detect if user is searching for a specific item rather than just a brand
function detectSpecificItemSearch(brand: string, itemName: string = ''): boolean {
  const text = `${brand} ${itemName}`.toLowerCase();
  
  // Look for specific item descriptors that suggest the user is looking for a particular product
  const specificItemIndicators = [
    // Material descriptors
    'wool', 'cotton', 'silk', 'linen', 'cashmere', 'merino', 'organic cotton',
    'polyester', 'nylon', 'spandex', 'modal', 'tencel', 'bamboo',
    
    // Specific garment types with descriptors
    't-shirt', 'tshirt', 'tee shirt', 'button down', 'button-down',
    'crew neck', 'v-neck', 'tank top', 'long sleeve', 'short sleeve',
    'midi dress', 'maxi dress', 'mini dress', 'wrap dress',
    'skinny jeans', 'straight leg', 'wide leg', 'high waist',
    'cropped pants', 'straight pants', 'palazzo pants',
    'cardigan', 'pullover', 'hoodie', 'zip-up',
    'blazer', 'trench coat', 'puffer jacket', 'bomber jacket',
    
    // Colors and patterns
    'black', 'white', 'navy', 'striped', 'polka dot', 'floral',
    'plaid', 'checkered', 'solid color',
    
    // Style descriptors
    'oversized', 'fitted', 'loose', 'tight', 'relaxed', 'tailored',
    'vintage', 'classic', 'modern', 'minimalist',
    
    // Specific product names or collections
    'frames', 'perfect tee', 'essential', 'basic', 'staple'
  ];
  
  // Check if the search contains specific item descriptors
  const hasSpecificDescriptors = specificItemIndicators.some(indicator => 
    text.includes(indicator)
  );
  
  // Also check if itemName has substantial content (more than just the brand name)
  const hasSubstantialItemName = itemName.length > 0 && 
    itemName.toLowerCase() !== brand.toLowerCase() &&
    itemName.split(' ').length > 1;
  
  return hasSpecificDescriptors || hasSubstantialItemName;
}

function generateSearchQueries(brand: string, category: 'clothing' | 'bags' | 'shoes' | 'accessories' | 'general', itemName: string = '', isSpecificItem: boolean = false): string[] {
  // Base queries for each category
  const baseQueries = (() => {
    switch (category) {
      case 'bags':
        return [
          `${brand} bag review quality "well made" OR "poorly made" OR "durable"`,
          `${brand} handbag quality leather material construction review`,
          `${brand} bag "holds up" OR "falling apart" OR "worth it" review`
        ];
      
      case 'shoes':
        return [
          `${brand} shoes fit review "runs small" OR "runs large" OR "true to size"`,
          `${brand} shoe quality comfort "uncomfortable" OR "comfortable" review`,
          `${brand} footwear durability "lasted" OR "wore out" review`
        ];
      
      case 'accessories':
        return [
          `${brand} accessory quality review "well made" OR "cheap" OR "durable"`,
          `${brand} jewelry watch quality "tarnish" OR "scratches" OR "holds up"`,
          `${brand} accessory "worth it" OR "overpriced" review`
        ];
      
      case 'clothing':
      default:
        return [
          `${brand} clothing fit review "runs small" OR "runs large" OR "true to size"`,
          `${brand} fashion quality fabric review`,
          `${brand} washing shrink care instructions`
        ];
    }
  })();

  // If this is a specific item search, add material-focused queries
  if (isSpecificItem && itemName) {
    const materialQueries = [
      `"${brand} ${itemName}" material fabric composition`,
      `"${brand} ${itemName}" "100%" OR "cotton" OR "wool" OR "silk" OR "polyester" OR "blend"`,
      `"${brand} ${itemName}" review material quality fabric feel`
    ];
    
    // For clothing items, add more specific material queries
    if (category === 'clothing') {
      materialQueries.push(
        `"${brand} ${itemName}" "merino wool" OR "organic cotton" OR "cashmere" OR "linen"`,
        `"${brand} ${itemName}" care instructions washing fabric content`
      );
    }
    
    return [...materialQueries, ...baseQueries];
  }
  
  return baseQueries;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brand } = body;
    
    if (!brand) {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });
    }

    // Validate that this is a fashion brand, not a tech/general company
    const nonFashionBrands = [
      // Tech companies
      'google', 'microsoft', 'apple', 'amazon', 'facebook', 'meta', 'twitter', 'x',
      'youtube', 'linkedin', 'instagram', 'tiktok', 'snapchat', 'pinterest',
      'netflix', 'spotify', 'uber', 'lyft', 'airbnb', 'tesla', 'boeing',
      
      // Automotive
      'ford', 'gm', 'toyota', 'honda', 'bmw', 'mercedes', 'audi',
      
      // Retail (general)
      'walmart', 'target', 'costco', 'home depot', 'lowes', 'cvs', 'walgreens',
      
      // Food & beverage
      'mcdonalds', 'burger king', 'kfc', 'subway', 'starbucks', 'dunkin',
      
      // Financial services
      'visa', 'mastercard', 'paypal', 'stripe', 'square',
      
      // Platforms and communities
      'reddit', 'github', 'stackoverflow', 'wikipedia', 'twitch',
      
      // Home goods and interior design
      'nordic nest', 'nordicnest', 'ikea', 'west elm', 'pottery barn', 'crate and barrel',
      'cb2', 'williams sonoma', 'restoration hardware', 'anthropologie home',
      'wayfair', 'overstock', 'bed bath beyond', 'pier 1', 'homegoods',
      'world market', 'ballard designs', 'serena lily', 'one kings lane',
      'chairish', 'article', 'floyd', 'burrow', 'casper', 'purple',
      
      // Beauty and cosmetics (different from fashion)
      'sephora', 'ulta', 'sally beauty', 'cvs beauty', 'walgreens beauty',
      
      // Sports equipment and fitness
      'nike sports', 'adidas sports', 'under armour sports', 'lululemon sports',
      'peloton', 'nordictrack', 'bowflex', 'schwinn',
      
      // Electronics and appliances
      'best buy', 'circuit city', 'radio shack', 'frys electronics'
    ];

    const brandLower = brand.toLowerCase().trim();
    if (nonFashionBrands.includes(brandLower)) {
      return NextResponse.json({
        error: 'Brand not supported',
        message: `${brand} is not a fashion or apparel brand. Our analysis is designed for clothing, footwear, and fashion accessories brands only.`,
        brandFitSummary: {
          summary: `${brand} is not a fashion brand.`,
          confidence: 'none',
          sections: {},
          hasData: false,
          totalResults: 0,
          sources: []
        }
      }, { status: 400 });
    }

    const serperApiKey = process.env.SERPER_API_KEY;
    
    if (!serperApiKey) {
      return NextResponse.json({
        brandFitSummary: {
          summary: `Search API not configured. Add SERPER_API_KEY to environment.`,
          confidence: 'low',
          sections: {}
        },
        reviews: [],
        groupedReviews: {
          primary: [],
          community: [],
          blogs: [],
          videos: [],
          social: [],
          publications: [],
          other: []
        },
        totalResults: 0
      });
    }

    // Detect product category and check if this is a specific item search
    const itemName = body.productName || body.itemName || body.productType || '';
    const productCategory = detectProductCategory(brand, itemName);
    const isSpecificItemSearch = detectSpecificItemSearch(brand, itemName);
    
    // Handle URL extraction data from browser extension
    const urlExtraction = body.urlExtraction;
    console.log('🔗 API: URL extraction data received:', urlExtraction);
    
    // If we have URL extraction data, use it to enhance our search
    let enhancedBrand = brand;
    let enhancedItemName = itemName;
    let extractionConfidence = 'low';
    
    if (urlExtraction) {
      if (urlExtraction.brand && urlExtraction.confidence === 'high') {
        enhancedBrand = urlExtraction.brand;
        console.log('🔗 API: Using URL-extracted brand:', enhancedBrand);
      }
      
      if (urlExtraction.itemName) {
        enhancedItemName = urlExtraction.itemName;
        extractionConfidence = urlExtraction.confidence || 'medium';
        console.log('🔗 API: Using URL-extracted item name:', enhancedItemName);
      }
    }
    
    // Search for reviews with category-appropriate queries using enhanced data
    const finalIsSpecificItem = isSpecificItemSearch || (urlExtraction && urlExtraction.itemName);
    const searchQueries = generateSearchQueries(enhancedBrand, productCategory, enhancedItemName, finalIsSpecificItem);
    
    console.log('🔍 API: Enhanced search parameters:', {
      originalBrand: brand,
      enhancedBrand,
      originalItemName: itemName,
      enhancedItemName,
      isSpecificItem: finalIsSpecificItem,
      extractionConfidence
    });
    
    let allResults: SerperResult[] = [];
    
    console.log('🔍 SERPER: Starting search for brand:', brand);
    console.log('🔍 SERPER: Search queries:', searchQueries);
    
    for (const query of searchQueries) {
      try {
        console.log('🔍 SERPER: Executing query:', query);
        
        const response = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ q: query, gl: 'us', num: 10 })
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ SERPER: Query response for:', query.substring(0, 50) + '...', {
            organicResults: data.organic?.length || 0,
            totalResults: data.searchParameters?.q || 'N/A'
          });
          
          if (data.organic) {
            console.log('📄 SERPER: First few results for query:');
            data.organic.slice(0, 3).forEach((result: SerperResult, index: number) => {
              console.log(`  ${index + 1}. ${result.title}`);
              console.log(`     Snippet: ${result.snippet?.substring(0, 100)}...`);
            });
            
            allResults = [...allResults, ...data.organic];
          }
        } else {
          console.error('❌ SERPER: Failed query:', query, 'Status:', response.status);
        }
      } catch (error) {
        console.error('❌ SERPER: Search error for query:', query, error);
      }
    }
    
    console.log('📊 SERPER: Total results collected:', allResults.length);
    
    // Analyze results for patterns based on product category using enhanced data
    const analysis = await analyzeResultsWithGPT5(allResults, enhancedBrand, productCategory, enhancedItemName, finalIsSpecificItem);
    
    // Create structured sections
    const sections: Record<string, {
      title: string;
      recommendation: string;
      confidence: 'low' | 'medium' | 'high';
      evidence: string[];
    }> = {};
    
    if (analysis.fit) {
      sections.fit = {
        title: 'Fit',
        recommendation: analysis.fit.recommendation,
        confidence: analysis.fit.confidence,
        evidence: analysis.fit.evidence
      };
    }
    
    // Combine quality, fabric, and materials into a single "Quality & Materials" section
    if (analysis.quality || analysis.fabric || analysis.materials) {
      let qualityMaterialsRecommendation = '';
      // eslint-disable-next-line prefer-const
      let qualityMaterialsEvidence: string[] = [];
      let qualityMaterialsConfidence: 'low' | 'medium' | 'high' = 'low';
      
      // Start with materials if available
      if (analysis.materials && analysis.materials.composition.length > 0) {
        const cleanMaterials = analysis.materials.composition.join(', ');
        qualityMaterialsRecommendation = `Materials: ${cleanMaterials}\n\n`;
        qualityMaterialsEvidence.push(...analysis.materials.evidence);
        qualityMaterialsConfidence = analysis.materials.confidence;
      }
      
      // Add quality information
      if (analysis.quality) {
        if (qualityMaterialsRecommendation) {
          qualityMaterialsRecommendation += `Quality: ${analysis.quality.recommendation}`;
        } else {
          qualityMaterialsRecommendation = analysis.quality.recommendation;
        }
        qualityMaterialsEvidence.push(...analysis.quality.evidence);
        
        // Use highest confidence
        if (analysis.quality.confidence === 'high' || qualityMaterialsConfidence !== 'high') {
          qualityMaterialsConfidence = analysis.quality.confidence;
        }
      }
      
      // Add fabric information if no quality info
      if (analysis.fabric && !analysis.quality) {
        if (qualityMaterialsRecommendation) {
          qualityMaterialsRecommendation += `Fabric: ${analysis.fabric.recommendation}`;
        } else {
          qualityMaterialsRecommendation = analysis.fabric.recommendation;
        }
        qualityMaterialsEvidence.push(...analysis.fabric.evidence);
        
        if (analysis.fabric.confidence === 'high' || qualityMaterialsConfidence !== 'high') {
          qualityMaterialsConfidence = analysis.fabric.confidence;
        }
      }
      
      sections.qualityMaterials = {
        title: 'Quality & Materials',
        recommendation: qualityMaterialsRecommendation,
        confidence: qualityMaterialsConfidence,
        evidence: [...new Set(qualityMaterialsEvidence)].slice(0, 3) // Remove duplicates, limit to 3
      };
    }
    
    if (analysis.washCare) {
      sections.washCare = {
        title: 'Wash & Care',
        recommendation: analysis.washCare.recommendation,
        confidence: analysis.washCare.confidence,
        evidence: analysis.washCare.evidence
      };
    }
    
    // Create detailed summary based on analysis
    const summary = generateDetailedSummary(analysis, allResults, brand, productCategory);
    
    // Helper function to convert SerperResult to Review format
    const convertToReview = (result: SerperResult): Review => {
      const source = extractSourceName(result.link || '');
      const tags = extractTags(result.title, result.snippet);
      const confidence = calculateConfidence(result);
      
      return {
        title: result.title || 'Untitled Review',
        snippet: result.snippet || '',
        url: result.link || '',
        source: source,
        tags: tags,
        confidence: confidence,
        brandLevel: false,
        fullContent: result.snippet || ''
      };
    };
    
    // Convert all results to Review format
    const formattedReviews = allResults.map(convertToReview);
    
    // Group reviews by source type with proper Review structure
    const groupedReviews = {
      primary: formattedReviews.filter(r => r.url.includes('reddit') || r.url.includes('substack')),
      community: formattedReviews.filter(r => r.url.includes('forum') || r.url.includes('community')),
      blogs: formattedReviews.filter(r => r.url.includes('blog') || r.url.includes('medium')),
      videos: formattedReviews.filter(r => r.url.includes('youtube') || r.url.includes('video')),
      social: formattedReviews.filter(r => r.url.includes('instagram') || r.url.includes('twitter')),
      publications: formattedReviews.filter(r => r.url.includes('magazine') || r.url.includes('vogue')),
      other: formattedReviews.filter(r => 
        !['reddit', 'substack', 'forum', 'community', 'blog', 'medium', 'youtube', 'video', 'instagram', 'twitter', 'magazine', 'vogue']
          .some(s => r.url.includes(s))
      )
    };

    return NextResponse.json({
      brandFitSummary: {
        summary,
        confidence: analysis.overallConfidence || 'low',
        sections,
        hasData: Object.keys(sections).length > 0,
        totalResults: allResults.length,
        sources: []
      },
      reviews: formattedReviews.slice(0, 20),
      groupedReviews,
      totalResults: allResults.length
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({
      brandFitSummary: {
        summary: 'Error loading reviews',
        confidence: 'low',
        sections: {},
        totalResults: 0,
        sources: []
      },
      reviews: [],
      groupedReviews: {
        primary: [],
        community: [],
        blogs: [],
        videos: [],
        social: [],
        publications: [],
        other: []
      },
      totalResults: 0
    });
  }
}

// Helper function to extract source name from URL
function extractSourceName(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // Remove www. and .com/.org etc
    let source = hostname.replace(/^www\./, '').split('.')[0];
    
    // Capitalize first letter
    source = source.charAt(0).toUpperCase() + source.slice(1);
    
    return source;
  } catch {
    return 'Unknown Source';
  }
}

// Helper function to extract tags from title and snippet
function extractTags(title?: string, snippet?: string): string[] {
  const tags: string[] = [];
  const text = `${title || ''} ${snippet || ''}`.toLowerCase();
  
  // Check for fit-related tags
  if (text.includes('runs small') || text.includes('size up')) tags.push('runs-small');
  if (text.includes('runs large') || text.includes('size down')) tags.push('runs-large');
  if (text.includes('true to size')) tags.push('true-to-size');
  
  // Check for quality-related tags
  if (text.includes('high quality') || text.includes('excellent')) tags.push('high-quality');
  if (text.includes('poor quality') || text.includes('cheap')) tags.push('low-quality');
  
  // Check for material tags
  if (text.includes('cotton')) tags.push('cotton');
  if (text.includes('polyester')) tags.push('polyester');
  if (text.includes('wool')) tags.push('wool');
  if (text.includes('sustainable')) tags.push('sustainable');
  
  // Check for care tags
  if (text.includes('shrink')) tags.push('may-shrink');
  if (text.includes('wash')) tags.push('care-instructions');
  
  // If no tags found, add a default
  if (tags.length === 0) {
    tags.push('general-review');
  }
  
  return tags;
}

// Helper function to calculate confidence based on result relevance
function calculateConfidence(result: SerperResult): "high" | "medium" | "low" {
  const text = `${result.title || ''} ${result.snippet || ''}`.toLowerCase();
  let score = 0;
  
  // Check for specific fit mentions
  if (text.includes('runs small') || text.includes('runs large') || text.includes('true to size')) {
    score += 2;
  }
  
  // Check for quality mentions
  if (text.includes('quality') || text.includes('fabric') || text.includes('material')) {
    score += 1;
  }
  
  // Check for detailed review indicators
  if (text.includes('review') || text.includes('tried') || text.includes('bought')) {
    score += 1;
  }
  
  // Return confidence based on score
  if (score >= 3) return 'high';
  if (score >= 1) return 'medium';
  return 'low';
}

// GPT-5 powered analysis function
async function analyzeResultsWithGPT5(results: SerperResult[], brand: string, category: 'clothing' | 'bags' | 'shoes' | 'accessories' | 'general' = 'general', itemName: string = '', isSpecificItem: boolean = false): Promise<AnalysisResult> {
  console.log(`🤖 GPT-5 ANALYSIS: Starting AI analysis for ${brand} with ${results.length} results`);
  
  if (results.length === 0) {
    return {};
  }
  
  // Prepare review data for GPT-5
  const reviewTexts = results.map((result, index) => {
    const source = extractSourceName(result.link || '');
    return `Review ${index + 1} (${source}): ${result.title || ''} - ${result.snippet || ''}`;
  }).join('\n\n');
  
  const itemContext = isSpecificItem && itemName ? 
    `\nFocus specifically on reviews about the "${itemName}" item from ${brand}.` : 
    `\nAnalyze reviews about ${brand} products in general.`;
  
  const categoryContext = category !== 'general' ? 
    `\nThis is a ${category} brand, so focus on ${category}-specific aspects.` : '';
  
  const prompt = `You are a fashion expert analyzing customer reviews to provide structured insights. Analyze the following reviews and provide a JSON response with specific sections.

Brand: ${brand}
Category: ${category}${itemContext}${categoryContext}

Reviews to analyze:
${reviewTexts}

Please analyze these reviews and return a JSON object with the following structure:
{
  "fit": {
    "recommendation": "Clear, specific fit advice based on the reviews (e.g., 'runs small, size up' or 'true to size')",
    "confidence": "low|medium|high",
    "evidence": ["Direct quotes from reviews supporting this assessment"]
  },
  "quality": {
    "recommendation": "Quality assessment based on customer feedback",
    "confidence": "low|medium|high", 
    "evidence": ["Direct quotes about quality"]
  },
  "materials": {
    "composition": ["List of materials mentioned (e.g., '100% cotton', 'merino wool')"],
    "confidence": "low|medium|high",
    "evidence": ["Quotes mentioning materials or fabric"]
  },
  "washCare": {
    "recommendation": "Washing and care advice based on customer experiences",
    "confidence": "low|medium|high",
    "evidence": ["Quotes about washing, care, durability"]
  },
  "overallConfidence": "low|medium|high"
}

IMPORTANT GUIDELINES:
- Only include sections where you have actual evidence from the reviews
- Use direct quotes from reviews as evidence 
- Be specific and actionable in recommendations
- Set confidence based on amount and consistency of evidence
- For materials, extract specific compositions like "100% cotton" or "merino wool"
- Focus on customer experiences, not brand descriptions
- If analyzing a specific item, filter out reviews about other products from the same brand
- Return valid JSON only, no other text`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a fashion expert who analyzes customer reviews to provide structured insights. Always return valid JSON and be specific and actionable in your analysis."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.3,
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      console.log('🤖 GPT-5 ANALYSIS: No response from GPT-5');
      return {};
    }

    // Parse JSON response - strip markdown code blocks if present
    try {
      let cleanResponse = aiResponse.trim();
      
      // Remove markdown code blocks if present
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const analysisResult = JSON.parse(cleanResponse);
      console.log('🤖 GPT-5 ANALYSIS: Successfully parsed AI analysis');
      console.log('🤖 GPT-5 ANALYSIS: Sections found:', Object.keys(analysisResult));
      return analysisResult;
    } catch (parseError) {
      console.error('🤖 GPT-5 ANALYSIS: Failed to parse JSON response:', parseError);
      console.log('🤖 GPT-5 ANALYSIS: Raw response:', aiResponse.substring(0, 500));
      
      // Fallback to rule-based analysis
      console.log('🤖 GPT-5 ANALYSIS: Falling back to rule-based analysis');
      return analyzeResultsRuleBased(results, brand, category, itemName, isSpecificItem);
    }
  } catch (error) {
    console.error('🤖 GPT-5 ANALYSIS: Error calling GPT-5:', error);
    // Fallback to rule-based analysis
    console.log('🤖 GPT-5 ANALYSIS: Falling back to rule-based analysis');
    return analyzeResultsRuleBased(results, brand, category, itemName, isSpecificItem);
  }
}

// Renamed original function as fallback
function analyzeResultsRuleBased(results: SerperResult[], brand: string, category: 'clothing' | 'bags' | 'shoes' | 'accessories' | 'general' = 'general', itemName: string = '', isSpecificItem: boolean = false): AnalysisResult {
  const analysis: AnalysisResult = {};
  const allText = results.map(r => `${r.title} ${r.snippet}`).join(' ').toLowerCase();
  
  console.log(`🔍 ANALYSIS: Starting analysis for ${brand} with ${results.length} results`);
  console.log(`🔍 ANALYSIS: Combined text sample (first 300 chars):`, allText.substring(0, 300) + '...');
  console.log(`🔍 ANALYSIS: Full text length:`, allText.length, 'characters');
  
  // Analyze fit only for relevant categories
  if (category === 'clothing' || category === 'shoes') {
    const fitPatterns = category === 'shoes' 
      ? {
          runsSmall: (allText.match(/runs small|size up|tight|narrow|small fit/g) || []).length,
          runsLarge: (allText.match(/runs large|size down|loose|wide|big fit/g) || []).length,
          trueToSize: (allText.match(/true to size|fits perfectly|accurate sizing|perfect fit/g) || []).length
        }
      : {
          runsSmall: (allText.match(/runs small|size up|tight|snug/g) || []).length,
          runsLarge: (allText.match(/runs large|size down|loose|baggy/g) || []).length,
          trueToSize: (allText.match(/true to size|fits perfectly|accurate sizing/g) || []).length
        };
    
    const dominantFit = Object.entries(fitPatterns).sort((a, b) => b[1] - a[1])[0];
    
    if (dominantFit[1] > 0) {
      // Extract actual quotes from reviews instead of using templates
      const fitEvidence = extractEvidence(results, dominantFit[0]);
      
      // ONLY generate fit analysis if we have actual evidence from reviews
      if (fitEvidence.length === 0) {
        console.log(`🔍 ANALYSIS: No fit evidence found in reviews despite ${dominantFit[1]} pattern matches, skipping fit analysis`);
      } else {
        // Get source information for authenticity
        const fitSources = extractSourcesFromEvidence(results, fitEvidence);
        const sourceText = fitSources.length > 0 ? ` (sources: ${fitSources.join(', ')})` : '';
        
        const productType = category === 'shoes' ? 'shoes' : 'items';
        
        let recommendation = '';
        if (dominantFit[0] === 'runsSmall') {
          const exampleQuote = fitEvidence[0].substring(0, 120) + '...';
          recommendation = `Reviews indicate ${brand} ${productType} tend to run small${sourceText}. Customer review: "${exampleQuote}" Consider sizing up.`;
        } else if (dominantFit[0] === 'runsLarge') {
          const exampleQuote = fitEvidence[0].substring(0, 120) + '...';
          recommendation = `Reviews suggest ${brand} ${productType} run large${sourceText}. Customer review: "${exampleQuote}" Consider sizing down.`;
        } else {
          const exampleQuote = fitEvidence[0].substring(0, 120) + '...';
          recommendation = `Reviews indicate ${brand} ${productType} are true-to-size${sourceText}. Customer review: "${exampleQuote}" Order your usual size.`;
        }
        
        analysis.fit = {
          recommendation,
          confidence: dominantFit[1] >= 3 ? 'high' : dominantFit[1] >= 2 ? 'medium' : 'low',
          evidence: fitEvidence
        };
      }
    }
  }
  
  // Analyze quality with enhanced pattern matching for better detection
  const qualityPositive = (allText.match(/high quality|durable|well-made|sturdy|excellent|premium|luxury|luxurious|solid construction|beautiful quality|great quality|amazing quality|love the quality|quality is great|quality is amazing|worth the money|investment piece|good quality|decent quality|quality materials|quality fabric|nice quality|quality pieces|quality construction|timeless construction|natural fabrics|thoughtful silhouettes/g) || []).length;
  const qualityNegative = (allText.match(/poor quality|cheap|flimsy|falls apart|thin material|see through|transparent|cheap feeling|not worth|disappointed|returned|poor construction|badly made|quality come down|quality has gone down|quality declined|fabric.*thinner|fabric.*thin|wish.*thicker|could be thicker|quality issues|quality concerns/g) || []).length;
  
  // Adaptive quality threshold - lower for smaller/niche brands
  const totalQualityMentions = qualityPositive + qualityNegative;
  const qualityThreshold = results.length < 15 ? 1 : 2; // Lower threshold for smaller brands
  if (totalQualityMentions >= qualityThreshold) {
    const qualityRatio = qualityPositive / totalQualityMentions;
    const isPositive = qualityPositive > qualityNegative;
    
    // Extract actual quality-related quotes from reviews
    const qualityEvidence = extractQualityEvidence(results, isPositive);
    
    let recommendation: string | undefined;
    let confidence: 'low' | 'medium' | 'high' | undefined;
    
    // Get source information for quality evidence
    const qualitySources = extractSourcesFromEvidence(results, qualityEvidence);
    const qualitySourceText = qualitySources.length > 0 ? ` (from ${qualitySources.join(', ')})` : '';
    
    // ONLY generate analysis if we have actual evidence from reviews
    if (qualityEvidence.length === 0) {
      console.log(`🔍 ANALYSIS: No quality evidence found in reviews, skipping quality analysis`);
      // Don't generate any quality analysis without evidence
    } else if (qualityRatio >= 0.8 && qualityPositive >= 2) {
      const topQuote = qualityEvidence[0].substring(0, 140) + '...';
      recommendation = `Reviews consistently mention good quality${qualitySourceText}. Customer review: "${topQuote}"`;
      confidence = totalQualityMentions >= 4 ? 'high' : totalQualityMentions >= 3 ? 'medium' : 'low';
    } else if (qualityRatio >= 0.6 && qualityPositive >= 2) {
      const topQuote = qualityEvidence[0].substring(0, 140) + '...';
      recommendation = `Most quality feedback is positive${qualitySourceText}. Customer review: "${topQuote}"`;
      confidence = totalQualityMentions >= 4 ? 'medium' : 'low';
    } else if (qualityRatio >= 0.4 && totalQualityMentions >= 3) {
      const concernQuote = qualityEvidence[0].substring(0, 120) + '...';
      recommendation = `Mixed quality feedback (${qualityPositive} positive vs ${qualityNegative} negative mentions)${qualitySourceText}. Customer review: "${concernQuote}"`;
      confidence = 'medium';
    } else if (qualityNegative >= 2 && qualityEvidence.length > 0) {
      const negativeQuote = qualityEvidence[0].substring(0, 140) + '...';
      recommendation = `Quality concerns noted in reviews${qualitySourceText}. Customer review: "${negativeQuote}"`;
      confidence = totalQualityMentions >= 4 ? 'medium' : 'low';
    } else {
      console.log(`🔍 ANALYSIS: Insufficient quality evidence (${totalQualityMentions} mentions, ${qualityEvidence.length} evidence pieces)`);
    }
    
    if (recommendation && confidence) {
      analysis.quality = {
        recommendation,
        confidence,
        evidence: qualityEvidence
      };
    }
  } else {
    console.log(`🔍 ANALYSIS: Insufficient quality mentions (${totalQualityMentions}, need 2+) - skipping quality analysis`);
  }
  
  // Analyze wash/care behavior for clothing items
  if (category === 'clothing') {
    const washPatterns = {
      shrinks: (allText.match(/shrinks?|shrank|got smaller|reduced in size|shrinkage|shrunk in wash|shrank after washing|after wash|washed it|after washing/g) || []).length,
      holds: (allText.match(/holds up|maintains shape|doesn't shrink|keeps its form|washes well|holds shape|no shrinkage|maintained shape|kept its shape|still looks good|washes beautifully/g) || []).length,
      stretches: (allText.match(/stretches out|loses shape|gets baggy|stretched after wash|lost shape|stretchy|elastic|loose after wash/g) || []).length
    };
    
    console.log(`🔍 ANALYSIS: Wash patterns found:`, washPatterns);
    
    const totalWashMentions = washPatterns.shrinks + washPatterns.holds + washPatterns.stretches;
    
    if (totalWashMentions >= 2) {
      const dominantWash = Object.entries(washPatterns).sort((a, b) => b[1] - a[1])[0];
      
      if (dominantWash[1] > 0) {
        // Extract actual wash-related quotes from reviews
        const washEvidence = extractWashCareEvidence(results);
        
        // Get source information for wash evidence
        const washSources = extractSourcesFromEvidence(results, washEvidence);
        const washSourceText = washSources.length > 0 ? ` (from ${washSources.join(', ')})` : '';
        
        let recommendation = '';
        if (dominantWash[0] === 'shrinks') {
          const exampleQuote = washEvidence[0] ? washEvidence[0].substring(0, 120) + '...' : '';
          recommendation = `Multiple customers report items shrink after washing${washSourceText}. ${exampleQuote ? 'One review: "' + exampleQuote + '"' : 'Consider cold wash or sizing up.'}`;
        } else if (dominantWash[0] === 'holds') {
          const exampleQuote = washEvidence[0] ? washEvidence[0].substring(0, 120) + '...' : '';
          recommendation = `Items maintain shape well after washing${washSourceText}. ${exampleQuote ? 'Customer feedback: "' + exampleQuote + '"' : 'Good durability reported.'}`;
        } else if (dominantWash[0] === 'stretches') {
          const exampleQuote = washEvidence[0] ? washEvidence[0].substring(0, 120) + '...' : '';
          recommendation = `Some items may stretch out with wear/washing${washSourceText}. ${exampleQuote ? 'Review mentions: "' + exampleQuote + '"' : 'Consider sizing down or gentle care.'}`;
        }
        
        analysis.washCare = {
          recommendation,
          confidence: totalWashMentions >= 4 ? 'high' : totalWashMentions >= 2 ? 'medium' : 'low',
          evidence: washEvidence
        };
      }
    } else {
      console.log(`🔍 ANALYSIS: Insufficient wash mentions (${totalWashMentions}, need 2+) - skipping wash analysis`);
    }
  }
  
  // Analyze fabric/material information
  if (category === 'clothing') {
    const materialMentions = {
      cotton: (allText.match(/cotton|organic cotton|100% cotton/g) || []).length,
      polyester: (allText.match(/polyester|poly|synthetic/g) || []).length,
      wool: (allText.match(/wool|merino|cashmere|alpaca/g) || []).length,
      linen: (allText.match(/linen|flax/g) || []).length,
      silk: (allText.match(/silk/g) || []).length,
      modal: (allText.match(/modal|tencel|lyocell/g) || []).length,
      spandex: (allText.match(/spandex|elastane|stretch/g) || []).length
    };
    
    const fabricQuality = {
      soft: (allText.match(/soft|comfortable|cozy|smooth/g) || []).length,
      breathable: (allText.match(/breathable|airy|cooling/g) || []).length,
      durable: (allText.match(/durable|lasting|holds up|strong fabric/g) || []).length,
      pilling: (allText.match(/pilling|pills|bobbles/g) || []).length,
      stretchy: (allText.match(/stretchy|stretch|elastic|flexible/g) || []).length
    };
    
    const mentionedMaterials = Object.entries(materialMentions)
      .filter(([, count]) => count > 0)
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([material]) => material);
    
    if (mentionedMaterials.length > 0 || Object.values(fabricQuality).some(count => count > 0)) {
      const qualityDescriptions = [];
      
      if (fabricQuality.soft > 0) qualityDescriptions.push('soft feel');
      if (fabricQuality.breathable > 0) qualityDescriptions.push('breathable');
      if (fabricQuality.stretchy > 0) qualityDescriptions.push('good stretch');
      if (fabricQuality.pilling > 0) qualityDescriptions.push('may pill');
      
      // Extract fabric-related evidence from actual reviews
      const fabricEvidence = extractFabricEvidence(results, mentionedMaterials, qualityDescriptions);
      
      // Get source information for fabric evidence
      const fabricSources = extractSourcesFromEvidence(results, fabricEvidence);
      const fabricSourceText = fabricSources.length > 0 ? ` (sources: ${fabricSources.join(', ')})` : '';
      
      let recommendation = '';
      if (mentionedMaterials.length > 0) {
        recommendation = `External reviews mention materials: ${mentionedMaterials.slice(0, 3).join(', ')}${fabricSourceText}`;
        if (qualityDescriptions.length > 0) {
          recommendation += `. Customers describe the fabric as ${qualityDescriptions.join(', ')}`;
        }
        if (fabricEvidence.length > 0) {
          recommendation += `. One review: "${fabricEvidence[0].substring(0, 120)}..."`;
        }
      } else if (qualityDescriptions.length > 0) {
        recommendation = `External sources describe fabric as ${qualityDescriptions.join(', ')}${fabricSourceText}`;
        if (fabricEvidence.length > 0) {
          recommendation += `. A reviewer noted: "${fabricEvidence[0].substring(0, 120)}..."`;
        }
      }
      
      const totalMentions = Object.values(materialMentions).reduce((a, b) => a + b, 0) + 
                           Object.values(fabricQuality).reduce((a, b) => a + b, 0);
      
      analysis.fabric = {
        recommendation,
        confidence: totalMentions >= 4 ? 'medium' : 'low',
        evidence: fabricEvidence
      };
    }
  } else if (category === 'bags') {
    // For bags, analyze leather/material quality differently
    const bagMaterials = {
      leather: (allText.match(/leather|genuine leather|real leather|cowhide/g) || []).length,
      canvas: (allText.match(/canvas|cotton canvas/g) || []).length,
      nylon: (allText.match(/nylon|ballistic nylon/g) || []).length,
      suede: (allText.match(/suede/g) || []).length,
      vegan: (allText.match(/vegan leather|faux leather|synthetic leather/g) || []).length
    };
    
    const bagQuality = {
      soft: (allText.match(/soft|supple|buttery/g) || []).length,
      durable: (allText.match(/durable|sturdy|holds up|strong/g) || []).length,
      scratches: (allText.match(/scratch|scratches|scuff|scuffs/g) || []).length,
      stiff: (allText.match(/stiff|rigid|structured/g) || []).length
    };
    
    const mentionedMaterials = Object.entries(bagMaterials)
      .filter(([, count]) => count > 0)
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([material]) => material);
    
    if (mentionedMaterials.length > 0 || Object.values(bagQuality).some(count => count > 0)) {
      const materialEvidence = extractFabricEvidence(results, mentionedMaterials, []);
      const materialSources = extractSourcesFromEvidence(results, materialEvidence);
      const materialSourceText = materialSources.length > 0 ? ` (sources: ${materialSources.join(', ')})` : '';
      
      let recommendation = '';
      if (mentionedMaterials.length > 0) {
        recommendation = `External reviews mention materials: ${mentionedMaterials.slice(0, 3).join(', ')}${materialSourceText}`;
        if (materialEvidence.length > 0) {
          recommendation += `. One review: "${materialEvidence[0].substring(0, 120)}..."`;
        }
      }
      
      analysis.fabric = {
        recommendation,
        confidence: mentionedMaterials.length >= 2 ? 'medium' : 'low',
        evidence: materialEvidence
      };
    }
  }
  
  // Material analysis for specific item searches
  if (isSpecificItem && itemName && category === 'clothing') {
    const materialEvidence = extractMaterialComposition(results, brand, itemName);
    
    if (materialEvidence.composition.length > 0) {
      analysis.materials = {
        composition: materialEvidence.composition,
        confidence: materialEvidence.confidence,
        evidence: materialEvidence.evidence
      };
      
      console.log('🔍 ANALYSIS: Material composition found:', materialEvidence.composition);
    }
  }
  
  // Calculate overall confidence
  const confidences = Object.values(analysis)
    .map((a) => a.confidence)
    .filter(Boolean);
  
  analysis.overallConfidence = confidences.includes('high') ? 'high' 
    : confidences.includes('medium') ? 'medium' 
    : 'low';
  
  return analysis;
}

function extractEvidence(results: SerperResult[], pattern: string): string[] {
  const evidence = [];
  const keywords = {
    runsSmall: ['runs small', 'size up', 'tight'],
    runsLarge: ['runs large', 'size down', 'loose'],
    trueToSize: ['true to size', 'fits perfectly']
  };
  
  const relevant = keywords[pattern as keyof typeof keywords] || [];
  
  for (const result of results.slice(0, 5)) {
    const text = `${result.title} ${result.snippet}`.toLowerCase();
    if (relevant.some(k => text.includes(k))) {
      const snippet = result.snippet?.substring(0, 150) + '...';
      if (snippet) evidence.push(snippet);
    }
    if (evidence.length >= 2) break;
  }
  
  return evidence;
}

function extractQualityEvidence(results: SerperResult[], isPositive: boolean): string[] {
  const evidence: string[] = [];
  
  // More comprehensive and flexible keyword matching
  const positiveKeywords = [
    'high quality', 'well-made', 'durable', 'excellent', 'premium', 'luxury', 'luxurious',
    'love the quality', 'great quality', 'amazing quality', 'good quality', 'quality is',
    'well made', 'solid construction', 'beautiful quality', 'worth the money', 
    'investment piece', 'quality materials', 'quality fabric', 'timeless construction',
    'thoughtful silhouettes', 'natural fabrics'
  ];
  
  const negativeKeywords = [
    'poor quality', 'cheap', 'flimsy', 'falls apart', 'disappointed', 'not worth',
    'cheap feeling', 'thin material', 'see through', 'poor construction', 
    'badly made', 'quality declined', 'quality issues', 'quality concerns'
  ];
  
  const keywords = isPositive ? positiveKeywords : negativeKeywords;
  
  for (const result of results.slice(0, 10)) {
    const text = `${result.title} ${result.snippet}`.toLowerCase();
    const matchingKeywords = keywords.filter(k => text.includes(k));
    
    if (matchingKeywords.length > 0) {
      // Extract more context around the quality mention
      const snippet = result.snippet || '';
      if (snippet.length > 10 && !evidence.some(e => e.includes(snippet.substring(0, 50)))) {
        evidence.push(snippet);
      }
    }
    if (evidence.length >= 3) break;
  }
  
  return evidence;
}

function extractWashCareEvidence(results: SerperResult[]): string[] {
  const evidence: string[] = [];
  // Focus on actual post-wash experiences, not care instructions
  const postWashKeywords = [
    'after wash', 'washed it', 'after washing', 'holds up well', 'maintained shape', 
    'kept its shape', 'shrunk', 'shrank', 'faded', 'pilled', 'stretched out',
    'lost its shape', 'fell apart', 'still looks good', 'washes beautifully'
  ];
  
  for (const result of results.slice(0, 10)) {
    const text = `${result.title} ${result.snippet}`.toLowerCase();
    
    // Look for actual customer experiences about post-wash results
    if (postWashKeywords.some(k => text.includes(k))) {
      const snippet = result.snippet;
      if (snippet && !evidence.some(e => e.includes(snippet.substring(0, 50)))) {
        evidence.push(snippet);
      }
    }
    if (evidence.length >= 3) break;
  }
  
  return evidence;
}

function extractFabricEvidence(results: SerperResult[], materials: string[], qualities: string[]): string[] {
  const evidence: string[] = [];
  const fabricKeywords = [
    ...materials,
    ...qualities.map(q => q.replace(' feel', '').replace('good ', '')),
    'material', 'fabric', 'soft', 'comfortable', 'breathable', 'stretchy', 'cotton', 'polyester'
  ];
  
  for (const result of results.slice(0, 8)) {
    const text = `${result.title} ${result.snippet}`.toLowerCase();
    
    if (fabricKeywords.some(k => text.includes(k.toLowerCase()))) {
      const snippet = result.snippet;
      if (snippet && !evidence.some(e => e.includes(snippet.substring(0, 50)))) {
        evidence.push(snippet);
      }
    }
    if (evidence.length >= 2) break;
  }
  
  return evidence;
}

function extractMaterialComposition(results: SerperResult[], brand: string, itemName: string): {
  composition: string[];
  confidence: 'low' | 'medium' | 'high';
  evidence: string[];
} {
  const composition: string[] = [];
  const evidence: string[] = [];
  
  // Common material patterns to look for
  const materialPatterns = [
    // Percentage-based compositions
    /(\d+%\s*(?:organic\s+)?(?:pima\s+)?(?:supima\s+)?cotton)/gi,
    /(\d+%\s*(?:merino\s+)?wool)/gi,
    /(\d+%\s*silk)/gi,
    /(\d+%\s*linen)/gi,
    /(\d+%\s*cashmere)/gi,
    /(\d+%\s*polyester)/gi,
    /(\d+%\s*nylon)/gi,
    /(\d+%\s*spandex)/gi,
    /(\d+%\s*elastane)/gi,
    /(\d+%\s*modal)/gi,
    /(\d+%\s*tencel)/gi,
    /(\d+%\s*lyocell)/gi,
    /(\d+%\s*viscose)/gi,
    
    // Full material descriptions
    /(100% organic cotton)/gi,
    /(100% cotton)/gi,
    /(100% merino wool)/gi,
    /(100% wool)/gi,
    /(100% silk)/gi,
    /(100% linen)/gi,
    /(100% cashmere)/gi,
    
    // Blends
    /(cotton blend)/gi,
    /(wool blend)/gi,
    /(silk blend)/gi,
    /(cotton\/polyester blend)/gi,
    /(wool\/cashmere blend)/gi,
  ];
  
  for (const result of results) {
    const text = `${result.title} ${result.snippet}`;
    
    // Check if this result is specifically about our brand and item
    const brandItemMatch = text.toLowerCase().includes(brand.toLowerCase()) && 
                          text.toLowerCase().includes(itemName.toLowerCase());
    
    if (brandItemMatch) {
      // Look for material patterns
      for (const pattern of materialPatterns) {
        const matches = text.match(pattern);
        if (matches) {
          for (const match of matches) {
            const cleanMatch = match.trim().toLowerCase();
            // Avoid duplicates and ensure quality
            if (!composition.some(c => c.toLowerCase() === cleanMatch)) {
              composition.push(match.trim());
            }
          }
          
          // Add evidence if we found material info
          if (matches.length > 0 && result.snippet) {
            const snippet = result.snippet.trim();
            if (!evidence.some(e => e.includes(snippet.substring(0, 50)))) {
              evidence.push(snippet);
            }
          }
        }
      }
    }
  }
  
  // Determine confidence based on amount of evidence found
  let confidence: 'low' | 'medium' | 'high' = 'low';
  if (composition.length >= 3 && evidence.length >= 2) {
    confidence = 'high';
  } else if (composition.length >= 2 && evidence.length >= 1) {
    confidence = 'medium';
  }
  
  return {
    composition: composition.slice(0, 5), // Limit to top 5 compositions
    confidence,
    evidence: evidence.slice(0, 3) // Limit to top 3 evidence pieces
  };
}

function extractSourcesFromEvidence(results: SerperResult[], evidence: string[]): string[] {
  if (!evidence.length) return [];
  
  const sources = new Set<string>();
  
  // Match evidence snippets back to their source URLs
  for (const evidenceText of evidence.slice(0, 3)) { // Check first 3 pieces of evidence
    for (const result of results) {
      if (result.snippet && evidenceText.includes(result.snippet.substring(0, 50))) {
        const sourceUrl = result.link || result.displayed_link || '';
        const sourceName = extractReadableSourceName(sourceUrl);
        if (sourceName) {
          sources.add(sourceName);
        }
      }
    }
  }
  
  return Array.from(sources).slice(0, 3); // Limit to 3 sources for readability
}

function extractReadableSourceName(url: string): string {
  if (!url) return '';
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    
    // Map common domains to readable names
    const sourceMap: { [key: string]: string } = {
      'reddit.com': 'Reddit',
      'substack.com': 'Substack', 
      'medium.com': 'Medium',
      'youtube.com': 'YouTube',
      'instagram.com': 'Instagram',
      'twitter.com': 'Twitter',
      'pinterest.com': 'Pinterest',
      'styleforum.net': 'StyleForum',
      'thefashionspot.com': 'The Fashion Spot',
      'vogue.com': 'Vogue',
      'elle.com': 'Elle',
      'harpersbazaar.com': 'Harper\'s Bazaar',
      'glamour.com': 'Glamour',
      'refinery29.com': 'Refinery29'
    };
    
    // Check for exact matches first
    if (sourceMap[hostname]) {
      return sourceMap[hostname];
    }
    
    // Check for subdomain matches (like user.substack.com)
    for (const [domain, name] of Object.entries(sourceMap)) {
      if (hostname.endsWith(domain)) {
        return name;
      }
    }
    
    // Fallback: capitalize first part of domain
    const domainParts = hostname.split('.');
    if (domainParts.length > 0) {
      const firstPart = domainParts[0];
      return firstPart.charAt(0).toUpperCase() + firstPart.slice(1);
    }
    
    return '';
  } catch {
    return '';
  }
}

// Generate a detailed, nuanced summary from the analysis
function generateDetailedSummary(analysis: AnalysisResult, results: SerperResult[], brand: string, category: 'clothing' | 'bags' | 'shoes' | 'accessories' | 'general' = 'general'): string {
  const summaryParts: string[] = [];
  const totalReviews = results.length;
  
  // Get unique sources for transparency
  const allSources = new Set<string>();
  for (const result of results.slice(0, 10)) {
    const sourceName = extractReadableSourceName(result.link || '');
    if (sourceName) {
      allSources.add(sourceName);
    }
  }
  const sourcesList = Array.from(allSources).slice(0, 4);
  const sourcesText = sourcesList.length > 0 ? ` from external sources including ${sourcesList.join(', ')}` : ' from external review sources';
  
  // Start with actual review context and source attribution
  if (totalReviews > 0) {
    summaryParts.push(`Based on ${totalReviews} customer reviews${sourcesText}`);
  }
  
  // Add fit information based on evidence and confidence (only for clothing/shoes)
  if (analysis.fit && analysis.fit.evidence && analysis.fit.evidence.length > 0 && (category === 'clothing' || category === 'shoes')) {
    const productType = category === 'shoes' ? 'shoes' : 'items';
    let fitText = '';
    
    // Determine fit tendency from the recommendation content
    if (analysis.fit.recommendation.includes('run small')) {
      fitText = analysis.fit.confidence === 'high' 
        ? `${brand} ${productType} consistently run small`
        : `${brand} ${productType} tend to run small`;
    } else if (analysis.fit.recommendation.includes('run large')) {
      fitText = analysis.fit.confidence === 'high' 
        ? `${brand} ${productType} consistently run large`
        : `${brand} ${productType} tend to run large`;
    } else if (analysis.fit.recommendation.includes('true-to-size')) {
      fitText = analysis.fit.confidence === 'high' 
        ? `${brand} ${productType} consistently fit true to size`
        : `${brand} ${productType} generally fit true to size`;
    }
    
    if (fitText) {
      summaryParts.push(fitText);
    }
  }
  
  // Add quality assessment based on evidence data, not text parsing
  if (analysis.quality && analysis.quality.evidence && analysis.quality.evidence.length > 0) {
    let qualityText = '';
    
    // Base the summary on the confidence and evidence we actually have
    if (analysis.quality.confidence === 'high') {
      qualityText = '. Customer reviews consistently highlight quality construction';
    } else if (analysis.quality.confidence === 'medium') {
      qualityText = '. Most quality mentions in reviews are positive';
    } else {
      qualityText = '. Some quality feedback found in reviews';
    }
    
    if (qualityText && summaryParts.length > 0) {
      summaryParts[summaryParts.length - 1] += qualityText;
    } else if (qualityText) {
      summaryParts.push(qualityText.replace('. ', ''));
    }
  }
  
  // Add fabric/material insights if available
  if (analysis.fabric && analysis.fabric.recommendation) {
    const fabricInfo = analysis.fabric.recommendation.split('.')[0]; // Get material info without quotes
    if (fabricInfo.includes('mention materials:')) {
      const materials = fabricInfo.split('mention materials:')[1].trim();
      const materialType = category === 'bags' ? 'materials' : 'fabric materials';
      summaryParts[summaryParts.length - 1] += `, with commonly mentioned ${materialType} being ${materials}`;
    } else if (fabricInfo.includes('describe fabric as') && category === 'clothing') {
      const qualities = fabricInfo.split('describe fabric as')[1].trim();
      summaryParts[summaryParts.length - 1] += `, with fabric described as ${qualities}`;
    }
  }
  
  // Add wash experiences only if customers shared actual post-wash results
  if (analysis.washCare) {
    if (analysis.washCare.recommendation.includes('wash-related issues')) {
      summaryParts[summaryParts.length - 1] += '. Some customers experienced issues after washing';
    } else if (analysis.washCare.recommendation.includes('hold up well after washing')) {
      summaryParts[summaryParts.length - 1] += '. Customer reviews indicate items maintain quality after washing';
    } else if (analysis.washCare.recommendation.includes('post-wash feedback')) {
      summaryParts[summaryParts.length - 1] += '. Limited post-wash feedback available from customers';
    }
  }
  
  // Add confidence context
  if (analysis.overallConfidence === 'low' && totalReviews < 5) {
    summaryParts.push(' Note: Limited review data available - individual experiences may vary significantly.');
  } else if (analysis.overallConfidence === 'medium' && totalReviews >= 5) {
    summaryParts.push(' These patterns emerge from customer feedback, though individual product experiences can vary.');
  }
  
  // Fallback for no analysis
  if (summaryParts.length === 0) {
    return `Found ${totalReviews} results for ${brand}. Review content includes varying experiences with fit. ${analysis.quality ? 'Quality feedback available.' : 'Limited quality information found in reviews.'} Individual product reviews provide more specific insights.`;
  }
  
  // Join parts and ensure proper sentence structure
  let summary = summaryParts.join('');
  
  // Ensure it ends with a period
  if (!summary.endsWith('.')) {
    summary += '.';
  }
  
  return summary;
}