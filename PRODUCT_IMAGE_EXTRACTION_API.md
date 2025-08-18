# Product Image Extraction API

## Overview

The Product Image Extraction API (`/api/extension/extract-product-images`) is a Next.js API route that fetches fashion product page URLs server-side and returns the best product-only (packshot/flat) image, plus all candidates ranked by relevance. It's designed to avoid model/editorial shots and prioritize clean product images.

## Features

- **Server-side HTML parsing** using Cheerio
- **Intelligent image scoring** to identify product-only images
- **Multiple extraction strategies** from various HTML sources
- **URL normalization** for different e-commerce platforms
- **Comprehensive candidate ranking** with detailed scoring

## API Endpoint

```
POST /api/extension/extract-product-images
```

### Request Body

```json
{
  "pageUrl": "https://example.com/product-page"
}
```

### Response Format

```json
{
  "pageUrl": "https://example.com/product-page",
  "bestImage": {
    "src": "https://example.com/images/product-flat.jpg",
    "alt": "Product flat lay image",
    "selector": ".product-image img"
  },
  "images": [
    {
      "src": "https://example.com/images/product-flat.jpg",
      "alt": "Product flat lay image",
      "selector": ".product-image img",
      "score": 85
    },
    {
      "src": "https://example.com/images/product-model.jpg",
      "alt": "Model wearing product",
      "selector": ".hero-image img",
      "score": 25
    }
  ]
}
```

## Image Extraction Strategies

### 1. JSON-LD Structured Data
- Parses `<script type="application/ld+json">` tags
- Extracts `Product.image` fields (string or array)
- High priority for structured data accuracy

### 2. Meta Tags
- `og:image` (Open Graph)
- `twitter:image` (Twitter Card)
- Often high-quality, curated images

### 3. Preload Links
- `<link rel="preload" as="image">` tags
- Indicates important images for the page

### 4. Product Gallery Images
- Common selectors: `.product-gallery`, `.product-images`, `.gallery`
- Fallback to general image elements

### 5. JSON Script Data
- `<script type="application/json">` blobs
- Extracts image URLs from JavaScript data structures

## Scoring Algorithm

### Positive Indicators (+10 points each)
- **URL keywords**: packshot, still, flat, ghost, cutout, front, back, side, detail, product, alt, alternate, lay, close, closeup
- **Alt text keywords**: Same as URL keywords (+8 points each)
- **Shopify bonus**: URLs with `/cdn/shop/files/` and `_999_` (+25 points)
- **Selector bonus**: Product-specific selectors (+5 points)
- **Meta tag bonus**: Meta tag sources (+3 points)

### Negative Indicators (-15 points each)
- **URL keywords**: model, look, editorial, campaign, onfigure, on-figure, worn, street, runway, lifestyle, lookbook
- **Alt text keywords**: Same as URL keywords (-12 points each)
- **Thumbnail penalty**: Small images with size parameters (-20 points)

## URL Normalization

### Shopify
- Removes size/crop suffixes: `_<WxH>_crop_*.(jpg|png|webp)` → `.jpg`
- Example: `product_800x600_crop_center.jpg` → `product.jpg`

### Media.meandem.com
- Removes `?imwidth=` parameters
- Example: `image.jpg?imwidth=800` → `image.jpg`

## Usage Examples

### Direct API Call

```typescript
const response = await fetch('/api/extension/extract-product-images', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ pageUrl: 'https://example.com/product' })
});

const data = await response.json();
const bestImage = data.bestImage;
```

### Using the React Hook

```typescript
import { useProductImageExtraction } from '@/lib/useProductImageExtraction';

function MyComponent() {
  const { extractProductImage, loading, error } = useProductImageExtraction();
  
  const handleExtractImage = async (pageUrl: string) => {
    const bestImage = await extractProductImage(pageUrl);
    
    if (bestImage) {
      // Store in your existing reviewData.productImage
      setReviewData(prev => ({
        ...prev,
        productImage: bestImage
      }));
    }
  };

  return (
    <button onClick={() => handleExtractImage('https://example.com/product')}>
      Extract Product Image
    </button>
  );
}
```

### Integration with Review Data

```typescript
// After extracting the image, store it in your reviewData
const bestImage = await extractProductImage(pageUrl);
if (bestImage) {
  setReviewData(prev => ({
    ...prev,
    productImage: bestImage,
    pageUrl: pageUrl
  }));
}
```

## Testing

Visit `/test-product-image-extraction` to test the API functionality:

1. Enter a fashion product page URL
2. Click "Extract Product Image" to test the API directly
3. Click "Extract Using Hook" to test the React hook
4. View the best image and all candidates with scores

## Error Handling

The API returns appropriate error responses:

- **400**: Missing `pageUrl` parameter
- **500**: Failed to fetch page or parse HTML
- **Network errors**: Detailed error messages for debugging

## Browser Extension Integration

This API is designed to work seamlessly with the existing browser extension:

1. **Background script** can call the API when detecting product pages
2. **Content script** can display extracted images
3. **Popup** can show image extraction status and results

## Performance Considerations

- **Server-side processing** reduces client-side load
- **Efficient HTML parsing** with Cheerio
- **Duplicate removal** prevents redundant processing
- **Scoring optimization** for quick candidate ranking

## Future Enhancements

- **Image quality detection** (resolution, aspect ratio)
- **Caching** for frequently accessed pages
- **Batch processing** for multiple URLs
- **Custom scoring rules** per domain/brand
- **Image format optimization** (WebP, AVIF support)
