import Airtable from 'airtable';

// Initialize Airtable
const getBase = () => {
  return new Airtable({
    apiKey: process.env.NEXT_PUBLIC_AIRTABLE_API_KEY,
  }).base(process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID!);
};

const base = getBase();
// Types for Airtable data
export interface Brand {
  id: string;
  brand: string;
  category: string;
  garmentTypes: string[];
  fitSummary: string;
  sizeRange: string;
  sizingSystem: string;
  bestForBodyTypes: string[];
  commonFitIssues: string[];
  fabricStretch: string;
  petiteRange: boolean;
  tallRange: boolean;
  plusRange: boolean;
  ukRetailer: string;
  priceRange: string;
  returnPolicy: string;
  userQuotes: string[];
  sourceLinks: string[];
  confidenceScore: number;
  status: string;
}

export interface Review {
  id: string;
  brandName: string;
  fitSummary: string;
  commonFitIssues: string[];
  priceRange: string;
  itemName: string;
  garmentType: string;
  itemCollection: string;
  userBodyType: string;
  sizeBought: string;
  usualSize: string;
  fitRating: number;
  fitComments: string;
  wouldRecommend: boolean;
  height: string;
  submissionDate: string;
  approved: boolean;
  productImage: string;
  productURL: string;
  imageURL: string;
}

export interface RecommendationItem {
  id: string;
  brandName: string;
  itemName: string;
  garmentType: string;
  priceRange: string;
  fitSummary: string;
  fitComments: string;
  fitRating: number;
  userBodyType: string;
  sizeBought: string;
  productImage: string;
  productURL: string;
  wouldRecommend: boolean;
}

// Helper function to parse Airtable records
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseBrandRecord = (record: any): Brand => ({
  id: record.id,
  brand: record.get('Brand Name') || '',
  category: record.get('Category') || '',
  garmentTypes: record.get('Garment Types') ? record.get('Garment Types').split(',').map((type: string) => type.trim()) : [],
  fitSummary: record.get('Fit Summary') || '',
  sizeRange: record.get('Size Range') || '',
  sizingSystem: record.get('Sizing System') || '',
  bestForBodyTypes: record.get('Best For Body Types') ? record.get('Best For Body Types').split(',').map((type: string) => type.trim()) : [],
  commonFitIssues: record.get('Common Fit Issues') ? record.get('Common Fit Issues').split(',').map((issue: string) => issue.trim()) : [],
  fabricStretch: record.get('Fabric Stretch') || '',
  petiteRange: record.get('Petite Range') || false,
  tallRange: record.get('Tall Range') || false,
  plusRange: record.get('Plus Range') || false,
  ukRetailer: record.get('UK Retailer') || '',
  priceRange: record.get('Price Range') || '',
  returnPolicy: record.get('Return Policy') || '',
  userQuotes: record.get('User Quotes') ? record.get('User Quotes').split(',').map((quote: string) => quote.trim()) : [],
  sourceLinks: record.get('Source Links') ? record.get('Source Links').split(',').map((link: string) => link.trim()) : [],
  confidenceScore: record.get('Confidence Score') || 0,
  status: record.get('Status') || '',
});

// Helper function to safely get array values
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getArrayValue = (value: any): string => {
  if (Array.isArray(value)) {
    return value[0] || '';
  }
  return value || '';
};

// Helper function to convert fit rating string to number
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseFitRating = (rating: any): number => {
  if (typeof rating === 'number') return rating;
  if (typeof rating === 'string') {
    const ratingMap: { [key: string]: number } = {
      'Perfect Fit': 5,
      'Great Fit': 4,
      'Good Fit': 3,
      'Okay Fit': 2,
      'Poor Fit': 1,
    };
    return ratingMap[rating] || 3; // Default to 3 if unknown
  }
  return 3; // Default
};

// Helper function to safely split comma-separated values
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const safeSplit = (value: any): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(v => String(v).trim());
  if (typeof value === 'string') {
    return value.split(',').map(v => v.trim()).filter(v => v !== '');
  }
  return [];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseReviewRecord = (record: any): Review => {
  try {
    console.log('🔧 Parsing record fields:', Object.keys(record.fields));
    
    const review = {
      id: record.id,
      brandName: getArrayValue(record.get('Brand Name (from Brand)')) || getArrayValue(record.get('Brand')) || '',
      fitSummary: record.get('Fit Summary (from Brand)') || '',
      commonFitIssues: safeSplit(record.get('Common Fit Issues (from Brand)')),
      priceRange: record.get('Price Range (from Brand)') || '',
      itemName: record.get('Item Name') || '',
      garmentType: record.get('Garment Type') || '',
      itemCollection: record.get('Item Collection') || '',
      userBodyType: getArrayValue(record.get('User Body Type')) || '',
      sizeBought: record.get('Size Bought') || '',
      usualSize: record.get('Usual Size') || '',
      fitRating: parseFitRating(record.get('Fit Rating')),
      fitComments: record.get('Fit Comments') || '',
      wouldRecommend: record.get('Would Recommend') || false,
      height: record.get('Height') || '',
      submissionDate: record.get('Submission Date') || '',
      approved: record.get('Approved') || false,
      productImage: '', // Not found in current schema
      productURL: '', // Not found in current schema
      imageURL: '', // Not found in current schema
    };
    
    console.log('✅ Parsed review:', {
      id: review.id,
      brandName: review.brandName,
      garmentType: review.garmentType,
      userBodyType: review.userBodyType
    });
    
    return review;
  } catch (error) {
    console.error('❌ Error parsing review record:', error);
    console.error('Record ID:', record.id);
    console.error('Record fields:', Object.keys(record.fields));
    throw error;
  }
};

// Airtable service functions
export const airtableService = {
  // Fetch all brands
  async getBrands(): Promise<Brand[]> {
    try {
      const records = await base(process.env.AIRTABLE_BRANDS_TABLE!).select().all();
      return records.map(parseBrandRecord);
    } catch (error) {
      console.error('Error fetching brands:', error);
      throw new Error('Failed to fetch brands');
    }
  },

  // Fetch all reviews
  async getReviews(): Promise<Review[]> {
    try {
      console.log('🔍 getReviews() called');
      console.log('📡 Connecting to Airtable...');
      console.log('  - Base ID:', process.env.AIRTABLE_BASE_ID);
      console.log('  - Table:', process.env.AIRTABLE_REVIEWS_TABLE);
      
      const records = await base(process.env.AIRTABLE_REVIEWS_TABLE!).select().all();
      console.log(`✅ Fetched ${records.length} records from Airtable`);
      
      console.log('🔧 Parsing records...');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const reviews = records.map((record: any, index: number) => {
        try {
          const review = parseReviewRecord(record);
          if (index < 3) { // Log first 3 records for debugging
            console.log(`  Record ${index + 1}:`, {
              id: review.id,
              brandName: review.brandName,
              garmentType: review.garmentType,
              userBodyType: review.userBodyType,
              fitRating: review.fitRating
            });
          }
          return review;
        } catch (parseError) {
          console.error(`❌ Error parsing record ${index}:`, parseError);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          console.error('Record fields:', Object.keys((record as any).fields));
          throw parseError;
        }
      });
      
      console.log(`✅ Successfully parsed ${reviews.length} reviews`);
      return reviews;
    } catch (error) {
      console.error('❌ Error fetching reviews:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : undefined
      });
      throw new Error('Failed to fetch reviews');
    }
  },

  // Fetch reviews filtered by criteria
  async getFilteredReviews(filters: {
    garmentType?: string;
    priceRange?: string;
    bodyType?: string;
    approved?: boolean;
  }): Promise<Review[]> {
    try {
      let formula = '';
      const conditions = [];

      if (filters.garmentType) {
        conditions.push(`{Garment Type} = '${filters.garmentType}'`);
      }
      if (filters.priceRange) {
        conditions.push(`{Price Range (from Brand)} = '${filters.priceRange}'`);
      }
      if (filters.bodyType) {
        conditions.push(`{User Body Type} = '${filters.bodyType}'`);
      }
      if (filters.approved !== undefined) {
        conditions.push(`{Approved} = ${filters.approved}`);
      }

      if (conditions.length > 0) {
        formula = `AND(${conditions.join(', ')})`;
      }

      const query = formula ? { filterByFormula: formula } : {};
      const records = await base(process.env.AIRTABLE_REVIEWS_TABLE!).select(query).all();
      return records.map(parseReviewRecord);
    } catch (error) {
      console.error('Error fetching filtered reviews:', error);
      throw new Error('Failed to fetch filtered reviews');
    }
  },

  // Get unique garment types from reviews
  async getGarmentTypes(): Promise<string[]> {
    try {
      console.log('🔍 getGarmentTypes() called');
      console.log('📡 Fetching reviews from Airtable...');
      
      const reviews = await this.getReviews();
      console.log(`✅ Fetched ${reviews.length} reviews`);
      
      const garmentTypes = reviews
        .map(review => review.garmentType)
        .filter(type => type && type.trim() !== '');
      
      const uniqueTypes = [...new Set(garmentTypes)].sort();
      console.log('✅ Extracted garment types:', uniqueTypes);
      
      return uniqueTypes;
    } catch (error) {
      console.error('❌ Error fetching garment types:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw new Error('Failed to fetch garment types');
    }
  },

  // Get unique price ranges from reviews
  async getPriceRanges(): Promise<string[]> {
    try {
      const reviews = await this.getReviews();
      const priceRanges = reviews
        .map(review => review.priceRange)
        .filter(range => range && range.trim() !== '');
      return [...new Set(priceRanges)].sort();
    } catch (error) {
      console.error('Error fetching price ranges:', error);
      throw new Error('Failed to fetch price ranges');
    }
  },

  // Get unique body types from reviews
  async getBodyTypes(): Promise<string[]> {
    try {
      const reviews = await this.getReviews();
      const bodyTypes = reviews
        .map(review => review.userBodyType)
        .filter(type => type && type.trim() !== '');
      return [...new Set(bodyTypes)].sort();
    } catch (error) {
      console.error('Error fetching body types:', error);
      throw new Error('Failed to fetch body types');
    }
  },

  // Get recommendations based on user preferences
  async getRecommendations(preferences: {
    style?: string;
    bodyType?: string;
    budget?: number;
    occasion?: string;
    colors?: string[];
    size?: string;
  }): Promise<RecommendationItem[]> {
    try {
      // Get all approved reviews
      const reviews = await this.getFilteredReviews({ approved: true });
      
      // Filter reviews based on preferences
      let filteredReviews = reviews;

      // Filter by body type if specified
      if (preferences.bodyType) {
        filteredReviews = filteredReviews.filter(review => 
          review.userBodyType.toLowerCase().includes(preferences.bodyType!.toLowerCase()) ||
          review.userBodyType.toLowerCase() === preferences.bodyType!.toLowerCase()
        );
      }

      // Filter by budget if specified
      if (preferences.budget) {
        filteredReviews = filteredReviews.filter(review => {
          const priceRange = review.priceRange.toLowerCase();
          if (priceRange.includes('under') || priceRange.includes('£')) {
            const priceMatch = priceRange.match(/£?(\d+)/);
            if (priceMatch) {
              const price = parseInt(priceMatch[1]);
              return price <= preferences.budget!;
            }
          }
          return true; // Include if we can't parse the price
        });
      }

      // Convert to recommendation format
      const recommendations: RecommendationItem[] = filteredReviews.map(review => ({
        id: review.id,
        brandName: review.brandName,
        itemName: review.itemName,
        garmentType: review.garmentType,
        priceRange: review.priceRange,
        fitSummary: review.fitSummary,
        fitComments: review.fitComments,
        fitRating: review.fitRating,
        userBodyType: review.userBodyType,
        sizeBought: review.sizeBought,
        productImage: review.productImage || review.imageURL,
        productURL: review.productURL,
        wouldRecommend: review.wouldRecommend,
      }));

      // Sort by fit rating (highest first) and recommendation status
      return recommendations.sort((a, b) => {
        if (a.wouldRecommend !== b.wouldRecommend) {
          return b.wouldRecommend ? 1 : -1;
        }
        return b.fitRating - a.fitRating;
      });
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw new Error('Failed to get recommendations');
    }
  },
}; 