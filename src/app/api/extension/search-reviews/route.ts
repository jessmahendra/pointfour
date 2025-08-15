/* app/api/extension/search-reviews/route.ts */

import type { NextRequest } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

/** Ensure Node runtime (not Edge) for axios/cheerio */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* -------------------------
   Config
-------------------------- */
const DEFAULT_GL = process.env.SERPER_GL || 'uk';
const DEFAULT_HL = process.env.SERPER_HL || 'en';

const SEARCH_CONFIG = {
  enabled: true,
  maxResults: 25, // Increased from 15 for better coverage
  cacheTimeout: 60 * 60 * 1000,          // 1 hour (full result cache)
  brandFitCacheTimeout: 7 * 24 * 60 * 60 * 1000,  // 1 week
  itemReviewCacheTimeout: 30 * 24 * 60 * 60 * 1000, // 1 month
  
  // Refocused source targeting - prioritize written content platforms
  sources: {
    primary: [
      'reddit.com', 'substack.com'  // Main focus for detailed written reviews
    ],
    community: [
      'styleforum.net', 'thefashionspot.com', 'purseforum.com',
      'fashionista.com', 'stylebistro.com'
    ],
    fashionBlogs: [
      'medium.com', 'wordpress.com', 'blogspot.com',
      'manrepeller.com', 'thecut.com', 'refinery29.com', 'bustle.com',
      'whowhatwear.com', 'fashionista.com', 'racked.com', 'stylecaster.com'
    ],
    socialMedia: [
      'instagram.com', 'pinterest.com'  // Reduced focus, harder to parse
    ],
    videoPlatforms: [
      'youtube.com'  // Keep YouTube for detailed video reviews
    ],
    fashionPublications: [
      'vogue.com', 'elle.com', 'cosmopolitan.com', 'glamour.com',
      'instyle.com', 'people.com', 'usmagazine.com'
    ],
    shoppingPlatforms: [
      'shopbop.com', 'revolve.com', 'nordstrom.com', 'bloomingdales.com',
      'saksfifthavenue.com', 'neimanmarcus.com', 'bergdorfgoodman.com'
    ]
  },
  
  queries: {
    // Primary focus: Reddit and Substack for detailed written reviews
    brandFitSummary:
      '"{brand}" ("runs small" OR "fits large" OR "true to size" OR "size up" OR "size down" OR "sizing" OR "fit review" OR "measurements" OR "how does it fit") (site:reddit.com OR site:substack.com) -"click here" -"read more" -"advertisement"',
    
    itemSpecificReviews:
      '"{brand} {itemName}" (review OR "fit review" OR sizing OR "how does it fit" OR "fit check" OR "size up" OR "size down" OR "runs small" OR "runs large" OR measurements OR "body type" OR "height" OR "weight") (site:reddit.com OR site:substack.com OR site:medium.com OR site:styleforum.net) -"click here" -"read more" -"advertisement"',
    
    itemQualityReviews:
      '"{brand} {itemName}" (quality OR "after wash" OR shrunk OR pilled OR faded OR durability OR "fabric feel" OR material OR "how it holds up" OR "wear and tear" OR "care instructions" OR "washing") (site:reddit.com OR site:substack.com OR site:medium.com OR site:styleforum.net) -"click here" -"read more" -"advertisement"',
    
    itemStyleReviews:
      '"{brand} {itemName}" (styling OR "how to wear" OR "outfit ideas" OR "lookbook" OR "street style" OR "fashion inspiration" OR "versatile" OR "dress up" OR "dress down") (site:reddit.com OR site:substack.com OR site:pinterest.com) -"click here" -"read more" -"advertisement"',
    
    qualityPostCare:
      '("{brand}" OR "{itemName}") ("after wash" OR shrunk OR pilled OR faded OR "care instructions" OR "washing tips" OR "maintenance" OR "longevity") (site:reddit.com OR site:substack.com OR site:medium.com) -"click here" -"read more" -"advertisement"',
    
    brandGeneralReviews:
      '"{brand}" (review OR "brand review" OR "overall quality" OR "worth it" OR "recommend" OR "experience" OR "sizing guide" OR "fit guide") (site:reddit.com OR site:substack.com OR site:styleforum.net OR site:medium.com) -"click here" -"read more" -"advertisement"',
    
    // Enhanced Reddit-specific searches for better community content
    redditSpecific:
      '"{brand} {itemName}" (review OR "fit review" OR sizing OR "how does it fit") site:reddit.com/r/femalefashionadvice OR site:reddit.com/r/malefashionadvice OR site:reddit.com/r/fashion OR site:reddit.com/r/outfits -"click here" -"read more" -"advertisement"',
    
    // Enhanced Substack searches for fashion newsletters
    substackSpecific:
      '"{brand} {itemName}" (review OR "fit review" OR sizing OR "fashion review" OR "style review") site:substack.com -"click here" -"read more" -"advertisement"'
  },
  
  fitKeywords: [
    'runs small', 'runs large', 'true to size', 'size up', 'size down',
    'fits small', 'fits large', 'fits true', 'sizing', 'fit review',
    'how does it fit', 'fit check', 'size recommendation', 'measurements',
    'bust', 'waist', 'hips', 'length', 'inseam', 'shoulder width',
    'body type', 'height', 'weight', 'petite', 'tall', 'curvy'
  ],
  
  qualityKeywords: [
    'pilled', 'shrunk', 'faded', 'after wash', 'stitching', 'durability',
    'fabric feel', 'quality', 'material', 'construction', 'comfort',
    'soft', 'rough', 'stretchy', 'rigid', 'breathable', 'wrinkle-resistant',
    'easy care', 'maintenance', 'longevity', 'investment piece',
    'care instructions', 'washing', 'dry clean', 'iron'
  ],
  
  styleKeywords: [
    'styling', 'outfit', 'lookbook', 'street style', 'fashion inspiration',
    'how to wear', 'versatile', 'dress up', 'dress down', 'casual',
    'formal', 'work appropriate', 'weekend', 'special occasion',
    'layering', 'accessories', 'shoes', 'jewelry'
  ]
};

/* -------------------------
   In-memory caches
-------------------------- */
type TSCache<T> = Map<string, { results: T; timestamp: number }>;
const searchCache: TSCache<SearchResults> = new Map();
const brandFitCache: TSCache<{ brandFitSummary: BrandFitSummary | null }> = new Map();

/* -------------------------
   Serper
-------------------------- */
const SERPER_API_URL = 'https://google.serper.dev/search';
const SERPER_API_KEY = process.env.SERPER_API_KEY;

/* -------------------------
   Types
-------------------------- */
interface SearchResult {
  title: string;
  snippet: string;
  link: string;
  source?: string;
  isFallback?: boolean;
}

interface ProcessedResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
  tags: string[];
  confidence: 'high' | 'medium' | 'low';
  brandLevel: boolean;
  fullContent: string;
  isFallback?: boolean;
}

interface BrandFitSummary {
  summary: string | null;
  confidence: 'high' | 'medium' | 'low';
  sources: string[];
  totalResults: number;
}

interface SearchResults {
  brandFitSummary: BrandFitSummary | null;
  reviews: ProcessedResult[];
  groupedReviews: {
    primary: ProcessedResult[];
    community: ProcessedResult[];
    blogs: ProcessedResult[];
    videos: ProcessedResult[];
    social: ProcessedResult[];
    publications: ProcessedResult[];
    other: ProcessedResult[];
  };
  totalResults: number;
  isFallback?: boolean;
  searchQueries: {
    brandFitSummary: string;
    itemSpecificReviews: string | null;
    itemQualityReviews: string | null;
    itemStyleReviews: string | null;
    qualityPostCare: string;
    brandGeneralReviews: string;
    redditSpecific: string | null;
    substackSpecific: string | null;
  };
}

/* -------------------------
   Helpers
-------------------------- */
function normalize(str = '') {
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

function extractSourceDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^(www|m|old)\./, '');
  } catch {
    return 'unknown';
  }
}

function corsHeaders(origin: string | null) {
  const isExtension = origin?.startsWith('chrome-extension://');
  const allowOrigin = isExtension ? origin! : '*';
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

/* -------------------------
   HTML extraction
-------------------------- */
function cleanHtmlContent(html: string): string {
  try {
    const $ = cheerio.load(html);
    $('script, style, nav, header, footer, noscript, iframe, .ad, .advertisement').remove();

    // Enhanced selectors for Reddit and Substack content
    const mainSelectors = [
      // Reddit-specific selectors
      '[data-testid="comment-top-level"]', // Reddit comments
      '.RichTextJSON-root', // Reddit rich text
      '.comment', // Reddit comment content
      '.usertext-body', // Reddit user text
      
      // Substack-specific selectors
      '.post-content', // Substack post content
      '.body markup', // Substack body markup
      '.entry-content', // Substack entry content
      
      // Generic content selectors
      'main', 'article', '.content', '.post-content', '.entry-content',
      '.review-content', '.product-description', 'p'
    ];

    let text = '';
    for (const sel of mainSelectors) {
      const nodes = $(sel);
      if (nodes.length) {
        text += nodes.text() + ' ';
        if (text.length > 1500) break; // Increased from 1200 for better content
      }
    }

    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-.,!?:;'"]/g, '')
      .trim()
      .slice(0, 2500); // Increased from 2000 for better content
  } catch {
    return '';
  }
}

async function fetchContentFromUrl(url: string): Promise<string> {
  try {
    const { data } = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FashionExtension/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en'
      },
      maxRedirects: 3,
      validateStatus: (s) => s >= 200 && s < 400
    });
    return cleanHtmlContent(data);
  } catch {
    return '';
  }
}

/* -------------------------
   Classification
-------------------------- */
function classifyContent(text: string, keywords: string[]):
  { tags: string[], confidence: 'high' | 'medium' | 'low' } {
  const lower = normalize(text);
  const tags: string[] = [];

  // Skip classification if text is too short or generic
  if (lower.length < 20) {
    return { tags: [], confidence: 'low' };
  }

  // Filter out generic/irrelevant content
  const genericTerms = [
    'click here', 'read more', 'continue reading', 'share this', 'follow us',
    'subscribe', 'newsletter', 'advertisement', 'sponsored', 'promoted',
    'buy now', 'shop now', 'add to cart', 'checkout', 'payment'
  ];
  
  if (genericTerms.some(term => lower.includes(term))) {
    return { tags: [], confidence: 'low' };
  }

  // high: exact phrase match with context
  const exact = keywords.filter(k => {
    const keyword = k.toLowerCase();
    if (lower.includes(keyword)) {
      // Check if the keyword appears in meaningful context
      const index = lower.indexOf(keyword);
      const before = lower.substring(Math.max(0, index - 30), index);
      const after = lower.substring(index + keyword.length, index + 50);
      
      // Look for fashion-related context around the keyword
      const fashionContext = /(brand|fit|size|style|quality|fabric|material|clothing|dress|shirt|pants|shoes)/i;
      return fashionContext.test(before + after);
    }
    return false;
  });
  
  if (exact.length) return { tags: exact, confidence: 'high' };

  // medium: any keyword token with fashion context
  const medium = keywords.filter(k => {
    const words = k.split(' ');
    const hasKeyword = words.some(w => lower.includes(w.toLowerCase()));
    
    if (hasKeyword) {
      // Check for fashion context
      const fashionContext = /(brand|fit|size|style|quality|fabric|material|clothing|dress|shirt|pants|shoes)/i;
      return fashionContext.test(lower);
    }
    return false;
  });
  
  if (medium.length) return { tags: medium, confidence: 'medium' };

  // low: any keyword without context validation
  const low = keywords.filter(k => lower.includes(k.toLowerCase()));
  return { tags: low, confidence: 'low' };
}

/** Map varied fit tags to canonical buckets for summaries */
function canonicalFit(tag: string): 'runs small' | 'true to size' | 'runs large' | null {
  const t = tag.toLowerCase();
  if (t.includes('runs small') || t.includes('size up') || t.includes('fits small')) return 'runs small';
  if (t.includes('true to size') || t.includes('fits true') || t === 'tts') return 'true to size';
  if (t.includes('runs large') || t.includes('size down') || t.includes('fits large')) return 'runs large';
  return null;
}

/* -------------------------
   Serper search
-------------------------- */
async function searchWithSerper(query: string, num = 10, gl = DEFAULT_GL, hl = DEFAULT_HL): Promise<SearchResult[]> {
  if (!SERPER_API_KEY) throw new Error('SERPER_API_KEY not configured');

  try {
    const body = { q: query, num, gl, hl };
    const headers = { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' as const };

    const { data } = await axios.post(SERPER_API_URL, body, { headers, timeout: 15000 });
    const organic = Array.isArray(data?.organic) ? data.organic : [];
    return organic.map((o: { title?: string; snippet?: string; link?: string; url?: string }) => ({
      title: o.title || '',
      snippet: o.snippet || '',
      link: o.link || o.url || ''
    })).filter((x: SearchResult) => !!x.link);
  } catch (error) {
    console.error('Serper API error:', error);
    
    // Check if it's an authorization error
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      console.log('Serper API authorization failed - no fallback data provided');
      return [];
    }
    
    throw error;
  }
}

// No mock data fallback - return empty results when API fails
function handleSearchFailure(query: string, error: unknown): SearchResult[] {
  console.error('Search failed for query:', query, 'Error:', error);
  return [];
}

/* -------------------------
   Queries
-------------------------- */
function buildSearchQueries(brand: string, itemName = '') {
  const q = SEARCH_CONFIG.queries;
  return {
    brandFitSummary: q.brandFitSummary.replaceAll('{brand}', brand),
    itemSpecificReviews: itemName
      ? q.itemSpecificReviews.replaceAll('{brand}', brand).replaceAll('{itemName}', itemName)
      : null,
    itemQualityReviews: itemName
      ? q.itemQualityReviews.replaceAll('{brand}', brand).replaceAll('{itemName}', itemName)
      : null,
    itemStyleReviews: itemName
      ? q.itemStyleReviews.replaceAll('{brand}', brand).replaceAll('{itemName}', itemName)
      : null,
    qualityPostCare: (itemName ? q.qualityPostCare : q.qualityPostCare)
      .replaceAll('{brand}', brand)
      .replaceAll('{itemName}', itemName || brand),
    brandGeneralReviews: q.brandGeneralReviews.replaceAll('{brand}', brand),
    redditSpecific: itemName
      ? q.redditSpecific.replaceAll('{brand}', brand).replaceAll('{itemName}', itemName)
      : null,
    substackSpecific: itemName
      ? q.substackSpecific.replaceAll('{brand}', brand).replaceAll('{itemName}', itemName)
      : null
  };
}

/* -------------------------
   Processing with limited concurrency
-------------------------- */
async function processSearchResults(
  results: SearchResult[],
  brand: string,
  itemName = ''
): Promise<ProcessedResult[]> {
  const max = SEARCH_CONFIG.maxResults;
  const shortlist = results.slice(0, max * 2); // overfetch a bit

  // quick snippet pass
  const prelim = shortlist.map(r => {
    const fit = classifyContent(r.snippet || '', SEARCH_CONFIG.fitKeywords);
    const qual = classifyContent(r.snippet || '', SEARCH_CONFIG.qualityKeywords);
    const style = classifyContent(r.snippet || '', SEARCH_CONFIG.styleKeywords);
    
    // Only consider results with meaningful fashion content
    const hasSignal = (fit.tags.length > 0 || qual.tags.length > 0 || style.tags.length > 0) &&
                     (fit.confidence === 'high' || qual.confidence === 'high' || style.confidence === 'high');
    
    return { r, fit, qual, style, hasSignal };
  });

  const candidates = prelim.filter(p => p.hasSignal).slice(0, max);

  // fetch in small parallel batches
  const CONCURRENCY = 4;
  const out: ProcessedResult[] = [];

  for (let i = 0; i < candidates.length; i += CONCURRENCY) {
    const batch = candidates.slice(i, i + CONCURRENCY).map(async p => {
      const { r } = p;
      const additional = await fetchContentFromUrl(r.link);
      const fullText = `${r.snippet} ${additional}`.trim();

      const fit = classifyContent(fullText, SEARCH_CONFIG.fitKeywords);
      const qual = classifyContent(fullText, SEARCH_CONFIG.qualityKeywords);
      const style = classifyContent(fullText, SEARCH_CONFIG.styleKeywords);

      if (!fit.tags.length && !qual.tags.length && !style.tags.length) return null;

      const brandLevel = !itemName || fullText.toLowerCase().includes(brand.toLowerCase());
      const confidence =
        (fit.confidence === 'high' || qual.confidence === 'high' || style.confidence === 'high') ? 'high' :
        (fit.confidence === 'medium' || qual.confidence === 'medium' || style.confidence === 'medium') ? 'medium' : 'low';

      return {
        title: r.title,
        snippet: r.snippet,
        url: r.link,
        source: extractSourceDomain(r.link),
        tags: [...fit.tags, ...qual.tags, ...style.tags],
        confidence,
        brandLevel,
        fullContent: fullText.slice(0, 500),
        isFallback: r.isFallback || false
      } as ProcessedResult;
    });

    const batchResults = await Promise.all(batch);
    out.push(...(batchResults.filter(Boolean) as ProcessedResult[]));
  }

  // Deduplicate by URL and truncate
  const seen = new Set<string>();
  const dedup = out.filter(r => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  return dedup.slice(0, max);
}

/* -------------------------
   Brand fit summary
-------------------------- */
function generateBrandFitSummary(results: ProcessedResult[]): BrandFitSummary | null {
  // Only consider results that have actual fit-related content
  const fitResults = results.filter(r =>
    r.brandLevel &&
    r.tags.some(tag => canonicalFit(tag) !== null) &&
    r.fullContent && r.fullContent.length > 50 // Must have substantial content
  );

  if (!fitResults.length) {
    return null;
  }

  // Enhanced fit analysis with more nuanced patterns
  const fitAnalysis = {
    'runs small': { count: 0, confidence: 0, examples: [] as string[], contexts: [] as string[] },
    'true to size': { count: 0, confidence: 0, examples: [] as string[], contexts: [] as string[] },
    'runs large': { count: 0, confidence: 0, examples: [] as string[], contexts: [] as string[] },
    'inconsistent': { count: 0, confidence: 0, examples: [] as string[], contexts: [] as string[] },
    'category specific': { count: 0, confidence: 0, examples: [] as string[], contexts: [] as string[] }
  };

  // Process each fit-related result with more sophisticated analysis
  fitResults.forEach(result => {
    const content = result.fullContent.toLowerCase();
    const title = result.title.toLowerCase();
    
    // Look for specific fit indicators with context
    if (content.includes('runs small') || content.includes('size up') || content.includes('fits small') || 
        content.includes('too small') || content.includes('tight fit') || content.includes('smaller than expected')) {
      fitAnalysis['runs small'].count++;
      fitAnalysis['runs small'].examples.push(result.title);
      // Extract context around the fit mention
      const context = extractFitContext(content, ['runs small', 'size up', 'fits small', 'too small', 'tight fit']);
      if (context) fitAnalysis['runs small'].contexts.push(context);
    }
    
    if (content.includes('true to size') || content.includes('fits true') || content.includes('tts') ||
        content.includes('standard sizing') || content.includes('normal fit') || content.includes('fits as expected') ||
        content.includes('fits perfectly') || content.includes('exact fit')) {
      fitAnalysis['true to size'].count++;
      fitAnalysis['true to size'].examples.push(result.title);
      const context = extractFitContext(content, ['true to size', 'fits true', 'tts', 'standard sizing', 'normal fit']);
      if (context) fitAnalysis['true to size'].contexts.push(context);
    }
    
    if (content.includes('runs large') || content.includes('size down') || content.includes('fits large') ||
        content.includes('too big') || content.includes('loose fit') || content.includes('oversized') ||
        content.includes('larger than expected')) {
      fitAnalysis['runs large'].count++;
      fitAnalysis['runs large'].examples.push(result.title);
      const context = extractFitContext(content, ['runs large', 'size down', 'fits large', 'too big', 'loose fit']);
      if (context) fitAnalysis['runs large'].contexts.push(context);
    }

    // Check for inconsistent sizing patterns
    if (content.includes('inconsistent') || content.includes('varies') || content.includes('depends on') ||
        content.includes('sometimes') || content.includes('hit or miss') || content.includes('unpredictable')) {
      fitAnalysis['inconsistent'].count++;
      fitAnalysis['inconsistent'].examples.push(result.title);
      const context = extractFitContext(content, ['inconsistent', 'varies', 'depends on', 'sometimes', 'hit or miss']);
      if (context) fitAnalysis['inconsistent'].contexts.push(context);
    }

    // Check for category-specific sizing
    if (content.includes('dresses') || content.includes('tops') || content.includes('bottoms') ||
        content.includes('jeans') || content.includes('shirts') || content.includes('pants') ||
        content.includes('skirts') || content.includes('outerwear')) {
      fitAnalysis['category specific'].count++;
      fitAnalysis['category specific'].examples.push(result.title);
      const context = extractFitContext(content, ['dresses', 'tops', 'bottoms', 'jeans', 'shirts', 'pants', 'skirts', 'outerwear']);
      if (context) fitAnalysis['category specific'].contexts.push(context);
    }
  });

  // Calculate confidence based on content analysis and context
  Object.keys(fitAnalysis).forEach(fitType => {
    const analysis = fitAnalysis[fitType as keyof typeof fitAnalysis];
    if (analysis.count > 0) {
      // Higher confidence for more specific mentions, longer content, and better context
      const contextBonus = analysis.contexts.length > 0 ? 0.2 : 0;
      const contentBonus = analysis.examples.some(ex => ex.length > 20) ? 0.1 : 0;
      analysis.confidence = Math.min(1, analysis.count / 3 + contextBonus + contentBonus);
    }
  });

  // Find the most common fit pattern
  const topFit = Object.entries(fitAnalysis)
    .filter(([_, data]) => data.count > 0)
    .sort(([_, a], [__, b]) => b.count - a.count)[0];

  if (!topFit || topFit[1].count === 0) {
    return null;
  }

  const [fitType, data] = topFit;
  
  // Generate a more nuanced and specific summary based on actual content
  let summary: string;
  const totalFitMentions = Object.values(fitAnalysis).reduce((sum, data) => sum + data.count, 0);
  
  if (fitType === 'runs small') {
    if (data.contexts.length > 0) {
      // Use actual context from reviews
      const context = data.contexts[0];
      summary = `Based on ${data.count} review${data.count > 1 ? 's' : ''}, this brand tends to run small. ${context}`;
    } else {
      summary = `Based on ${data.count} review${data.count > 1 ? 's' : ''}, this brand tends to run small. Consider sizing up for a comfortable fit.`;
    }
  } else if (fitType === 'true to size') {
    if (data.contexts.length > 0) {
      const context = data.contexts[0];
      summary = `Based on ${data.count} review${data.count > 1 ? 's' : ''}, this brand generally runs true to size. ${context}`;
    } else {
      summary = `Based on ${data.count} review${data.count > 1 ? 's' : ''}, this brand generally runs true to size. You can typically order your usual size.`;
    }
  } else if (fitType === 'runs large') {
    if (data.contexts.length > 0) {
      const context = data.contexts[0];
      summary = `Based on ${data.count} review${data.count > 1 ? 's' : ''}, this brand tends to run large. ${context}`;
    } else {
      summary = `Based on ${data.count} review${data.count > 1 ? 's' : ''}, this brand tends to run large. Consider sizing down for a better fit.`;
    }
  } else if (fitType === 'inconsistent') {
    summary = `Based on ${data.count} review${data.count > 1 ? 's' : ''}, sizing for this brand can be inconsistent. It's recommended to check specific item reviews or size charts.`;
  } else if (fitType === 'category specific') {
    summary = `Based on ${data.count} review${data.count > 1 ? 's' : ''}, sizing varies by category for this brand. Check individual item reviews for specific fit advice.`;
  } else {
    summary = `Based on ${data.count} review${data.count > 1 ? 's' : ''}, fit information is available but varies. Check individual reviews for specific sizing advice.`;
  }

  // Add additional context if available
  if (totalFitMentions > data.count) {
    const otherMentions = Object.entries(fitAnalysis)
      .filter(([key, d]) => key !== fitType && d.count > 0)
      .map(([key, d]) => `${d.count} ${key.replace(' ', ' ')}`)
      .join(', ');
    
    if (otherMentions) {
      summary += ` Other patterns found: ${otherMentions}.`;
    }
  }

  // Calculate overall confidence
  const confidence: BrandFitSummary['confidence'] = 
    data.confidence >= 0.8 && data.count >= 3 ? 'high' :
    data.confidence >= 0.5 && data.count >= 2 ? 'medium' : 'low';

  // Only include relevant sources (filter out generic platforms)
  const relevantSources = [...new Set(fitResults.map(r => r.source))]
    .filter(source => {
      const lowerSource = source.toLowerCase();
      // Filter out generic platforms that don't provide specific brand insights
      return !lowerSource.includes('reddit.com') && 
             !lowerSource.includes('google.com') &&
             !lowerSource.includes('youtube.com') &&
             !lowerSource.includes('pinterest.com');
    })
    .filter(Boolean) as string[];

  return { 
    summary, 
    confidence, 
    sources: relevantSources.length > 0 ? relevantSources : ['various sources'], 
    totalResults: fitResults.length 
  };
}

// Helper function to extract context around fit mentions
function extractFitContext(content: string, keywords: string[]): string | null {
  for (const keyword of keywords) {
    const index = content.indexOf(keyword);
    if (index !== -1) {
      // Extract context around the keyword (50 characters before and after)
      const start = Math.max(0, index - 50);
      const end = Math.min(content.length, index + keyword.length + 50);
      let context = content.substring(start, end);
      
      // Clean up the context
      context = context.replace(/\s+/g, ' ').trim();
      
      // Only return if we have meaningful context
      if (context.length > 20 && !context.includes('click here') && !context.includes('read more')) {
        return context;
      }
    }
  }
  return null;
}

/* -------------------------
   Main search with caching
-------------------------- */
async function searchForReviews(brandName: string, itemName = ''): Promise<SearchResults> {
  const cacheKey = `${brandName}::${itemName}`.toLowerCase();

  // Full response cache
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < SEARCH_CONFIG.cacheTimeout) {
    return cached.results;
  }

  // Brand fit summary cache (used if we can't compute later)
  const brandFitKey = brandName.toLowerCase();
  const cachedFit = brandFitCache.get(brandFitKey);
  const cachedBrandFitSummary =
    cachedFit && Date.now() - cachedFit.timestamp < SEARCH_CONFIG.brandFitCacheTimeout
      ? cachedFit.results.brandFitSummary
      : null;

  // Build and run queries
  const queries = buildSearchQueries(brandName, itemName);

  const [brandFitResults, itemResults, itemQualityResults, itemStyleResults, qualityResults, brandGeneralResults, redditResults, substackResults] = await Promise.all([
    searchWithSerper(queries.brandFitSummary, 10),
    itemName ? searchWithSerper(queries.itemSpecificReviews!, 10) : Promise.resolve([]),
    itemName ? searchWithSerper(queries.itemQualityReviews!, 10) : Promise.resolve([]),
    itemName ? searchWithSerper(queries.itemStyleReviews!, 10) : Promise.resolve([]),
    searchWithSerper(queries.qualityPostCare, 10),
    searchWithSerper(queries.brandGeneralReviews, 10),
    itemName ? searchWithSerper(queries.redditSpecific!, 8) : Promise.resolve([]),
    itemName ? searchWithSerper(queries.substackSpecific!, 8) : Promise.resolve([])
  ]);

  // Merge & dedup by URL
  const allResults = [...brandFitResults, ...itemResults, ...itemQualityResults, ...itemStyleResults, ...qualityResults, ...brandGeneralResults, ...redditResults, ...substackResults];
  const unique = allResults.filter((r, i, arr) =>
    i === arr.findIndex(x => x.link === r.link)
  );

  // Process (classify + fetch page text)
  const processedResults = await processSearchResults(unique, brandName, itemName);

  // Brand fit summary (prefer fresh; otherwise cached)
  const computedSummary = generateBrandFitSummary(processedResults);
  const brandFitSummary = computedSummary ?? cachedBrandFitSummary ?? null;

  // Grouping
  const primaryDomains = new Set(['reddit.com', 'substack.com']);  // Primary focus
  const communityDomains = new Set(['styleforum.net', 'thefashionspot.com', 'purseforum.com', 'fashionista.com', 'stylebistro.com']);
  const blogDomains = new Set(['medium.com', 'wordpress.com', 'blogspot.com', 'manrepeller.com', 'thecut.com', 'refinery29.com', 'bustle.com', 'whowhatwear.com', 'fashionista.com', 'racked.com', 'stylecaster.com']);
  const videoDomains = new Set(['youtube.com']);
  const socialDomains = new Set(['instagram.com', 'pinterest.com']);
  const publicationDomains = new Set(['vogue.com', 'elle.com', 'cosmopolitan.com', 'glamour.com', 'instyle.com', 'people.com', 'usmagazine.com']);

  const groupedReviews = {
    primary: processedResults.filter(r => primaryDomains.has(r.source)),
    community: processedResults.filter(r => communityDomains.has(r.source)),
    blogs: processedResults.filter(r => blogDomains.has(r.source)),
    videos: processedResults.filter(r => videoDomains.has(r.source)),
    social: processedResults.filter(r => socialDomains.has(r.source)),
    publications: processedResults.filter(r => publicationDomains.has(r.source)),
    other: processedResults.filter(r =>
      !primaryDomains.has(r.source) &&
      !communityDomains.has(r.source) &&
      !blogDomains.has(r.source) &&
      !videoDomains.has(r.source) &&
      !socialDomains.has(r.source) &&
      !publicationDomains.has(r.source)
    )
  };

  const results: SearchResults = {
    brandFitSummary,
    reviews: processedResults,
    groupedReviews,
    totalResults: processedResults.length,
    isFallback: processedResults.some(r => r.isFallback),
    searchQueries: {
      brandFitSummary: queries.brandFitSummary,
      itemSpecificReviews: queries.itemSpecificReviews,
      itemQualityReviews: queries.itemQualityReviews,
      itemStyleReviews: queries.itemStyleReviews,
      qualityPostCare: queries.qualityPostCare,
      brandGeneralReviews: queries.brandGeneralReviews,
      redditSpecific: queries.redditSpecific,
      substackSpecific: queries.substackSpecific
    }
  };

  // Cache full result
  searchCache.set(cacheKey, { results, timestamp: Date.now() });

  // Refresh brand-fit cache
  brandFitCache.set(brandFitKey, {
    results: { brandFitSummary },
    timestamp: Date.now()
  });

  return results;
}

/* -------------------------
   HTTP handlers
-------------------------- */
export async function POST(request: NextRequest) {
  const headers = corsHeaders(request.headers.get('origin'));
  try {
    const { brand, itemName, gl, hl } = await request.json();

    if (!SEARCH_CONFIG.enabled) {
      return new Response(JSON.stringify({ enabled: false, error: 'Dynamic search disabled' }), { status: 200, headers });
    }

    if (!brand || typeof brand !== 'string') {
      return new Response(JSON.stringify({ error: 'Brand parameter is required' }), { status: 400, headers });
    }

    if (!SERPER_API_KEY) {
      return new Response(JSON.stringify({
        error: 'Search API not configured',
        details: 'SERPER_API_KEY not found in environment variables'
      }), { status: 500, headers });
    }

    // Optionally override locale for this request
    if (gl || hl) {
      (global as { SERPER_GL?: string; SERPER_HL?: string }).SERPER_GL = gl || DEFAULT_GL;
      (global as { SERPER_GL?: string; SERPER_HL?: string }).SERPER_HL = hl || DEFAULT_HL;
    }

    console.log('🔍 Dynamic search:', { brand, itemName: itemName || null });

    const data = await searchForReviews(brand, itemName || '');

    const resp = {
      success: true,
      brand,
      itemName: itemName || null,
      brandFitSummary: data.brandFitSummary,
      reviews: data.reviews,
      groupedReviews: data.groupedReviews,
      totalResults: data.totalResults,
      isDynamic: true,
      isFallback: data.isFallback || false,
      searchQueries: data.searchQueries,
      message:
        data.totalResults > 0
          ? `Found ${data.totalResults} ${data.isFallback ? 'fallback' : 'live'} reviews for ${brand}`
          : `No reviews found for ${brand}`
    };

    return new Response(JSON.stringify(resp), { status: 200, headers });
  } catch (err: unknown) {
    console.error('Dynamic search error:', err instanceof Error ? err.message : 'Unknown error');
    return new Response(JSON.stringify({
      error: 'Dynamic search failed',
      details: err instanceof Error ? err.message : 'Unknown error'
    }), { status: 500, headers });
  }
}

export async function OPTIONS(request: NextRequest) {
  const headers = corsHeaders(request.headers.get('origin'));
  return new Response(null, { status: 200, headers });
}
