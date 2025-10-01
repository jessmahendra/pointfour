import { createClient } from '../../utils/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

// Database types
export interface Brand {
  slug: string;
  name: string;
  description?: string;
  url?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  normalized_name?: string; // Auto-generated normalized name for duplicate detection
  url: string;
  brand_id: string; // This is the brand slug, not a numeric ID
  description?: string;
  image_url?: string;
  price?: number;
  currency?: string;
  created_at: string;
  updated_at: string;
}

export interface BrandInsert {
  slug: string;
  name: string;
  description?: string;
  url?: string;
  logo_url?: string;
}

export interface ProductInsert {
  name: string;
  url: string;
  brand_id: string; // This is the brand slug, not a numeric ID
  description?: string;
  image_url?: string;
  price?: number;
  currency?: string;
}

export class DatabaseService {
  private static instance: DatabaseService;
  private supabase: SupabaseClient | null;

  private constructor() {
    // Note: This will be initialized when first used
    this.supabase = null;
  }

  private async getSupabaseClient() {
    if (!this.supabase) {
      this.supabase = await createClient();
    }
    return this.supabase;
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Generate a URL-friendly slug from a brand name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  }

  /**
   * Calculate similarity between two strings using Levenshtein distance
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Find the best matching brand by name with fuzzy matching
   */
  async findMatchingBrand(brandName: string, threshold: number = 0.7): Promise<Brand | null> {
    try {
      const supabase = await this.getSupabaseClient();
      
      // First try exact match (case insensitive)
      const { data: exactMatch, error: exactError } = await supabase
        .from('brands')
        .select('*')
        .ilike('name', brandName)
        .single();

      if (exactMatch && !exactError) {
        console.log(`✅ Found exact brand match: ${exactMatch.name} (slug: ${exactMatch.slug})`);
        return exactMatch;
      }

      // If no exact match, get all brands and do fuzzy matching
      const { data: allBrands, error: allBrandsError } = await supabase
        .from('brands')
        .select('*');

      if (allBrandsError) {
        console.error('Error fetching brands for fuzzy matching:', allBrandsError);
        return null;
      }

      if (!allBrands || allBrands.length === 0) {
        console.log('No brands found in database');
        return null;
      }

      // Find the best match above threshold
      let bestMatch: Brand | null = null;
      let bestSimilarity = 0;

      for (const brand of allBrands) {
        const similarity = this.calculateSimilarity(
          brandName.toLowerCase(),
          brand.name.toLowerCase()
        );

        if (similarity > bestSimilarity && similarity >= threshold) {
          bestSimilarity = similarity;
          bestMatch = brand;
        }
      }

      if (bestMatch) {
        console.log(`✅ Found fuzzy brand match: ${bestMatch.name} (slug: ${bestMatch.slug}, similarity: ${bestSimilarity.toFixed(2)})`);
      } else {
        console.log(`❌ No brand match found for "${brandName}" (best similarity: ${bestSimilarity.toFixed(2)})`);
      }

      return bestMatch;
    } catch (error) {
      console.error('Error in findMatchingBrand:', error);
      return null;
    }
  }

  /**
   * Create a new brand if it doesn't exist
   */
  async createBrandIfNotExists(brandData: {
    name: string;
    description?: string;
    url?: string;
    logo_url?: string;
  }): Promise<Brand> {
    try {
      const supabase = await this.getSupabaseClient();
      
      // First check if brand already exists
      const existingBrand = await this.findMatchingBrand(brandData.name, 0.9); // Higher threshold for creation
      
      if (existingBrand) {
        console.log(`✅ Brand already exists: ${existingBrand.name} (slug: ${existingBrand.slug})`);
        return existingBrand;
      }

      // Create new brand
      const slug = this.generateSlug(brandData.name);
      const brandInsert: BrandInsert = {
        slug,
        name: brandData.name,
        description: brandData.description,
        url: brandData.url,
        logo_url: brandData.logo_url
      };

      const { data: newBrand, error } = await supabase
        .from('brands')
        .insert(brandInsert)
        .select()
        .single();

      if (error) {
        console.error('Error creating brand:', error);
        throw new Error(`Failed to create brand: ${error.message}`);
      }

      console.log(`✅ Created new brand: ${newBrand.name} (slug: ${newBrand.slug})`);
      return newBrand;
    } catch (error) {
      console.error('Error in createBrandIfNotExists:', error);
      throw error;
    }
  }

  /**
   * Normalize a product name for matching
   */
  private normalizeProductName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  /**
   * Find existing product by name and brand slug with fuzzy matching
   */
  async findExistingProduct(productName: string, brandSlug: string, threshold: number = 0.85): Promise<Product | null> {
    try {
      const supabase = await this.getSupabaseClient();

      // First try exact normalized match (fast path)
      const normalizedName = this.normalizeProductName(productName);
      const { data: exactMatch, error: exactError } = await supabase
        .from('products')
        .select('*')
        .eq('brand_id', brandSlug)
        .eq('normalized_name', normalizedName)
        .maybeSingle();

      if (exactMatch && !exactError) {
        console.log(`✅ Found exact product match: ${exactMatch.name} (ID: ${exactMatch.id})`);
        return exactMatch;
      }

      // If no exact match, get all products for this brand and do fuzzy matching
      const { data: brandProducts, error: brandError } = await supabase
        .from('products')
        .select('*')
        .eq('brand_id', brandSlug);

      if (brandError) {
        console.error('Error fetching products for fuzzy matching:', brandError);
        return null;
      }

      if (!brandProducts || brandProducts.length === 0) {
        console.log(`No products found for brand: ${brandSlug}`);
        return null;
      }

      // Find best fuzzy match
      let bestMatch: Product | null = null;
      let bestSimilarity = 0;

      for (const product of brandProducts) {
        const similarity = this.calculateSimilarity(
          normalizedName,
          this.normalizeProductName(product.name)
        );

        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestMatch = product;
        }
      }

      if (bestMatch && bestSimilarity >= threshold) {
        console.log(`✅ Found fuzzy product match: ${bestMatch.name} (ID: ${bestMatch.id}, similarity: ${(bestSimilarity * 100).toFixed(1)}%)`);
        return bestMatch;
      }

      console.log(`No product match found for "${productName}" (best similarity: ${(bestSimilarity * 100).toFixed(1)}%)`);
      return null;
    } catch (error) {
      console.error('Error in findExistingProduct:', error);
      return null;
    }
  }

  /**
   * Create a new product if it doesn't exist
   */
  async createProductIfNotExists(productData: {
    name: string;
    url: string;
    brandSlug: string;
    description?: string;
    image_url?: string;
    price?: number;
    currency?: string;
  }): Promise<Product> {
    try {
      const supabase = await this.getSupabaseClient();
      
      // First check if product already exists
      const existingProduct = await this.findExistingProduct(productData.name, productData.brandSlug);
      
      if (existingProduct) {
        console.log(`✅ Product already exists: ${existingProduct.name} (ID: ${existingProduct.id})`);
        return existingProduct;
      }

      // Get the brand ID from the brand slug
      const { data: brand, error: brandError } = await supabase
        .from('brands')
        .select('id')
        .eq('slug', productData.brandSlug)
        .single();

      if (brandError || !brand) {
        console.error('Error finding brand by slug:', brandError);
        throw new Error(`Brand not found: ${productData.brandSlug}`);
      }

      // Create new product
      const productInsert: ProductInsert = {
        name: productData.name,
        url: productData.url,
        brand_id: brand.id.toString(),
        description: productData.description,
        image_url: productData.image_url,
        price: productData.price,
        currency: productData.currency || 'USD'
      };

      const { data: newProduct, error } = await supabase
        .from('products')
        .insert(productInsert)
        .select()
        .single();

      if (error) {
        console.error('Error creating product:', error);
        throw new Error(`Failed to create product: ${error.message}`);
      }

      console.log(`✅ Created new product: ${newProduct.name} (ID: ${newProduct.id})`);
      return newProduct;
    } catch (error) {
      console.error('Error in createProductIfNotExists:', error);
      throw error;
    }
  }

  /**
   * Get all brands for debugging/verification
   */
  async getAllBrands(): Promise<Brand[]> {
    try {
      const supabase = await this.getSupabaseClient();
      
      const { data: brands, error } = await supabase
        .from('brands')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching brands:', error);
        return [];
      }

      return brands || [];
    } catch (error) {
      console.error('Error in getAllBrands:', error);
      return [];
    }
  }

  /**
   * Get all products for debugging/verification
   */
  async getAllProducts(): Promise<Product[]> {
    try {
      const supabase = await this.getSupabaseClient();
      
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching products:', error);
        return [];
      }

      return products || [];
    } catch (error) {
      console.error('Error in getAllProducts:', error);
      return [];
    }
  }
}

// Export singleton instance
export const databaseService = DatabaseService.getInstance();
