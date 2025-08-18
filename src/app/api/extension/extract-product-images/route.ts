import * as cheerio from 'cheerio';

interface ImageCandidate {
  src: string;
  alt: string;
  selector: string;
  score: number;
}

interface ExtractProductImagesResponse {
  pageUrl: string;
  bestImage: {
    src: string;
    alt: string;
    selector: string;
  } | null;
  images: ImageCandidate[];
}

// Enhanced scoring function for product images with AI-like analysis
function scoreImage(url: string, alt: string, selector: string, imageIndex: number = 0, totalImages: number = 0): number {
  let score = 0;
  const urlLower = url.toLowerCase();
  const altLower = alt.toLowerCase();
  const selectorLower = selector.toLowerCase();

  // Positive indicators for product-only images
  const productOnlyKeywords = [
    'packshot', 'still', 'flat', 'ghost', 'cutout', 'front', 'back', 'side', 
    'detail', 'product', 'alt', 'alternate', 'lay', 'close', 'closeup',
    '02', '03', '04', '05', '06', '07', '08', '09', '10' // Sequential product images
  ];

  // Negative indicators for model/editorial shots
  const modelKeywords = [
    'model', 'look', 'editorial', 'campaign', 'onfigure', 'on-figure', 
    'worn', 'street', 'runway', 'lifestyle', 'lookbook', 'hero', '01'
  ];

  // Fashion-specific positive patterns
  const fashionPositivePatterns = [
    '_flat', '_alt', '_detail', '_back', '_side', '_close', '_zoom',
    'product', 'item', 'garment', 'clothing', 'apparel'
  ];

  // Check URL for positive keywords
  for (const keyword of productOnlyKeywords) {
    if (urlLower.includes(keyword)) {
      score += 10;
    }
  }

  // Check URL for fashion-specific patterns
  for (const pattern of fashionPositivePatterns) {
    if (urlLower.includes(pattern)) {
      score += 8;
    }
  }

  // Check URL for negative keywords
  for (const keyword of modelKeywords) {
    if (urlLower.includes(keyword)) {
      score -= 15;
    }
  }

  // Check alt text for positive keywords
  for (const keyword of productOnlyKeywords) {
    if (altLower.includes(keyword)) {
      score += 8;
    }
  }

  // Check alt text for negative keywords
  for (const keyword of modelKeywords) {
    if (altLower.includes(keyword)) {
      score -= 12;
    }
  }

  // AI-like analysis: Image position scoring
  if (totalImages > 0) {
    const position = imageIndex + 1;
    
    // Fashion sites often have hero/model shot first, then product images
    if (position === 1) {
      score -= 5; // First image often has model
    } else if (position >= 4 && position <= 6) {
      score += 15; // 4th-6th images are often product-only (Rohe pattern)
    } else if (position > 6) {
      score += 8; // Later images are usually product details
    }
    
    // Bonus for being in the "sweet spot" for product images
    if (position >= 3 && position <= 7) {
      score += 10;
    }
  }

  // Shopify bonus: if URL includes /cdn/shop/files/ and _999_ in filename
  if (urlLower.includes('/cdn/shop/files/') && urlLower.includes('_999_')) {
    score += 25;
  }

  // Rohe-specific bonuses
  if (urlLower.includes('rohe') || urlLower.includes('roheframes')) {
    // Rohe often uses sequential numbering for product images
    if (/\d{2,3}/.test(urlLower)) {
      score += 12;
    }
    // Rohe product images often have specific patterns
    if (urlLower.includes('_') && /\d/.test(urlLower)) {
      score += 8;
    }
  }

  // Penalize tiny thumbnails
  if (urlLower.includes('?imwidth=') || urlLower.includes('_400x400') || 
      urlLower.includes('_300x300') || urlLower.includes('_200x200')) {
    score -= 20;
  }

  // Bonus for common product image selectors
  if (selectorLower.includes('product-image') || selectorLower.includes('product-photo')) {
    score += 5;
  }

  // Bonus for meta tags (often high quality)
  if (selectorLower.includes('meta')) {
    score += 3;
  }

  // Bonus for gallery/thumbnail selectors (often product images)
  if (selectorLower.includes('gallery') || selectorLower.includes('thumbnail')) {
    score += 4;
  }

  return score;
}

// URL normalization function
function normalizeImageUrl(url: string, domain: string): string {
  let normalized = url;

  // Remove Shopify size/crop suffixes
  normalized = normalized.replace(/_\d+x\d+_crop_[^.]*\.(jpg|png|webp)/i, '.$1');
  
  // On media.meandem.com, remove ?imwidth= param
  if (domain.includes('media.meandem.com')) {
    normalized = normalized.replace(/\?imwidth=\d+/, '');
  }

  return normalized;
}

export async function POST(request: Request) {
  let pageUrl: string = 'unknown';
  
  try {
    const body = await request.json();
    pageUrl = body.pageUrl;
    
    if (!pageUrl) {
      return new Response(
        JSON.stringify({ error: 'pageUrl parameter is required' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        }
      );
    }

    // Fetch the page content with timeout and better headers
    console.log('🔍 Fetching page:', pageUrl);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(pageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    }).finally(() => {
      clearTimeout(timeoutId);
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch page:', response.status, response.statusText);
      throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    console.log('📄 HTML length:', html.length);
    const $ = cheerio.load(html);
    const domain = new URL(pageUrl).hostname;
    console.log('🌐 Domain:', domain);

    const imageCandidates: ImageCandidate[] = [];

    // 1. Extract from JSON-LD structured data
    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const jsonData = JSON.parse($(element).html() || '{}');
        if (jsonData['@type'] === 'Product' && jsonData.image) {
          const images = Array.isArray(jsonData.image) ? jsonData.image : [jsonData.image];
          images.forEach((image: string, index: number) => {
            if (typeof image === 'string' && image.startsWith('http')) {
              const normalizedUrl = normalizeImageUrl(image, domain);
              imageCandidates.push({
                src: normalizedUrl,
                alt: '',
                selector: 'script[type="application/ld+json"]',
                score: scoreImage(normalizedUrl, '', 'json-ld', index, images.length)
              });
            }
          });
        }
      } catch {
        // Continue if JSON parsing fails
      }
    });

    // 2. Extract from meta tags
    $('meta[property="og:image"], meta[name="twitter:image"]').each((index, element) => {
      const content = $(element).attr('content');
      if (content && content.startsWith('http')) {
        const normalizedUrl = normalizeImageUrl(content, domain);
        imageCandidates.push({
          src: normalizedUrl,
          alt: '',
          selector: $(element).toString(),
          score: scoreImage(normalizedUrl, '', 'meta', index, 1)
        });
      }
    });

    // 3. Extract from preload links
    $('link[rel="preload"][as="image"]').each((index, element) => {
      const href = $(element).attr('href');
      if (href && href.startsWith('http')) {
        const normalizedUrl = normalizeImageUrl(href, domain);
        imageCandidates.push({
          src: normalizedUrl,
          alt: '',
          selector: $(element).toString(),
          score: scoreImage(normalizedUrl, '', 'preload', index, 1)
        });
      }
    });

    // 4. Extract from img elements in product gallery containers
    const productGallerySelectors = [
      '.product-gallery img',
      '.product-images img',
      '.product-photos img',
      '.gallery img',
      '.product-image img',
      '.product-photo img',
      '[class*="gallery"] img',
      '[class*="product"] img',
      'main img',
      'picture img'
    ];

    // Collect all images first to get total count for scoring
    const allImages: Array<{src: string, alt: string, selector: string}> = [];
    
    productGallerySelectors.forEach(selector => {
      $(selector).each((_, element) => {
        const src = $(element).attr('src');
        const alt = $(element).attr('alt') || '';
        
        if (src && src.startsWith('http')) {
          allImages.push({ src, alt, selector });
        }
      });
    });

    // Now score images with position information
    allImages.forEach((img, index) => {
      const normalizedUrl = normalizeImageUrl(img.src, domain);
      imageCandidates.push({
        src: normalizedUrl,
        alt: img.alt,
        selector: img.selector,
        score: scoreImage(normalizedUrl, img.alt, img.selector, index, allImages.length)
      });
    });

    // 5. Extract from script tags with JSON data
    $('script[type="application/json"]').each((scriptIndex, element) => {
      try {
        const jsonData = JSON.parse($(element).html() || '{}');
        let imageCount = 0;
        
        const extractImagesFromObj = (obj: unknown, path: string = '') => {
          if (typeof obj === 'string' && obj.startsWith('http')) {
            const normalizedUrl = normalizeImageUrl(obj, domain);
            imageCandidates.push({
              src: normalizedUrl,
              alt: '',
              selector: `script[type="application/json"]${path}`,
              score: scoreImage(normalizedUrl, '', 'json-script', imageCount, 1)
            });
            imageCount++;
          } else if (Array.isArray(obj)) {
            obj.forEach((item, index) => extractImagesFromObj(item, `${path}[${index}]`));
          } else if (obj && typeof obj === 'object') {
            Object.entries(obj).forEach(([key, value]) => 
              extractImagesFromObj(value, `${path}.${key}`)
            );
          }
        };
        extractImagesFromObj(jsonData);
      } catch {
        // Continue if JSON parsing fails
      }
    });

    // Remove duplicates based on normalized URL
    const uniqueCandidates = imageCandidates.filter((candidate, index, self) => 
      index === self.findIndex(c => c.src === candidate.src)
    );

    console.log('🖼️ Total image candidates found:', imageCandidates.length);
    console.log('🖼️ Unique candidates after deduplication:', uniqueCandidates.length);

    // Sort by score (highest first)
    uniqueCandidates.sort((a, b) => b.score - a.score);
    
    if (uniqueCandidates.length > 0) {
      console.log('🏆 Top 5 candidates with scores:');
      uniqueCandidates.slice(0, 5).forEach((candidate, index) => {
        console.log(`  ${index + 1}. Score: ${candidate.score}, URL: ${candidate.src}`);
        console.log(`     Alt: "${candidate.alt}", Selector: ${candidate.selector}`);
      });
    }

    // Get the best image (highest score)
    const bestImage = uniqueCandidates.length > 0 ? {
      src: uniqueCandidates[0].src,
      alt: uniqueCandidates[0].alt,
      selector: uniqueCandidates[0].selector
    } : null;

    const responseData: ExtractProductImagesResponse = {
      pageUrl,
      bestImage,
      images: uniqueCandidates
    };

    return new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );

  } catch (error) {
    console.error('Error extracting product images:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to extract product images';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out - site may have anti-scraping protection';
        statusCode = 408;
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Unable to access the page - site may be blocking requests';
        statusCode = 403;
      } else {
        errorMessage = error.message;
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
        pageUrl: pageUrl || 'unknown'
      }),
      { 
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
