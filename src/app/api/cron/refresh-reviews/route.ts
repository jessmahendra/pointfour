/**
 * Cron job endpoint to refresh stale review caches
 * Should be called weekly (every 7 days)
 *
 * Setup with Vercel Cron:
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/refresh-reviews",
 *     "schedule": "0 0 * * 0"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { reviewCacheService } from '@/lib/services/review-cache-service';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron or has the correct auth header
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔄 Cron job: Starting review cache refresh...');

    // Get products that need cache refresh
    const productIds = await reviewCacheService.getProductsNeedingRefresh();

    if (productIds.length === 0) {
      console.log('✅ No products need refresh');
      return NextResponse.json({
        message: 'No products need refresh',
        productsRefreshed: 0
      });
    }

    console.log(`📋 Found ${productIds.length} products needing refresh`);

    const supabase = await createClient();
    let successCount = 0;
    let errorCount = 0;

    // Refresh each product's reviews
    for (const productId of productIds) {
      try {
        // Get product details
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('id, name, brand_id, brands(name)')
          .eq('id', productId)
          .single();

        if (productError || !product) {
          console.error(`❌ Error fetching product ${productId}:`, productError);
          errorCount++;
          continue;
        }

        const brandName = (product.brands as {name: string})?.name || '';
        const productName = product.name;

        console.log(`🔍 Refreshing reviews for: ${brandName} ${productName}`);

        // Perform Serper search
        const serperApiKey = process.env.SERPER_API_KEY;
        if (!serperApiKey) {
          console.error('SERPER_API_KEY not configured');
          errorCount++;
          continue;
        }

        const searchQueries = [
          `${brandName} ${productName} reviews`,
          `${brandName} ${productName} fit sizing`
        ];

        const allResults: Array<{
          title: string;
          snippet: string;
          url: string;
          source: string;
        }> = [];

        // Search each query
        for (const searchQuery of searchQueries.slice(0, 2)) {
          try {
            const serperResponse = await fetch('https://google.serper.dev/search', {
              method: 'POST',
              headers: {
                'X-API-KEY': serperApiKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                q: searchQuery,
                num: 10
              }),
            });

            if (serperResponse.ok) {
              const serperData = await serperResponse.json();
              if (serperData.organic) {
                allResults.push(...serperData.organic.map((result: {
                  title?: string;
                  snippet?: string;
                  link?: string;
                }) => ({
                  title: result.title || '',
                  snippet: result.snippet || '',
                  url: result.link || '',
                  source: new URL(result.link || '').hostname
                })));
              }
            }

            // Rate limiting: wait 1 second between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(`Search query "${searchQuery}" failed:`, error);
          }
        }

        // Store results in cache
        if (allResults.length > 0) {
          const searchQuery = `${brandName} ${productName} reviews`;
          await reviewCacheService.storeReviews(productId, searchQuery, allResults);
          console.log(`✅ Refreshed ${allResults.length} reviews for product ${productId}`);
          successCount++;
        } else {
          console.log(`⚠️  No reviews found for product ${productId}`);
          errorCount++;
        }

        // Rate limiting: wait 2 seconds between products
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`❌ Error refreshing product ${productId}:`, error);
        errorCount++;
      }
    }

    console.log(`✅ Cron job complete: ${successCount} refreshed, ${errorCount} errors`);

    return NextResponse.json({
      message: 'Review cache refresh complete',
      productsRefreshed: successCount,
      errors: errorCount,
      totalProducts: productIds.length
    });

  } catch (error) {
    console.error('❌ Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}
