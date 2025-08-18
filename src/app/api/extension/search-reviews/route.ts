import { NextRequest, NextResponse } from 'next/server';

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
  overallConfidence?: 'low' | 'medium' | 'high';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brand } = body;
    
    if (!brand) {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });
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

    // Search for reviews
    const searchQueries = [
      `${brand} clothing fit review "runs small" OR "runs large" OR "true to size"`,
      `${brand} fashion quality fabric review`,
      `${brand} washing shrink care instructions`
    ];
    
    let allResults: SerperResult[] = [];
    
    for (const query of searchQueries) {
      try {
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
          if (data.organic) allResults = [...allResults, ...data.organic];
        }
      } catch (error) {
        console.error('Search error:', error);
      }
    }
    
    // Analyze results for patterns
    const analysis = analyzeResults(allResults, brand);
    
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
    
    if (analysis.quality) {
      sections.quality = {
        title: 'Quality',
        recommendation: analysis.quality.recommendation,
        confidence: analysis.quality.confidence,
        evidence: analysis.quality.evidence
      };
    }
    
    if (analysis.fabric) {
      sections.fabric = {
        title: 'Fabric & Material',
        recommendation: analysis.fabric.recommendation,
        confidence: analysis.fabric.confidence,
        evidence: analysis.fabric.evidence
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
    const summary = generateDetailedSummary(analysis, allResults, brand);
    
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

function analyzeResults(results: SerperResult[], _brand: string): AnalysisResult {
  const analysis: AnalysisResult = {};
  const allText = results.map(r => `${r.title} ${r.snippet}`).join(' ').toLowerCase();
  
  // Analyze fit
  const fitPatterns = {
    runsSmall: (allText.match(/runs small|size up|tight|snug/g) || []).length,
    runsLarge: (allText.match(/runs large|size down|loose|baggy/g) || []).length,
    trueToSize: (allText.match(/true to size|fits perfectly|accurate sizing/g) || []).length
  };
  
  const dominantFit = Object.entries(fitPatterns).sort((a, b) => b[1] - a[1])[0];
  
  if (dominantFit[1] > 0) {
    const recommendations = {
      runsSmall: 'Runs small - Consider ordering one size up',
      runsLarge: 'Runs large - Consider ordering one size down',
      trueToSize: 'True to size - Order your usual size'
    };
    
    analysis.fit = {
      recommendation: recommendations[dominantFit[0] as keyof typeof recommendations],
      confidence: dominantFit[1] >= 3 ? 'high' : dominantFit[1] >= 2 ? 'medium' : 'low',
      evidence: extractEvidence(results, dominantFit[0])
    };
  }
  
  // Analyze quality
  const qualityPositive = (allText.match(/high quality|durable|well-made|sturdy|excellent/g) || []).length;
  const qualityNegative = (allText.match(/poor quality|cheap|flimsy|falls apart/g) || []).length;
  
  if (qualityPositive > 0 || qualityNegative > 0) {
    analysis.quality = {
      recommendation: qualityPositive > qualityNegative 
        ? 'High quality - Built to last'
        : 'Quality concerns - May not be durable',
      confidence: (qualityPositive + qualityNegative) >= 3 ? 'high' : 'medium',
      evidence: []
    };
  }
  
  // Analyze fabric
  if (allText.includes('cotton') || allText.includes('polyester') || allText.includes('fabric')) {
    const materials = [];
    if (allText.includes('cotton')) materials.push('cotton');
    if (allText.includes('polyester')) materials.push('polyester');
    if (allText.includes('wool')) materials.push('wool');
    
    analysis.fabric = {
      recommendation: `Materials mentioned: ${materials.join(', ')}`,
      confidence: 'low',
      evidence: []
    };
  }
  
  // Analyze washing
  if (allText.includes('shrink') || allText.includes('wash') || allText.includes('care')) {
    const shrinks = allText.includes('shrink');
    const washesWell = allText.includes('washes well') || allText.includes('holds up');
    
    analysis.washCare = {
      recommendation: shrinks 
        ? 'May shrink - Wash in cold water'
        : washesWell 
        ? 'Washes well - Easy care'
        : 'Check care label for instructions',
      confidence: 'low',
      evidence: []
    };
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

// Generate a detailed, nuanced summary from the analysis
function generateDetailedSummary(analysis: AnalysisResult, results: SerperResult[], brand: string): string {
  const summaryParts: string[] = [];
  const totalReviews = results.length;
  
  // Start with overall context
  if (totalReviews > 0) {
    summaryParts.push(`Based on ${totalReviews} reviews analyzed for ${brand}`);
  }
  
  // Add fit information with nuance
  if (analysis.fit) {
    const fitDetail = analysis.fit.recommendation.replace(/^[^\s]+ /, ''); // Remove emoji if any
    if (analysis.fit.confidence === 'high') {
      summaryParts.push(`the brand consistently ${fitDetail.toLowerCase()}`);
    } else if (analysis.fit.confidence === 'medium') {
      summaryParts.push(`the brand generally ${fitDetail.toLowerCase()}, though some variation exists between styles`);
    } else {
      summaryParts.push(`sizing feedback is mixed, with some items ${fitDetail.toLowerCase()}`);
    }
  }
  
  // Add quality assessment with detail
  if (analysis.quality) {
    const qualityText = analysis.quality.recommendation.includes('High quality')
      ? analysis.quality.confidence === 'high' 
        ? 'Customers consistently praise the build quality and durability'
        : 'Most reviews indicate good quality construction'
      : 'Some customers have raised concerns about construction quality and longevity';
    
    if (summaryParts.length > 0) {
      summaryParts[summaryParts.length - 1] += '. ' + qualityText;
    } else {
      summaryParts.push(qualityText);
    }
  }
  
  // Add fabric/material insights if available
  if (analysis.fabric) {
    const materials = analysis.fabric.recommendation.replace('Materials mentioned: ', '');
    if (materials && materials !== '') {
      summaryParts[summaryParts.length - 1] += `, with materials including ${materials}`;
    }
  }
  
  // Add care instructions if relevant
  if (analysis.washCare) {
    if (analysis.washCare.recommendation.includes('shrink')) {
      summaryParts[summaryParts.length - 1] += '. Several reviews mention potential shrinking after washing, so cold water washing is recommended';
    } else if (analysis.washCare.recommendation.includes('Washes well')) {
      summaryParts[summaryParts.length - 1] += ' and the items appear to hold up well after washing';
    }
  }
  
  // Add confidence context
  if (analysis.overallConfidence) {
    if (analysis.overallConfidence === 'low' && totalReviews < 5) {
      summaryParts.push('. Note: Limited review data available, so these insights should be considered preliminary');
    } else if (analysis.overallConfidence === 'medium') {
      summaryParts.push('. Review patterns suggest these trends, though individual experiences may vary');
    }
  }
  
  // Fallback for no analysis
  if (summaryParts.length === 0) {
    return `Found ${totalReviews} results for ${brand}. Review content suggests varying experiences with fit and quality. Check individual reviews below for specific product insights.`;
  }
  
  // Join parts and ensure proper sentence structure
  let summary = summaryParts.join('');
  
  // Ensure it ends with a period
  if (!summary.endsWith('.')) {
    summary += '.';
  }
  
  return summary;
}