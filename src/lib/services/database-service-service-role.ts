import { createClient } from '@supabase/supabase-js';

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

export class DatabaseServiceServiceRole {
  private static instance: DatabaseServiceServiceRole;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private supabase: any;
  private initialized = false;

  private constructor() {
    // Don't initialize here - use lazy initialization
  }

  private async initialize() {
    if (this.initialized) return;
    
    console.log('🔍 DatabaseServiceServiceRole: Initializing...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('🔍 Environment variables:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceRoleKey: !!serviceRoleKey,
      supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'missing',
      serviceRoleKey: serviceRoleKey ? `${serviceRoleKey.substring(0, 10)}...` : 'missing'
    });

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Missing required environment variables');
      throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }

    try {
      this.supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      this.initialized = true;
      console.log('✅ DatabaseServiceServiceRole: Supabase client initialized successfully');
    } catch (error) {
      console.error('❌ DatabaseServiceServiceRole: Failed to initialize Supabase client:', error);
      throw error;
    }
  }

  static getInstance(): DatabaseServiceServiceRole {
    if (!DatabaseServiceServiceRole.instance) {
      DatabaseServiceServiceRole.instance = new DatabaseServiceServiceRole();
    }
    return DatabaseServiceServiceRole.instance;
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
      await this.initialize();
      
      // First try exact match (case insensitive)
      const { data: exactMatch, error: exactError } = await this.supabase
        .from('brands')
        .select('*')
        .ilike('name', brandName)
        .single();

      if (exactMatch && !exactError) {
        console.log(`✅ Found exact brand match: ${exactMatch.name} (slug: ${exactMatch.slug})`);
        console.log('📊 Supabase Brand Query Response (Exact Match):', JSON.stringify(exactMatch, null, 2));
        return exactMatch;
      }

      // If no exact match, get all brands and do fuzzy matching
      const { data: allBrands, error: allBrandsError } = await this.supabase
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
        console.log('📊 Supabase Brand Query Response (Fuzzy Match):', JSON.stringify(bestMatch, null, 2));
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
      await this.initialize();
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

      console.log('📤 Submitting to Supabase - Brand Insert:', JSON.stringify(brandInsert, null, 2));

      const { data: newBrand, error } = await this.supabase
        .from('brands')
        .insert(brandInsert)
        .select()
        .single();

      if (error) {
        console.error('Error creating brand:', error);
        throw new Error(`Failed to create brand: ${error.message}`);
      }

      console.log(`✅ Created new brand: ${newBrand.name} (slug: ${newBrand.slug})`);
      console.log('📊 Supabase Brand Insert Response:', JSON.stringify(newBrand, null, 2));
      return newBrand;
    } catch (error) {
      console.error('Error in createBrandIfNotExists:', error);
      throw error;
    }
  }

  /**
   * Find existing product by name and brand slug
   */
  async findExistingProduct(productName: string, brandSlug: string): Promise<Product | null> {
    try {
      await this.initialize();
      const { data: product, error } = await this.supabase
        .from('products')
        .select('*')
        .eq('brand_id', brandSlug)
        .ilike('name', productName)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('Error finding product:', error);
        return null;
      }

      if (product) {
        console.log('📊 Supabase Product Query Response:', JSON.stringify(product, null, 2));
      }

      return product;
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
      await this.initialize();
      // First check if product already exists
      const existingProduct = await this.findExistingProduct(productData.name, productData.brandSlug);
      
      if (existingProduct) {
        console.log(`✅ Product already exists: ${existingProduct.name} (ID: ${existingProduct.id})`);
        return existingProduct;
      }

      // Create new product - use brand slug directly as brand_id
      const productInsert: ProductInsert = {
        name: productData.name,
        url: productData.url,
        brand_id: productData.brandSlug, // Use slug directly instead of numeric ID
        description: productData.description,
        image_url: productData.image_url,
        price: productData.price,
        currency: productData.currency || 'USD'
      };

      console.log('📤 Submitting to Supabase - Product Insert:', JSON.stringify(productInsert, null, 2));

      const { data: newProduct, error } = await this.supabase
        .from('products')
        .insert(productInsert)
        .select()
        .single();

      if (error) {
        console.error('Error creating product:', error);
        throw new Error(`Failed to create product: ${error.message}`);
      }

      console.log(`✅ Created new product: ${newProduct.name} (ID: ${newProduct.id})`);
      console.log('📊 Supabase Product Insert Response:', JSON.stringify(newProduct, null, 2));
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
      await this.initialize();
      const { data: brands, error } = await this.supabase
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
      await this.initialize();
      const { data: products, error } = await this.supabase
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
export const databaseServiceServiceRole = DatabaseServiceServiceRole.getInstance();
