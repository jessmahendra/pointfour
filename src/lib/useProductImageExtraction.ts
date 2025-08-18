import { useState, useCallback } from 'react';

interface ProductImage {
  src: string;
  alt: string;
  selector: string;
}

interface ExtractProductImagesResponse {
  pageUrl: string;
  bestImage: ProductImage | null;
  images: Array<ProductImage & { score: number }>;
}

interface UseProductImageExtractionReturn {
  extractProductImage: (pageUrl: string) => Promise<ProductImage | null>;
  loading: boolean;
  error: string | null;
  lastExtractedImage: ProductImage | null;
}

export function useProductImageExtraction(): UseProductImageExtractionReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastExtractedImage, setLastExtractedImage] = useState<ProductImage | null>(null);

  const extractProductImage = useCallback(async (pageUrl: string): Promise<ProductImage | null> => {
    if (!pageUrl) {
      setError('Page URL is required');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/extension/extract-product-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pageUrl }),
      });

      if (!response.ok) {
        throw new Error(`Failed to extract product images: ${response.status}`);
      }

      const data: ExtractProductImagesResponse = await response.json();
      
      if (data.bestImage) {
        setLastExtractedImage(data.bestImage);
        console.log('✅ Product image extracted:', data.bestImage);
        console.log('📊 All candidates:', data.images);
        return data.bestImage;
      } else {
        console.log('❌ No suitable product image found');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error extracting product image:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    extractProductImage,
    loading,
    error,
    lastExtractedImage,
  };
}

// Example usage in a component:
/*
import { useProductImageExtraction } from '@/lib/useProductImageExtraction';

function MyComponent() {
  const { extractProductImage, loading, error, lastExtractedImage } = useProductImageExtraction();
  
  const handleExtractImage = async () => {
    const pageUrl = 'https://example.com/product-page';
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
    <div>
      <button onClick={handleExtractImage} disabled={loading}>
        {loading ? 'Extracting...' : 'Extract Product Image'}
      </button>
      
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      
      {lastExtractedImage && (
        <div>
          <h3>Best Product Image:</h3>
          <img 
            src={lastExtractedImage.src} 
            alt={lastExtractedImage.alt}
            style={{ maxWidth: '300px', height: 'auto' }}
          />
          <p>Selector: {lastExtractedImage.selector}</p>
        </div>
      )}
    </div>
  );
}
*/
