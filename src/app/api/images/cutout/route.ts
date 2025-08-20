import sharp from 'sharp';
import { createBgRemoveProvider } from '@/lib/bgRemove';

export async function POST(request: Request) {
  try {
    const { imageUrl, targetMax = 1024 } = await request.json();
    
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'imageUrl parameter is required' }),
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

    console.log('🖼️ Processing image:', imageUrl);

    // Fetch the image
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());
    
    // Remove background (or no-op if no provider configured)
    const bgRemoveProvider = createBgRemoveProvider();
    const processedBuffer = await bgRemoveProvider.removeBackground(imageBuffer);
    
    // Process with sharp: rotate, trim, resize, extend
    let sharpInstance = sharp(processedBuffer);
    
    // Auto-rotate based on EXIF orientation
    sharpInstance = sharpInstance.rotate();
    
    // Trim transparent/white edges
    sharpInstance = sharpInstance.trim();
    
    // Resize to fit within targetMax while maintaining aspect ratio
    sharpInstance = sharpInstance.resize(targetMax, targetMax, {
      fit: 'inside',
      withoutEnlargement: true
    });
    
    // Extend with transparent padding (24px on each side)
    // const metadata = await sharpInstance.metadata();
    // const extendedWidth = (metadata.width || targetMax) + 48;
    // const extendedHeight = (metadata.height || targetMax) + 48;
    
    sharpInstance = sharpInstance.extend({
      top: 24,
      bottom: 24,
      left: 24,
      right: 24,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    });
    
    // Output as PNG with transparency
    const outputBuffer = await sharpInstance.png().toBuffer();
    
    console.log('✅ Image processed successfully');
    
    return new Response(outputBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });

  } catch (error) {
    console.error('❌ Error processing image:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process image',
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

