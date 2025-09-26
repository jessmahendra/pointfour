import Airtable from 'airtable';

// Type definitions
interface Brand {
  id: string;
  name: string;
  category: string;
  description?: string;
  website?: string;
  priceRange?: string;
  sizeRange?: string;
  fitNotes?: string;
  logo?: string;
  createdTime: string;
  // Use camelCase versions (these are what your API actually returns)
  garmentTypes?: string;
  fitSummary?: string;
  sizingSystem?: string;
  bestForBodyTypes?: string;
  commonFitInformation?: string; // Changed from commonFitIssues
  fabricStretch?: string;
  petiteRange?: string;
  tallRange?: string;
  plusRange?: string;
  ukRetailer?: string;
  returnPolicy?: string;
  userQuotes?: string;
  sourceLinks?: string;
  confidenceScore?: string;
  status?: string;
  userFeedback?: string;
  reviews?: string;
  brandDetailsHeader?: string;
}

interface Review {
  id: string;
  brandName: string;
  itemName: string;
  garmentType: string;
  userBodyType?: string;
  sizeBought?: string;
  usualSize?: string;
  fitRating?: number;
  fitComments?: string;
  wouldRecommend?: boolean;
  height?: string;
  submissionDate: string;
}

interface SharedAnalysis {
  id?: string;
  shareId: string;
  analysisResult: string;
  userProfile: string;
  brandQuery: string;
  createdAt: string;
  viewCount: number;
  sharedAt: string;
}

// Initialize Airtable connection
function initializeAirtable() {
  const base = new Airtable({
    apiKey: process.env.AIRTABLE_API_KEY,
  }).base(process.env.AIRTABLE_BASE_ID!);
  
  return base;
}

// Helper functions for safe field access
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeGet(record: any, fieldName: string): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fields = (record as any).fields;
    if (!fields) return '';
    
    // Try exact match first
    if (fields[fieldName] !== undefined) {
      return String(fields[fieldName] || '');
    }
    
    // Try case-insensitive match
    const fieldKeys = Object.keys(fields);
    const matchingKey = fieldKeys.find(key => 
      key.toLowerCase() === fieldName.toLowerCase()
    );
    
    if (matchingKey) {
      return String(fields[matchingKey] || '');
    }
    
    return '';
  } catch {
    return '';
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeGetNumber(record: any, fieldName: string): number | undefined {
  try {
    const value = safeGet(record, fieldName);
    const num = parseFloat(value);
    return isNaN(num) ? undefined : num;
  } catch {
    return undefined;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeGetBoolean(record: any, fieldName: string): boolean | undefined {
  try {
    const value = safeGet(record, fieldName).toLowerCase();
    if (value === 'true' || value === 'yes' || value === '1') return true;
    if (value === 'false' || value === 'no' || value === '0') return false;
    return undefined;
  } catch {
    return undefined;
  }
}

// Simple in-memory cache for reviews (5 minute TTL)  
let reviewsCache: { data: Review[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const airtableService = {
  async getBrands(): Promise<Brand[]> {
    try {
      console.log('📊 Initializing Airtable connection...');
      const base = initializeAirtable();
      
      const tableName = process.env.AIRTABLE_BRANDS_TABLE || 'Brands';
      console.log('📋 Using table:', tableName);
      
      // First, let's try to get records without sorting to avoid field name issues
      const records = await base(tableName)
        .select({
          maxRecords: 100
        })
        .all();

      console.log(`📦 Retrieved ${records.length} brand records`);
      
      // Log all available fields from the first record for debugging
      if (records.length > 0) {
        console.log('Available fields in first record:', records[0].fields);
        console.log('All field keys:', Object.keys(records[0].fields));
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const brands: Brand[] = records.map((record: any) => {
        // Map your actual Airtable field names to the interface - FIXED with correct capitalization
        const brand = {
          id: record.id,
          name: safeGet(record, 'Brand Name') || safeGet(record, 'brand name') || '',
          category: safeGet(record, 'Category') || safeGet(record, 'category') || '',
          description: safeGet(record, 'Brand Details Header') || safeGet(record, 'description') || '',
          website: safeGet(record, 'UK Retailer') || safeGet(record, 'website') || '',
          priceRange: safeGet(record, 'Price Range') || safeGet(record, 'price range') || '',
          sizeRange: safeGet(record, 'Size Range') || safeGet(record, 'size range') || '',
          fitNotes: safeGet(record, 'Fit Summary') || safeGet(record, 'Fit Notes') || '',
          logo: safeGet(record, 'logo') || '',
          createdTime: safeGet(record, 'Created Time') || record._rawJson.createdTime || '',
          
          // Additional mapped fields with CORRECT capitalized field names
          garmentTypes: safeGet(record, 'Garment Types') || safeGet(record, 'garment types') || '',
          fitSummary: safeGet(record, 'Fit Summary') || safeGet(record, 'fit summary') || '',
          sizingSystem: safeGet(record, 'Sizing System') || safeGet(record, 'sizing system') || '',
          bestForBodyTypes: safeGet(record, 'Best For Body Types') || safeGet(record, 'best for body types') || '',
          commonFitInformation: safeGet(record, 'Common Fit Information') || safeGet(record, 'common fit information') || '', // Note: mapped to commonFitInformation but fetching Common Fit Information
          fabricStretch: safeGet(record, 'Fabric Stretch') || safeGet(record, 'fabric stretch') || '',
          petiteRange: safeGet(record, 'Petite Range') || safeGet(record, 'petite range') || '',
          tallRange: safeGet(record, 'Tall Range') || safeGet(record, 'tall range') || '',
          plusRange: safeGet(record, 'Plus Range') || safeGet(record, 'plus range') || '',
          ukRetailer: safeGet(record, 'UK Retailer') || safeGet(record, 'uk retailer') || '',
          returnPolicy: safeGet(record, 'Return Policy') || safeGet(record, 'return policy') || '',
          userQuotes: safeGet(record, 'User Quotes') || safeGet(record, 'user quotes') || '',
          sourceLinks: safeGet(record, 'Source Links') || safeGet(record, 'source links') || '',
          confidenceScore: safeGet(record, 'Confidence Score') || safeGet(record, 'confidence score') || '',
          status: safeGet(record, 'Status') || safeGet(record, 'status') || '',
          userFeedback: safeGet(record, 'User Feedback') || safeGet(record, 'user feedback') || '',
          reviews: safeGet(record, 'reviews') || '',
          brandDetailsHeader: safeGet(record, 'Brand Details Header') || safeGet(record, 'brand details header') || '',
        };
        
        console.log(`Processed brand: ${brand.name}`);
        console.log(`- Fit Summary: ${brand.fitSummary ? 'HAS DATA' : 'EMPTY'}`);
        console.log(`- Best For Body Types: ${brand.bestForBodyTypes ? 'HAS DATA' : 'EMPTY'}`);
        return brand;
      });

      console.log('✅ Brands processed successfully');
      return brands;
    } catch (error) {
      console.error('💥 Error fetching brands:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw new Error(`Failed to fetch brands: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async getReviews(): Promise<Review[]> {
    try {
      // Check cache first
      if (reviewsCache && (Date.now() - reviewsCache.timestamp) < CACHE_TTL) {
        console.log('📊 Using cached reviews data');
        return reviewsCache.data;
      }
      
      console.log('📊 Fetching reviews from Airtable...');
      const base = initializeAirtable();
      
      const tableName = process.env.AIRTABLE_REVIEWS_TABLE || 'Reviews';
      console.log('📋 Using reviews table:', tableName);
      
      const records = await base(tableName)
        .select({
          maxRecords: 1000
        })
        .all();

      console.log(`📦 Retrieved ${records.length} review records`);
      
      // Log sample records for debugging
      if (records.length > 0) {
        console.log('📋 Sample review record fields:', Object.keys(records[0].fields));
        console.log('📋 Sample review record:', records[0].fields);
        
        // DEBUG: Log the first few records to see exact field values
        console.log('📋 First 3 review records (raw):');
        records.slice(0, 3).forEach((record: { id: string; fields: Record<string, unknown> }, index: number) => {
          console.log(`  Record ${index + 1}:`, {
            id: record.id,
            fields: record.fields,
            brandNameField: safeGet(record, 'Brand Name') || safeGet(record, 'brand name') || 'NOT FOUND',
            itemNameField: safeGet(record, 'Item Name') || safeGet(record, 'item name') || 'NOT FOUND'
          });
        });
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reviews: Review[] = records.map((record: any) => {
        const review = {
          id: record.id,
          brandName: record.fields['Brand'] || record.fields['brand'] || '',
          itemName: record.fields['Item Name'] || '',
          garmentType: safeGet(record, 'Garment Type') || safeGet(record, 'garment type') || '',
          userBodyType: safeGet(record, 'User Body Type') || safeGet(record, 'user body type') || '',
          sizeBought: safeGet(record, 'Size Bought') || safeGet(record, 'size bought') || '',
          usualSize: safeGet(record, 'Usual Size') || safeGet(record, 'usual size') || '',
          fitRating: safeGetNumber(record, 'Fit Rating') || safeGetNumber(record, 'fit rating'),
          fitComments: safeGet(record, 'Fit Comments') || safeGet(record, 'fit comments') || '',
          wouldRecommend: safeGetBoolean(record, 'Would Recommend') || safeGetBoolean(record, 'would recommend'),
          height: safeGet(record, 'Height') || safeGet(record, 'height') || '',
          submissionDate: safeGet(record, 'Submission Date') || safeGet(record, 'submission date') || record._rawJson.createdTime || '',
        };
        
        // Debug logging for each review with brand name details
        if (review.brandName) {
          console.log(`📝 Review: "${review.brandName}" - ${review.itemName} (${review.garmentType})`);
          console.log(`   Raw brand name field: "${record.fields['Brand'] || record.fields['brand'] || 'NOT FOUND'}"`);
        } else {
          console.log(`⚠️ Review missing brand name: ${review.itemName} (${review.garmentType})`);
          console.log(`   Available fields:`, Object.keys(record.fields));
          console.log(`   Raw brand field values:`, {
            'Brand': record.fields['Brand'],
            'brand': record.fields['brand'],
            'Brand Name': record.fields['Brand Name'],
            'brand name': record.fields['brand name']
          });
        }
        
        return review;
      });

      // Log summary of reviews by brand
      const brandCounts = reviews.reduce((acc, review) => {
        if (review.brandName) {
          acc[review.brandName] = (acc[review.brandName] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      
      console.log('📊 Reviews by brand:', brandCounts);
      console.log('✅ Reviews processed successfully');
      
      // Cache the results
      reviewsCache = {
        data: reviews,
        timestamp: Date.now()
      };
      
      return reviews;
    } catch (error) {
      console.error('💥 Error fetching reviews:', error);
      throw new Error(`Failed to fetch reviews: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async getBodyTypes(): Promise<string[]> {
    try {
      const reviews = await this.getReviews();
      const bodyTypes = Array.from(new Set(reviews.map(review => review.userBodyType).filter((type): type is string => Boolean(type))));
      return bodyTypes.sort();
    } catch (error) {
      console.error('Error fetching body types:', error);
      return [];
    }
  },

  async getGarmentTypes(): Promise<string[]> {
    try {
      const reviews = await this.getReviews();
      const garmentTypes = Array.from(new Set(reviews.map(review => review.garmentType).filter((type): type is string => Boolean(type))));
      return garmentTypes.sort();
    } catch (error) {
      console.error('Error fetching garment types:', error);
      return [];
    }
  },

  async getPriceRanges(): Promise<string[]> {
    try {
      const brands = await this.getBrands();
      const priceRanges = Array.from(new Set(brands.map(brand => brand.priceRange).filter((range): range is string => Boolean(range))));
      return priceRanges.sort();
    } catch (error) {
      console.error('Error fetching price ranges:', error);
      return [];
    }
  },

  // Shared Analysis methods
  async createSharedAnalysis(sharedData: Omit<SharedAnalysis, 'id'>): Promise<SharedAnalysis> {
    try {
      console.log('📊 Creating shared analysis in Airtable...');
      const base = initializeAirtable();
      
      const tableName = process.env.AIRTABLE_SHARED_ANALYSIS_TABLE || 'Shared Analysis';
      console.log('📋 Using table:', tableName);
      
      const record = await base(tableName).create({
        shareId: sharedData.shareId,
        analysisResult: sharedData.analysisResult,
        userProfile: sharedData.userProfile,
        brandQuery: sharedData.brandQuery,
        createdAt: sharedData.createdAt,
        viewCount: sharedData.viewCount,
        sharedAt: sharedData.sharedAt
      });

      console.log(`📦 Created shared analysis record with ID: ${record.id}`);
      
      return {
        id: record.id,
        shareId: record.get('shareId') as string,
        analysisResult: record.get('analysisResult') as string,
        userProfile: record.get('userProfile') as string,
        brandQuery: record.get('brandQuery') as string,
        createdAt: record.get('createdAt') as string,
        viewCount: record.get('viewCount') as number,
        sharedAt: record.get('sharedAt') as string
      };
    } catch (error) {
      console.error('Error creating shared analysis:', error);
      throw error;
    }
  },

  async getSharedAnalysis(shareId: string): Promise<SharedAnalysis | null> {
    try {
      console.log('📊 Retrieving shared analysis from Airtable...');
      const base = initializeAirtable();
      
      const tableName = process.env.AIRTABLE_SHARED_ANALYSIS_TABLE || 'Shared Analysis';
      console.log('📋 Using table:', tableName);
      
      const records = await base(tableName)
        .select({
          filterByFormula: `{shareId} = '${shareId}'`,
          maxRecords: 1
        })
        .all();

      if (records.length === 0) {
        console.log('📦 No shared analysis found for shareId:', shareId);
        return null;
      }

      const record = records[0];
      console.log(`📦 Retrieved shared analysis record with ID: ${record.id}`);
      
      return {
        id: record.id,
        shareId: record.get('shareId') as string,
        analysisResult: record.get('analysisResult') as string,
        userProfile: record.get('userProfile') as string,
        brandQuery: record.get('brandQuery') as string,
        createdAt: record.get('createdAt') as string,
        viewCount: record.get('viewCount') as number,
        sharedAt: record.get('sharedAt') as string
      };
    } catch (error) {
      console.error('Error retrieving shared analysis:', error);
      throw error;
    }
  },

  async incrementViewCount(shareId: string): Promise<void> {
    try {
      console.log('📊 Incrementing view count for shared analysis...');
      const base = initializeAirtable();
      
      const tableName = process.env.AIRTABLE_SHARED_ANALYSIS_TABLE || 'Shared Analysis';
      
      const records = await base(tableName)
        .select({
          filterByFormula: `{shareId} = '${shareId}'`,
          maxRecords: 1
        })
        .all();

      if (records.length === 0) {
        console.log('📦 No shared analysis found to increment view count for shareId:', shareId);
        return;
      }

      const record = records[0];
      const currentViewCount = (record.get('viewCount') as number) || 0;
      
      await base(tableName).update(record.id, {
        viewCount: currentViewCount + 1
      });

      console.log(`📦 Incremented view count to ${currentViewCount + 1} for shareId: ${shareId}`);
    } catch (error) {
      console.error('Error incrementing view count:', error);
      throw error;
    }
  }
};