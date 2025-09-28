import { productParsingService, ProductParsingOptions } from './product-parsing-service';
import { databaseServiceServiceRole, Brand, Product } from './database-service-service-role';
import { ProductParsingResult } from '../schemas/product-parsing';
import { LLMInteraction } from '../llm-store';

export interface EnhancedProductParsingResult {
  parsedData: ProductParsingResult;
  brand: Brand;
  product: Product;
  wasBrandCreated: boolean;
  wasProductCreated: boolean;
  interaction: LLMInteraction;
}

export interface EnhancedProductParsingOptions extends ProductParsingOptions {
  // Additional options for database operations
  fuzzyMatchThreshold?: number;
  skipDatabaseOperations?: boolean;
}

export class EnhancedProductParsingServiceServiceRole {
  private static instance: EnhancedProductParsingServiceServiceRole;

  private constructor() {}

  static getInstance(): EnhancedProductParsingServiceServiceRole {
    if (!EnhancedProductParsingServiceServiceRole.instance) {
      EnhancedProductParsingServiceServiceRole.instance = new EnhancedProductParsingServiceServiceRole();
    }
    return EnhancedProductParsingServiceServiceRole.instance;
  }

  /**
   * Parse a product query and create/find brand and product in database
   */
  async parseAndStoreProduct(
    prompt: string,
    options: EnhancedProductParsingOptions = {}
  ): Promise<EnhancedProductParsingResult> {
    const {
      fuzzyMatchThreshold = 0.7,
      skipDatabaseOperations = false,
      ...parsingOptions
    } = options;

    console.log('🚀 EnhancedProductParsingService (Service Role): Starting enhanced product parsing...');

    // Step 1: Parse the product using the existing service
    const { result: parsedData, interaction } = await productParsingService.parseProduct(
      prompt,
      parsingOptions
    );

    console.log('📝 Parsed data:', {
      brandName: parsedData.brandName,
      productName: parsedData.productName,
      brandWebsite: parsedData.brandWebsite,
      productUrl: parsedData.productUrl,
      confidence: parsedData.confidence
    });

    console.log('🤖 Full LLM Response:', JSON.stringify(parsedData, null, 2));
    console.log('🤖 LLM Interaction Details:', JSON.stringify(interaction, null, 2));

    // If database operations are skipped, return early
    if (skipDatabaseOperations) {
      console.log('⏭️ Skipping database operations as requested');
      return {
        parsedData,
        brand: {} as Brand,
        product: {} as Product,
        wasBrandCreated: false,
        wasProductCreated: false,
        interaction
      };
    }

    try {
      // Step 2: Find or create brand
      console.log('🔍 Looking for existing brand...');
      let brand = await databaseServiceServiceRole.findMatchingBrand(parsedData.brandName, fuzzyMatchThreshold);
      let wasBrandCreated = false;

      if (!brand) {
        console.log('➕ Brand not found, creating new brand...');
        brand = await databaseServiceServiceRole.createBrandIfNotExists({
          name: parsedData.brandName,
          description: `Brand for ${parsedData.productName}`,
          url: parsedData.brandWebsite
        });
        wasBrandCreated = true;
      } else {
        console.log(`✅ Found existing brand: ${brand.name} (slug: ${brand.slug})`);
      }

      // Step 3: Find or create product
      console.log('🔍 Looking for existing product...');
      let product = await databaseServiceServiceRole.findExistingProduct(parsedData.productName, brand.slug);
      let wasProductCreated = false;

      if (!product) {
        console.log('➕ Product not found, creating new product...');
        product = await databaseServiceServiceRole.createProductIfNotExists({
          name: parsedData.productName,
          url: parsedData.productUrl,
          brandSlug: brand.slug,
          description: `Product: ${parsedData.productName}`,
          currency: 'USD'
        });
        wasProductCreated = true;
      } else {
        console.log(`✅ Found existing product: ${product.name} (ID: ${product.id})`);
      }

      console.log('✅ EnhancedProductParsingService (Service Role): Product parsing and storage completed');

      return {
        parsedData,
        brand,
        product,
        wasBrandCreated,
        wasProductCreated,
        interaction
      };
    } catch (error) {
      console.error('❌ Error in enhanced product parsing:', error);
      throw new Error(`Enhanced product parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse multiple products in batch and store them in database
   */
  async parseAndStoreProducts(
    prompts: string[],
    options: EnhancedProductParsingOptions = {}
  ): Promise<EnhancedProductParsingResult[]> {
    console.log(`🚀 EnhancedProductParsingService (Service Role): Starting batch processing of ${prompts.length} products...`);
    
    const results = await Promise.all(
      prompts.map(prompt => this.parseAndStoreProduct(prompt, options))
    );

    console.log('✅ EnhancedProductParsingService (Service Role): Batch processing completed');
    return results;
  }

  /**
   * Get summary of database contents for debugging
   */
  async getDatabaseSummary(): Promise<{
    totalBrands: number;
    totalProducts: number;
    brands: Brand[];
    products: Product[];
  }> {
    console.log('📊 Getting database summary...');
    
    const brands = await databaseServiceServiceRole.getAllBrands();
    const products = await databaseServiceServiceRole.getAllProducts();

    const summary = {
      totalBrands: brands.length,
      totalProducts: products.length,
      brands,
      products
    };

    console.log('📊 Database summary:', {
      totalBrands: summary.totalBrands,
      totalProducts: summary.totalProducts
    });

    return summary;
  }

  /**
   * Test the fuzzy matching algorithm with sample data
   */
  async testFuzzyMatching(testBrandNames: string[]): Promise<void> {
    console.log('🧪 Testing fuzzy matching with sample brand names...');
    
    for (const brandName of testBrandNames) {
      console.log(`\n🔍 Testing: "${brandName}"`);
      const match = await databaseServiceServiceRole.findMatchingBrand(brandName, 0.7);
      
      if (match) {
        console.log(`✅ Found match: ${match.name} (slug: ${match.slug})`);
      } else {
        console.log(`❌ No match found`);
      }
    }
  }
}

// Export singleton instance
export const enhancedProductParsingServiceServiceRole = EnhancedProductParsingServiceServiceRole.getInstance();
