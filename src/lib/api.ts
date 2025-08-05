// Complete API service for Airtable integration
const AIRTABLE_BASE_ID = process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID;
const AIRTABLE_API_KEY = process.env.NEXT_PUBLIC_AIRTABLE_API_KEY;


export const apiService = {
  // Fetch brands from Airtable
  async getBrands() {
    try {
      if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
        console.log('Using mock data - Airtable not configured');
        return mockBrands;
      }

      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Brands`,
        {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch from Airtable');
      }

      const data = await response.json();
      interface AirtableRecord {
        id: string;
        fields: {
          'Brand Name'?: string;
          'Category'?: string;
          'Sizing Notes'?: string;
          'Fit Description'?: string;
        }
      }
      return data.records.map((record: AirtableRecord) => ({
        id: record.id,
        brand: record.fields['Brand Name'] || '',
        category: record.fields['Category'] || '',
        sizing: record.fields['Sizing Notes'] || '',
        fit: record.fields['Fit Description'] || '',
      }));
    } catch (error) {
      console.error('Error fetching brands:', error);
      return mockBrands;
    }
  },

  // This is the missing function that was causing the error
  async getGarmentTypes() {
    try {
      if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
        console.log('Using mock garment types - Airtable not configured');
        return mockGarmentTypes;
      }

      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/GarmentTypes`,
        {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch garment types from Airtable');
      }

      const data = await response.json();
      interface GarmentTypeRecord {
        id: string;
        fields: {
          'Garment Type'?: string;
          'Name'?: string;
          'Category'?: string;
        }
      }
      return data.records.map((record: GarmentTypeRecord) => ({
        id: record.id,
        name: record.fields['Garment Type'] || record.fields['Name'] || '',
        category: record.fields['Category'] || '',
      }));
    } catch (error) {
      console.error('Error fetching garment types:', error);
      return mockGarmentTypes;
    }
  },

  // Fetch body types from Airtable
  async getBodyTypes() {
    try {
      if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
        console.log('Using mock body types - Airtable not configured');
        return mockBodyTypes;
      }

      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/BodyTypes`,
        {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch body types from Airtable');
      }

      const data = await response.json();
      interface BodyTypeRecord {
        id: string;
        fields: {
          'Body Type'?: string;
          'Name'?: string;
          'Description'?: string;
        }
      }
      return data.records.map((record: BodyTypeRecord) => ({
        id: record.id,
        name: record.fields['Body Type'] || record.fields['Name'] || '',
        description: record.fields['Description'] || '',
      }));
    } catch (error) {
      console.error('Error fetching body types:', error);
      return mockBodyTypes;
    }
  },

  // Get AI recommendation using OpenAI
  async getAIRecommendation(query: string) {
    try {
      const response = await fetch('/api/ai-recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI recommendation');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting AI recommendation:', error);
      throw error;
    }
  },

  // Legacy function for compatibility
  async getRecommendation(query: string) {
    return this.getAIRecommendation(query);
  }
};

// Mock data for testing when Airtable isn't set up
const mockBrands = [
  {
    id: 1,
    brand: "Zara",
    category: "Fast Fashion",
    sizing: "Runs small - size up",
    fit: "European fit, slim cut",
  },
  {
    id: 2,
    brand: "ASOS",
    category: "Online Fashion", 
    sizing: "True to size",
    fit: "Varied - depends on product line",
  },
  {
    id: 3,
    brand: "Uniqlo",
    category: "Basics",
    sizing: "Asian sizing - runs small",
    fit: "Boxy, relaxed fit",
  }
];

const mockGarmentTypes = [
  { id: 1, name: "Jeans", category: "Bottoms" },
  { id: 2, name: "Dresses", category: "Dresses" },
  { id: 3, name: "T-shirts", category: "Tops" },
  { id: 4, name: "Blazers", category: "Outerwear" },
  { id: 5, name: "Sweaters", category: "Tops" },
];

const mockBodyTypes = [
  { id: 1, name: "Petite", description: "Under 5'4\" with smaller frame" },
  { id: 2, name: "Curvy", description: "Fuller figure with defined curves" },
  { id: 3, name: "Athletic", description: "Muscular build with broader shoulders" },
  { id: 4, name: "Plus Size", description: "Size 14+ with fuller figure" },
  { id: 5, name: "Tall", description: "Over 5'8\" with longer proportions" },
  { id: 6, name: "Average", description: "Standard proportions and height" },
];