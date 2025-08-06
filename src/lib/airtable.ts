import Airtable from 'airtable';

// Initialize Airtable with proper error handling
const initializeAirtable = () => {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!apiKey || !baseId) {
    console.error('Missing Airtable credentials:', {
      hasApiKey: !!apiKey,
      hasBaseId: !!baseId
    });
    throw new Error('Airtable API key or Base ID not configured');
  }

  return new Airtable({ apiKey }).base(baseId);
};

export interface Brand {
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
}

export interface Review {
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

export interface BodyType {
  id: string;
  name: string;
  description?: string;
  characteristics?: string;
}

export interface GarmentType {
  id: string;
  name: string;
  category?: string;
  description?: string;
}

export interface PriceRange {
  id: string;
  range: string;
  minPrice?: number;
  maxPrice?: number;
  description?: string;
}

export interface Recommendation {
  id: string;
  brandName: string;
  itemName: string;
  bodyType?: string;
  recommendation?: string;
  reasoning?: string;
  createdTime: string;
}

export const airtableService = {
  async getBrands(): Promise<Brand[]> {
    try {
      console.log('📊 Initializing Airtable connection...');
      const base = initializeAirtable();
      
      const tableName = process.env.AIRTABLE_BRANDS_TABLE || 'Brands';
      console.log('📋 Using table:', tableName);
      
      const records = await base(tableName)
        .select({
          maxRecords: 100,
          sort: [{ field: 'Brand Name', direction: 'asc' }]
        })
        .all();

      console.log(`📦 Retrieved ${records.length} brand records`);

      const brands: Brand[] = records.map(record => {
        const brand = {
          id: record.id,
          name: record.get('Brand Name') as string || '',
          category: record.get('Category') as string || '',
          description: record.get('Description') as string || '',
          website: record.get('Website') as string || '',
          priceRange: record.get('Price Range') as string || '',
          sizeRange: record.get('Size Range') as string || '',
          fitNotes: record.get('Fit Notes') as string || '',
          logo: record.get('Logo') as string || '',
          createdTime: record.get('Created Time') as string || record._rawJson.createdTime
        };
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
      console.log('📊 Initializing Airtable connection for reviews...');
      const base = initializeAirtable();
      
      const tableName = process.env.AIRTABLE_REVIEWS_TABLE || 'Reviews';
      console.log('📋 Using reviews table:', tableName);
      
      const records = await base(tableName)
        .select({
          maxRecords: 200,
          sort: [{ field: 'Submission Date', direction: 'desc' }]
        })
        .all();

      console.log(`📦 Retrieved ${records.length} review records`);

      const reviews: Review[] = records.map(record => ({
        id: record.id,
        brandName: record.get('Brand') as string || '',
        itemName: record.get('Item Name') as string || '',
        garmentType: record.get('Garment Type') as string || '',
        userBodyType: record.get('User Body Type') as string || '',
        sizeBought: record.get('Size Bought') as string || '',
        usualSize: record.get('Usual Size') as string || '',
        fitRating: record.get('Fit Rating') as number || 0,
        fitComments: record.get('Fit Comments') as string || '',
        wouldRecommend: record.get('Would Recommend') as boolean || false,
        height: record.get('Height') as string || '',
        submissionDate: record.get('Submission Date') as string || record._rawJson.createdTime
      }));

      return reviews;
    } catch (error) {
      console.error('💥 Error fetching reviews:', error);
      throw new Error(`Failed to fetch reviews: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async getBodyTypes(): Promise<BodyType[]> {
    try {
      console.log('📊 Fetching body types from Airtable...');
      const base = initializeAirtable();
      
      const tableName = process.env.AIRTABLE_BODY_TYPES_TABLE || 'Body Types';
      
      const records = await base(tableName)
        .select({
          maxRecords: 50,
          sort: [{ field: 'Name', direction: 'asc' }]
        })
        .all();

      console.log(`📦 Retrieved ${records.length} body type records`);

      const bodyTypes: BodyType[] = records.map(record => ({
        id: record.id,
        name: record.get('Name') as string || '',
        description: record.get('Description') as string || '',
        characteristics: record.get('Characteristics') as string || ''
      }));

      return bodyTypes;
    } catch (error) {
      console.error('💥 Error fetching body types:', error);
      throw new Error(`Failed to fetch body types: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async getGarmentTypes(): Promise<GarmentType[]> {
    try {
      console.log('📊 Fetching garment types from Airtable...');
      const base = initializeAirtable();
      
      const tableName = process.env.AIRTABLE_GARMENT_TYPES_TABLE || 'Garment Types';
      
      const records = await base(tableName)
        .select({
          maxRecords: 100,
          sort: [{ field: 'Name', direction: 'asc' }]
        })
        .all();

      console.log(`📦 Retrieved ${records.length} garment type records`);

      const garmentTypes: GarmentType[] = records.map(record => ({
        id: record.id,
        name: record.get('Name') as string || '',
        category: record.get('Category') as string || '',
        description: record.get('Description') as string || ''
      }));

      return garmentTypes;
    } catch (error) {
      console.error('💥 Error fetching garment types:', error);
      throw new Error(`Failed to fetch garment types: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async getPriceRanges(): Promise<PriceRange[]> {
    try {
      console.log('📊 Fetching price ranges from Airtable...');
      const base = initializeAirtable();
      
      const tableName = process.env.AIRTABLE_PRICE_RANGES_TABLE || 'Price Ranges';
      
      const records = await base(tableName)
        .select({
          maxRecords: 50,
          sort: [{ field: 'Min Price', direction: 'asc' }]
        })
        .all();

      console.log(`📦 Retrieved ${records.length} price range records`);

      const priceRanges: PriceRange[] = records.map(record => ({
        id: record.id,
        range: record.get('Range') as string || '',
        minPrice: record.get('Min Price') as number || 0,
        maxPrice: record.get('Max Price') as number || 0,
        description: record.get('Description') as string || ''
      }));

      return priceRanges;
    } catch (error) {
      console.error('💥 Error fetching price ranges:', error);
      throw new Error(`Failed to fetch price ranges: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async getRecommendations(): Promise<Recommendation[]> {
    try {
      console.log('📊 Fetching recommendations from Airtable...');
      const base = initializeAirtable();
      
      const tableName = process.env.AIRTABLE_RECOMMENDATIONS_TABLE || 'Recommendations';
      
      const records = await base(tableName)
        .select({
          maxRecords: 200,
          sort: [{ field: 'Created Time', direction: 'desc' }]
        })
        .all();

      console.log(`📦 Retrieved ${records.length} recommendation records`);

      const recommendations: Recommendation[] = records.map(record => ({
        id: record.id,
        brandName: record.get('Brand Name') as string || '',
        itemName: record.get('Item Name') as string || '',
        bodyType: record.get('Body Type') as string || '',
        recommendation: record.get('Recommendation') as string || '',
        reasoning: record.get('Reasoning') as string || '',
        createdTime: record.get('Created Time') as string || record._rawJson.createdTime
      }));

      return recommendations;
    } catch (error) {
      console.error('💥 Error fetching recommendations:', error);
      throw new Error(`Failed to fetch recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};