/**
 * Review Cache Service
 * Handles caching of external reviews to reduce API costs
 */

import { createClient } from '@/utils/supabase/server';

export interface CachedReview {
  id: number;
  product_id: number;
  source: string;
  source_url: string | null;
  snippet: string;
  title: string | null;
  search_date: string;
  created_at: string;
}

export interface ReviewSearchCache {
  id: number;
  product_id: number;
  search_query: string;
  total_results: number;
  last_search_at: string;
  next_search_due: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewData {
  title: string;
  snippet: string;
  url: string;
  source: string;
}

export class ReviewCacheService {
  private static instance: ReviewCacheService;

  private constructor() {}

  static getInstance(): ReviewCacheService {
    if (!ReviewCacheService.instance) {
      ReviewCacheService.instance = new ReviewCacheService();
    }
    return ReviewCacheService.instance;
  }

  /**
   * Check if we have a fresh cache for this product
   * Returns cached reviews if found and fresh (< 7 days old)
   */
  async getCachedReviews(productId: number): Promise<CachedReview[] | null> {
    try {
      const supabase = await createClient();

      // Check if cache exists and is fresh
      const { data: cache, error: cacheError } = await supabase
        .from('review_search_cache')
        .select('*')
        .eq('product_id', productId)
        .single();

      if (cacheError || !cache) {
        console.log(`No cache found for product ${productId}`);
        return null;
      }

      // Check if cache is still fresh
      const nextSearchDue = new Date(cache.next_search_due);
      const now = new Date();

      if (nextSearchDue < now) {
        console.log(`Cache expired for product ${productId} (due: ${nextSearchDue.toISOString()})`);
        return null;
      }

      // Cache is fresh, get the reviews
      const { data: reviews, error: reviewsError } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (reviewsError) {
        console.error('Error fetching cached reviews:', reviewsError);
        return null;
      }

      console.log(`✅ Using cached reviews for product ${productId} (${reviews?.length || 0} reviews, expires: ${nextSearchDue.toISOString()})`);
      return reviews || [];
    } catch (error) {
      console.error('Error in getCachedReviews:', error);
      return null;
    }
  }

  /**
   * Store reviews in cache
   */
  async storeReviews(
    productId: number,
    searchQuery: string,
    reviews: ReviewData[]
  ): Promise<boolean> {
    try {
      const supabase = await createClient();

      console.log(`💾 Storing ${reviews.length} reviews for product ${productId}`);

      // Upsert the cache metadata
      const { error: cacheError } = await supabase
        .from('review_search_cache')
        .upsert({
          product_id: productId,
          search_query: searchQuery,
          total_results: reviews.length,
          last_search_at: new Date().toISOString(),
          next_search_due: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'product_id'
        });

      if (cacheError) {
        console.error('Error storing cache metadata:', cacheError);
        return false;
      }

      // Store individual reviews
      if (reviews.length > 0) {
        const reviewRecords = reviews.map(review => ({
          product_id: productId,
          source: review.source,
          source_url: review.url || null,
          snippet: review.snippet,
          title: review.title || null,
          search_date: new Date().toISOString()
        }));

        const { error: reviewsError } = await supabase
          .from('product_reviews')
          .upsert(reviewRecords, {
            onConflict: 'product_id,source_url',
            ignoreDuplicates: true
          });

        if (reviewsError) {
          console.error('Error storing reviews:', reviewsError);
          return false;
        }
      }

      console.log(`✅ Cached ${reviews.length} reviews for product ${productId} (expires in 7 days)`);
      return true;
    } catch (error) {
      console.error('Error in storeReviews:', error);
      return false;
    }
  }

  /**
   * Get products with stale caches (for cron job)
   */
  async getProductsNeedingRefresh(): Promise<number[]> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('review_search_cache')
        .select('product_id')
        .lt('next_search_due', new Date().toISOString());

      if (error) {
        console.error('Error fetching products needing refresh:', error);
        return [];
      }

      return data?.map(row => row.product_id) || [];
    } catch (error) {
      console.error('Error in getProductsNeedingRefresh:', error);
      return [];
    }
  }

  /**
   * Convert cached reviews to the format expected by the recommendations API
   */
  convertCachedReviewsToReviewData(cachedReviews: CachedReview[]): ReviewData[] {
    return cachedReviews.map(review => ({
      title: review.title || '',
      snippet: review.snippet,
      url: review.source_url || '',
      source: review.source
    }));
  }
}

export const reviewCacheService = ReviewCacheService.getInstance();
