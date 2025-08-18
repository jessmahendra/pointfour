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

// Scoring function for product images
function scoreImage(url: string, alt: string, selector: string): number {
  let score = 0;
  const urlLower = url.toLowerCase();
  const altLower = alt.toLowerCase();
  const selectorLower = selector.toLowerCase();

  // Positive indicators for product-only images
  const productOnlyKeywords = [
    'packshot', 'still', 'flat', 'ghost', 'cutout', 'front', 'back', 'side', 
    'detail', 'product', 'alt', 'alternate', 'lay', 'close', 'closeup'
  ];

  // Negative indicators for model/editorial shots
  const modelKeywords = [
    'model', 'look', 'editorial', 'campaign', 'onfigure', 'on-figure', 
    'worn', 'street', 'runway', 'lifestyle', 'lookbook'
  ];

  // Check URL for positive keywords
  for (const keyword of productOnlyKeywords) {
    if (urlLower.includes(keyword)) {
      score += 10;
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

  // Shopify bonus: if URL includes /cdn/shop/files/ and _999_ in filename
  if (urlLower.includes('/cdn/shop/files/') && urlLower.includes('_999_')) {
    score += 25;
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
  try {
    const { pageUrl } = await request.json();
    
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

    // Fetch the page content
    const response = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const domain = new URL(pageUrl).hostname;

    const imageCandidates: ImageCandidate[] = [];

    // 1. Extract from JSON-LD structured data
    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const jsonData = JSON.parse($(element).html() || '{}');
        if (jsonData['@type'] === 'Product' && jsonData.image) {
          const images = Array.isArray(jsonData.image) ? jsonData.image : [jsonData.image];
          images.forEach((image: string) => {
            if (typeof image === 'string' && image.startsWith('http')) {
              const normalizedUrl = normalizeImageUrl(image, domain);
              imageCandidates.push({
                src: normalizedUrl,
                alt: '',
                selector: 'script[type="application/ld+json"]',
                score: scoreImage(normalizedUrl, '', 'json-ld')
              });
            }
          });
        }
      } catch {
        // Continue if JSON parsing fails
      }
    });

    // 2. Extract from meta tags
    $('meta[property="og:image"], meta[name="twitter:image"]').each((_, element) => {
      const content = $(element).attr('content');
      if (content && content.startsWith('http')) {
        const normalizedUrl = normalizeImageUrl(content, domain);
        imageCandidates.push({
          src: normalizedUrl,
          alt: '',
          selector: $(element).toString(),
          score: scoreImage(normalizedUrl, '', 'meta')
        });
      }
    });

    // 3. Extract from preload links
    $('link[rel="preload"][as="image"]').each((_, element) => {
      const href = $(element).attr('href');
      if (href && href.startsWith('http')) {
        const normalizedUrl = normalizeImageUrl(href, domain);
        imageCandidates.push({
          src: normalizedUrl,
          alt: '',
          selector: $(element).toString(),
          score: scoreImage(normalizedUrl, '', 'preload')
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

    productGallerySelectors.forEach(selector => {
      $(selector).each((_, element) => {
        const src = $(element).attr('src');
        const alt = $(element).attr('alt') || '';
        
        if (src && src.startsWith('http')) {
          const normalizedUrl = normalizeImageUrl(src, domain);
          imageCandidates.push({
            src: normalizedUrl,
            alt,
            selector,
            score: scoreImage(normalizedUrl, alt, selector)
          });
        }
      });
    });

    // 5. Extract from script tags with JSON data
    $('script[type="application/json"]').each((_, element) => {
      try {
        const jsonData = JSON.parse($(element).html() || '{}');
        const extractImagesFromObj = (obj: unknown, path: string = '') => {
          if (typeof obj === 'string' && obj.startsWith('http')) {
            const normalizedUrl = normalizeImageUrl(obj, domain);
            imageCandidates.push({
              src: normalizedUrl,
              alt: '',
              selector: `script[type="application/json"]${path}`,
              score: scoreImage(normalizedUrl, '', 'json-script')
            });
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

    // Sort by score (highest first)
    uniqueCandidates.sort((a, b) => b.score - a.score);

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
    return new Response(
      JSON.stringify({ 
        error: 'Failed to extract product images',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
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
