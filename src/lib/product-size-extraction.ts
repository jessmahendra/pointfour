/**
 * Product Size Extraction Utility
 * Extracts available product sizes from e-commerce product pages
 * Supports Shopify and other common platforms with fallback to LLM
 */

import { llmService } from './llm-service';

export interface SizeExtractionResult {
  success: boolean;
  sizes: string[];
  method: 'shopify-json' | 'woocommerce-json' | 'llm-extraction' | 'html-parsing' | 'failed';
  error?: string;
  rawData?: unknown;
}

/**
 * Extract sizes from Shopify product page
 */
async function extractShopifySizes(html: string): Promise<string[] | null> {
  try {
    // Look for Shopify analytics meta data which contains product variants
    // Using [\s\S] instead of . with /s flag for broader compatibility
    const metaMatch = html.match(/var meta = ({[\s\S]*?});/);

    if (metaMatch) {
      const productData = JSON.parse(metaMatch[1]);

      if (productData.product && productData.product.variants) {
        const sizes: string[] = productData.product.variants.map((variant: { public_title?: string; name?: string }) => {
          // Try to extract size from public_title or name
          const title = variant.public_title || variant.name || '';

          // Common Shopify format: "Color / Size" or just "Size"
          const parts = title.split(' / ');
          const sizePart = parts[parts.length - 1].trim();

          return sizePart;
        }).filter((size: string) => size && size.length > 0);

        // Remove duplicates
        return [...new Set(sizes)] as string[];
      }
    }

    // Try alternative Shopify JSON format
    const productJsonMatch = html.match(/<script[^>]*type=["']application\/json["'][^>]*data-product[^>]*>([\s\S]*?)<\/script>/);
    if (productJsonMatch) {
      const productData = JSON.parse(productJsonMatch[1]);
      if (productData.variants) {
        const sizes: string[] = productData.variants.map((variant: { title?: string; option2?: string; option1?: string }) => {
          return variant.title || variant.option2 || variant.option1 || '';
        }).filter((size: string) => size && size.length > 0);

        return [...new Set(sizes)] as string[];
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting Shopify sizes:', error);
    return null;
  }
}

/**
 * Extract sizes from WooCommerce product page
 */
async function extractWooCommerceSizes(html: string): Promise<string[] | null> {
  try {
    // Look for WooCommerce variation data
    const variationsMatch = html.match(/var wc_add_to_cart_variation_params = ({[\s\S]*?});/);

    if (variationsMatch) {
      const wcData = JSON.parse(variationsMatch[1]);
      if (wcData.variations) {
        const sizes: string[] = wcData.variations.map((variation: { attributes?: { attribute_pa_size?: string } }) => {
          return variation.attributes?.attribute_pa_size || '';
        }).filter((size: string) => size && size.length > 0);

        return [...new Set(sizes)] as string[];
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting WooCommerce sizes:', error);
    return null;
  }
}

/**
 * Use LLM to extract sizes from HTML when structured parsing fails
 */
async function extractSizesWithLLM(html: string, productUrl: string): Promise<string[] | null> {
  try {
    console.log('🤖 Using LLM to extract sizes from product page...');

    // Truncate HTML to reduce token usage - focus on key areas
    const relevantSections = [
      html.match(/<select[^>]*(?:size|variant)[^>]*>[\s\S]*?<\/select>/i)?.[0] || '',
      html.match(/<div[^>]*(?:size|variant|option)[^>]*>[\s\S]*?<\/div>/i)?.[0] || '',
      html.match(/sizes?[\s\S]*?:[\s\S]*?\[[\s\S]*?\]/i)?.[0] || '',
    ].filter(Boolean).join('\n');

    const truncatedHtml = relevantSections.substring(0, 5000); // Limit to 5000 chars

    const prompt = `Extract the available product sizes from this e-commerce product page HTML.

Product URL: ${productUrl}

HTML excerpt:
${truncatedHtml}

Instructions:
- Return ONLY the available sizes as a comma-separated list
- Extract sizes exactly as they appear (e.g., "XS/S, S/M, M/L" or "XS, S, M, L, XL")
- Do not include colors, materials, or other variants
- If no sizes found, return "NONE"

Format: size1, size2, size3`;

    const { text } = await llmService.generateText(prompt, {
      temperature: 0.1, // Low temperature for factual extraction
      maxTokens: 100,
    });

    const response = text.trim();

    if (response === 'NONE' || !response) {
      return null;
    }

    // Parse comma-separated sizes
    const sizes = response.split(',').map(s => s.trim()).filter(s => s.length > 0);

    console.log('✅ LLM extracted sizes:', sizes);
    return sizes;
  } catch (error) {
    console.error('Error extracting sizes with LLM:', error);
    return null;
  }
}

/**
 * Check if URL is a collection page (not a specific product)
 */
function isCollectionUrl(url: string): boolean {
  // Common patterns for collection URLs
  const collectionPatterns = [
    /\/collections\/[^/]+$/,  // ends with /collections/name
    /\/collections\/[^/]+\/?$/,  // ends with /collections/name or /collections/name/
  ];

  return collectionPatterns.some(pattern => pattern.test(url));
}

/**
 * Main function to extract product sizes from a product URL
 */
export async function extractProductSizes(productUrl: string): Promise<SizeExtractionResult> {
  console.log(`🔍 Extracting sizes from: ${productUrl}`);

  // Check if this is a collection URL (not a specific product)
  if (isCollectionUrl(productUrl)) {
    console.log(`⚠️ URL appears to be a collection page, not a specific product. Cannot extract sizes.`);
    return {
      success: false,
      sizes: [],
      method: 'failed',
      error: 'URL is a collection page, not a specific product page. Please use the specific product URL.',
    };
  }

  try {
    // Fetch the product page HTML
    const response = await fetch(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        sizes: [],
        method: 'failed',
        error: `Failed to fetch product page: ${response.status} ${response.statusText}`,
      };
    }

    const html = await response.text();

    // Try Shopify extraction first (most common)
    const shopifySizes = await extractShopifySizes(html);
    if (shopifySizes && shopifySizes.length > 0) {
      console.log('✅ Extracted sizes via Shopify JSON:', shopifySizes);
      return {
        success: true,
        sizes: shopifySizes,
        method: 'shopify-json',
      };
    }

    // Try WooCommerce extraction
    const wooSizes = await extractWooCommerceSizes(html);
    if (wooSizes && wooSizes.length > 0) {
      console.log('✅ Extracted sizes via WooCommerce JSON:', wooSizes);
      return {
        success: true,
        sizes: wooSizes,
        method: 'woocommerce-json',
      };
    }

    // Fallback to LLM extraction
    const llmSizes = await extractSizesWithLLM(html, productUrl);
    if (llmSizes && llmSizes.length > 0) {
      return {
        success: true,
        sizes: llmSizes,
        method: 'llm-extraction',
      };
    }

    // No sizes found
    console.log('⚠️ Could not extract sizes from product page');
    return {
      success: false,
      sizes: [],
      method: 'failed',
      error: 'Could not find size information on product page',
    };

  } catch (error) {
    console.error('Error in extractProductSizes:', error);
    return {
      success: false,
      sizes: [],
      method: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
