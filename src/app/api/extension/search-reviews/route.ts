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

function analyzeResults(results: SerperResult[], brand: string): AnalysisResult {
  const analysis: AnalysisResult = {};
  const allText = results.map(r => `${r.title} ${r.snippet}`).join(' ').toLowerCase();
  
  console.log(`🔍 ANALYSIS: Starting analysis for ${brand} with ${results.length} results`);
  console.log(`🔍 ANALYSIS: Combined text sample (first 300 chars):`, allText.substring(0, 300) + '...');
  console.log(`🔍 ANALYSIS: Full text length:`, allText.length, 'characters');
  
  // Analyze fit
  const fitPatterns = {
    runsSmall: (allText.match(/runs small|size up|tight|snug/g) || []).length,
    runsLarge: (allText.match(/runs large|size down|loose|baggy/g) || []).length,
    trueToSize: (allText.match(/true to size|fits perfectly|accurate sizing/g) || []).length
  };
  
  console.log(`🔍 ANALYSIS: Fit patterns found:`, fitPatterns);
  
  const dominantFit = Object.entries(fitPatterns).sort((a, b) => b[1] - a[1])[0];
  
  if (dominantFit[1] > 0) {
    // Extract actual quotes from reviews instead of using templates
    const fitEvidence = extractEvidence(results, dominantFit[0]);
    
    // Get source information for authenticity
    const fitSources = extractSourcesFromEvidence(results, fitEvidence);
    const sourceText = fitSources.length > 0 ? ` (sources: ${fitSources.join(', ')})` : '';
    
    let recommendation = '';
    if (dominantFit[0] === 'runsSmall') {
      const exampleQuotes = fitEvidence.slice(0, 2);
      recommendation = `External reviews indicate this brand tends to run small${sourceText}. ${exampleQuotes.length > 0 ? 'One customer wrote: "' + exampleQuotes[0].substring(0, 120) + '..." ' : ''}Consider sizing up.`;
    } else if (dominantFit[0] === 'runsLarge') {
      const exampleQuotes = fitEvidence.slice(0, 2);
      recommendation = `External reviews suggest this brand runs large${sourceText}. ${exampleQuotes.length > 0 ? 'A reviewer reported: "' + exampleQuotes[0].substring(0, 120) + '..." ' : ''}Consider sizing down.`;
    } else {
      const exampleQuotes = fitEvidence.slice(0, 2);
      recommendation = `External customer reviews indicate true-to-size fit${sourceText}. ${exampleQuotes.length > 0 ? 'As noted: "' + exampleQuotes[0].substring(0, 120) + '..." ' : ''}Order your usual size.`;
    }
    
    analysis.fit = {
      recommendation,
      confidence: dominantFit[1] >= 3 ? 'high' : dominantFit[1] >= 2 ? 'medium' : 'low',
      evidence: fitEvidence
    };
  }
  
  // Analyze quality with more nuanced patterns
  const qualityPositive = (allText.match(/high quality|durable|well-made|sturdy|excellent|premium|luxury|solid construction|beautiful quality|great quality|amazing quality|love the quality|quality is great|quality is amazing|worth the money|investment piece/g) || []).length;
  const qualityNegative = (allText.match(/poor quality|cheap|flimsy|falls apart|thin material|see through|transparent|cheap feeling|not worth|disappointed|returned|poor construction|badly made/g) || []).length;
  
  if (qualityPositive > 0 || qualityNegative > 0) {
    const totalMentions = qualityPositive + qualityNegative;
    const qualityRatio = qualityPositive / totalMentions;
    const isPositive = qualityPositive > qualityNegative;
    
    // Extract actual quality-related quotes from reviews
    const qualityEvidence = extractQualityEvidence(results, isPositive);
    
    let recommendation;
    let confidence: 'low' | 'medium' | 'high';
    
    // Get source information for quality evidence
    const qualitySources = extractSourcesFromEvidence(results, qualityEvidence);
    const qualitySourceText = qualitySources.length > 0 ? ` (from ${qualitySources.join(', ')})` : '';
    
    if (qualityRatio >= 0.8) {
      const topQuote = qualityEvidence[0] ? qualityEvidence[0].substring(0, 140) + '...' : '';
      recommendation = `External reviews consistently praise the quality${qualitySourceText}. ${topQuote ? 'One review states: "' + topQuote + '"' : 'Multiple sources highlight durability and construction.'}`;
      confidence = totalMentions >= 5 ? 'high' : totalMentions >= 3 ? 'medium' : 'low';
    } else if (qualityRatio >= 0.6) {
      const topQuote = qualityEvidence[0] ? qualityEvidence[0].substring(0, 140) + '...' : '';
      recommendation = `Most external reviews are positive about quality${qualitySourceText}. ${topQuote ? 'A customer noted: "' + topQuote + '"' : 'Generally good construction reported across sources.'}`;
      confidence = totalMentions >= 4 ? 'medium' : 'low';
    } else if (qualityRatio >= 0.4) {
      const concernQuote = qualityEvidence[0] ? qualityEvidence[0].substring(0, 120) + '...' : '';
      recommendation = `Mixed quality feedback from external sources (${qualityPositive} positive vs ${qualityNegative} negative mentions)${qualitySourceText}. ${concernQuote ? 'Some concerns mentioned: "' + concernQuote + '"' : 'Individual experiences vary significantly.'}`;
      confidence = 'medium';
    } else {
      const negativeQuote = qualityEvidence[0] ? qualityEvidence[0].substring(0, 140) + '...' : '';
      recommendation = `Multiple quality concerns in external reviews${qualitySourceText}. ${negativeQuote ? 'Customers reported: "' + negativeQuote + '"' : 'Consider checking recent reviews carefully.'}`;
      confidence = totalMentions >= 3 ? 'medium' : 'low';
    }
    
    analysis.quality = {
      recommendation,
      confidence,
      evidence: qualityEvidence
    };
  }
  
  // Analyze fabric with better material detection
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
    .filter(([_, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
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
  
  // Only analyze washing if there are actual customer experiences about post-wash results
  const postWashExperiences = allText.match(/after wash|washed.*shrink|washed.*shrank|after washing|holds up.*wash|faded.*wash|pilled.*wash|maintained.*shape|kept.*shape|lost.*shape|stretched.*wash/gi) || [];
  const brandSpecificWashExperiences = allText.match(new RegExp(`${brand.toLowerCase()}[^.]{0,150}(after wash|washed.*shrink|washed.*shrank|after washing|holds up.*wash|faded.*wash|pilled.*wash|maintained.*shape|kept.*shape|lost.*shape|stretched.*wash)`, 'gi')) || [];
  
  console.log(`🔍 ANALYSIS: Post-wash experience analysis for ${brand}:`, {
    postWashExperiences: postWashExperiences.length,
    brandSpecificWashExperiences: brandSpecificWashExperiences.length,
    examples: postWashExperiences.slice(0, 2)
  });
  
  // Only include wash care section if customers actually shared post-wash experiences
  let recommendation = null;
  let confidence: 'low' | 'medium' | 'high' = 'low';
  
  // Extract actual wash care evidence from ALL external reviews (Reddit, Substack, etc.)
  const washCareEvidence = extractWashCareEvidence(results, brand);
  
  if (washCareEvidence.length > 0) {
    const washQuote = washCareEvidence[0].substring(0, 140) + '...';
    
    // Get source information for wash care evidence
    const washSources = extractSourcesFromEvidence(results, washCareEvidence);
    const washSourceText = washSources.length > 0 ? ` (from ${washSources.join(', ')})` : '';
    
    // Determine if experiences are mostly positive or negative based on all text
    const negativeWashWords = ['shrink', 'shrank', 'shrunk', 'faded', 'pilled', 'stretched', 'lost shape', 'fell apart'];
    const positiveWashWords = ['holds up', 'maintained', 'kept shape', 'washes well', 'easy care'];
    
    const negativeCount = negativeWashWords.reduce((count, word) => 
      count + (allText.match(new RegExp(word, 'gi')) || []).length, 0);
    const positiveCount = positiveWashWords.reduce((count, word) => 
      count + (allText.match(new RegExp(word, 'gi')) || []).length, 0);
    
    // Prioritize brand-specific experiences but include all relevant wash experiences
    if (brandSpecificWashExperiences.length > 0) {
      if (negativeCount > positiveCount) {
        recommendation = `External customer reviews report post-wash issues${washSourceText}. One person shared: "${washQuote}" Take extra care when washing.`;
        confidence = brandSpecificWashExperiences.length >= 2 ? 'medium' : 'low';
      } else {
        recommendation = `External reviews indicate items hold up well after washing${washSourceText}. A customer noted: "${washQuote}"`;
        confidence = brandSpecificWashExperiences.length >= 2 ? 'medium' : 'low';
      }
    } else if (postWashExperiences.length >= 2) {
      // Include wash experiences from external sources even if not brand-specific
      if (negativeCount > positiveCount) {
        recommendation = `Some external reviews mention wash-related concerns${washSourceText}. "${washQuote}" Consider care instructions carefully.`;
        confidence = 'low';
      } else {
        recommendation = `Post-wash feedback from external sources is generally positive${washSourceText}. "${washQuote}"`;
        confidence = 'low';
      }
    }
  }
  
  // If no meaningful post-wash experiences found, skip wash care section entirely
  console.log(`🔍 ANALYSIS: ${recommendation ? 'Including' : 'Skipping'} wash care section for ${brand}`);
  
  if (recommendation) {
    console.log(`🔍 ANALYSIS: Wash recommendation for ${brand}:`, recommendation);
    
    analysis.washCare = {
      recommendation,
      confidence,
      evidence: extractWashCareEvidence(results, brand)
    };
  } else {
    console.log(`🔍 ANALYSIS: No significant wash-specific data found for ${brand} - skipping washCare section`);
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
  const positiveKeywords = ['high quality', 'well-made', 'durable', 'excellent', 'premium', 'love the quality'];
  const negativeKeywords = ['poor quality', 'cheap', 'flimsy', 'falls apart', 'disappointed'];
  
  const keywords = isPositive ? positiveKeywords : negativeKeywords;
  
  for (const result of results.slice(0, 8)) {
    const text = `${result.title} ${result.snippet}`.toLowerCase();
    if (keywords.some(k => text.includes(k))) {
      const snippet = result.snippet?.substring(0, 120) + '...';
      if (snippet && !evidence.includes(snippet)) {
        evidence.push(snippet);
      }
    }
    if (evidence.length >= 3) break;
  }
  
  return evidence;
}

function extractWashCareEvidence(results: SerperResult[], brand: string): string[] {
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
function generateDetailedSummary(analysis: AnalysisResult, results: SerperResult[], brand: string): string {
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
  
  // Add fit information with actual quotes
  if (analysis.fit) {
    // Extract the key insight from the recommendation without the customer quote
    const fitInsight = analysis.fit.recommendation.split('.')[0]; // Get first sentence
    const hasQuote = analysis.fit.recommendation.includes('"');
    
    if (analysis.fit.confidence === 'high') {
      summaryParts.push(`${brand} consistently ${fitInsight.toLowerCase().replace('reviews indicate this brand tends to ', '').replace('reviews suggest this brand ', '').replace('customer reviews indicate ', '')}`);
    } else if (analysis.fit.confidence === 'medium') {
      summaryParts.push(`${brand} generally ${fitInsight.toLowerCase().replace('reviews indicate this brand tends to ', '').replace('reviews suggest this brand ', '').replace('customer reviews indicate ', '')}, though experiences may vary by item`);
    } else {
      summaryParts.push(`${brand} sizing feedback is mixed, with some reports of ${fitInsight.toLowerCase().replace('reviews indicate this brand tends to ', '').replace('reviews suggest this brand ', '').replace('customer reviews indicate ', '')}`);
    }
  }
  
  // Add quality assessment with actual feedback
  if (analysis.quality) {
    let qualityText = '';
    
    if (analysis.quality.recommendation.includes('consistently praise')) {
      qualityText = analysis.quality.confidence === 'high' 
        ? '. Customers consistently praise quality and construction'
        : '. Most reviews highlight good quality';
    } else if (analysis.quality.recommendation.includes('positive about quality')) {
      qualityText = '. Reviews are generally positive about build quality';
    } else if (analysis.quality.recommendation.includes('Mixed quality')) {
      qualityText = '. Quality feedback is mixed across different items';
    } else if (analysis.quality.recommendation.includes('concerns reported')) {
      qualityText = '. Some customers have raised quality concerns';
    }
    
    if (summaryParts.length > 0) {
      summaryParts[summaryParts.length - 1] += qualityText;
    } else {
      summaryParts.push(qualityText.replace('. ', ''));
    }
  }
  
  // Add fabric/material insights if available
  if (analysis.fabric && analysis.fabric.recommendation) {
    const fabricInfo = analysis.fabric.recommendation.split('.')[0]; // Get material info without quotes
    if (fabricInfo.includes('mention materials:')) {
      const materials = fabricInfo.split('mention materials:')[1].trim();
      summaryParts[summaryParts.length - 1] += `, with commonly mentioned materials being ${materials}`;
    } else if (fabricInfo.includes('describe fabric as')) {
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
    return `Found ${totalReviews} results for ${brand}. Review content includes varying experiences with fit and quality. Individual product reviews provide more specific insights.`;
  }
  
  // Join parts and ensure proper sentence structure
  let summary = summaryParts.join('');
  
  // Ensure it ends with a period
  if (!summary.endsWith('.')) {
    summary += '.';
  }
  
  return summary;
}