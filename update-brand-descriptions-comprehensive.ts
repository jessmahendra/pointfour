#!/usr/bin/env tsx

/**
 * Comprehensive Brand Description Update Script
 * 
 * This script updates brand descriptions with proper, informative content
 * based on curated knowledge and brand research.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Configuration
const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }
};

// Types
interface Brand {
  slug: string;
  name: string;
  description: string | null;
  url: string | null;
}

// Curated brand descriptions based on research
const brandDescriptions: Record<string, string> = {
  'zara': 'Zara is a Spanish fast-fashion retailer owned by Inditex, known for its rapid response to fashion trends and affordable contemporary clothing for men, women, and children.',
  'posse': 'Posse is an Australian fashion brand known for its contemporary, feminine designs and commitment to sustainable fashion practices.',
  'abercrombie-fitch': 'Abercrombie & Fitch is an American lifestyle retailer known for its casual luxury clothing, particularly popular among young adults for its preppy aesthetic.',
  'reformation': 'Reformation is a Los Angeles-based sustainable fashion brand known for its eco-friendly practices, feminine silhouettes, and commitment to environmental responsibility.',
  'toteme': 'Toteme is a Swedish minimalist fashion brand founded by Elin Kling, known for its timeless, sophisticated designs and high-quality craftsmanship.',
  'khaite': 'Khaite is a luxury contemporary fashion brand founded by Catherine Holstein, known for its modern, sophisticated designs and focus on quality materials.',
  'amina-muaddi': 'Amina Muaddi is a luxury shoe designer known for her bold, architectural designs and glamorous aesthetic, popular among celebrities and fashion enthusiasts.',
  'levis': 'Levi\'s is an iconic American denim brand founded in 1853, known worldwide for its classic blue jeans and pioneering denim innovations.',
  'dissh': 'Dissh is an Australian fashion brand known for its contemporary, effortless style and commitment to creating versatile pieces for modern women.',
  'le-monde-beryl': 'Le Monde Beryl is a contemporary fashion brand known for its sophisticated, minimalist designs and focus on quality craftsmanship.',
  'cos': 'COS is a contemporary fashion brand offering modern, functional design with a focus on timeless pieces and innovative materials.',
  'aritzia': 'Aritzia is a Canadian women\'s fashion retailer known for its curated collection of contemporary clothing and accessories from various brands.',
  'everlane': 'Everlane is an American clothing retailer known for its transparent pricing, ethical manufacturing practices, and minimalist aesthetic.',
  'uniqlo': 'Uniqlo is a Japanese casual wear retailer known for its LifeWear philosophy, innovative fabrics, and functional, comfortable clothing.',
  'hm': 'H&M is a Swedish multinational clothing retailer known for offering fashion and quality at the best price with a focus on sustainability.',
  'nike': 'Nike is a global athletic footwear and apparel company known for its innovative sports technology, iconic "Just Do It" slogan, and sponsorship of top athletes.',
  'adidas': 'Adidas is a German multinational corporation that designs and manufactures shoes, clothing, and accessories, known for its three-stripe logo and athletic heritage.',
  'mango': 'Mango is a Spanish clothing design and manufacturing company known for its contemporary, feminine fashion for women with a focus on Mediterranean style.',
  'zimmermann': 'Zimmermann is an Australian luxury fashion brand known for its feminine, romantic designs, intricate details, and high-quality craftsmanship.',
  'staud': 'Staud is a Los Angeles-based contemporary fashion brand known for its modern, sophisticated designs and focus on quality materials and construction.',
  'ganni': 'Ganni is a Danish fashion brand known for its playful, contemporary designs and commitment to sustainable fashion practices.',
  'rouje': 'Rouje is a French fashion brand founded by Jeanne Damas, known for its Parisian-inspired, feminine designs and effortless French style.',
  'realisation-par': 'Realisation Par is a Los Angeles-based fashion brand known for its vintage-inspired designs, feminine silhouettes, and limited-edition pieces.',
  'faithfull-the-brand': 'Faithfull The Brand is a Bali-based fashion brand known for its bohemian, feminine designs inspired by vintage aesthetics and tropical vibes.',
  'with-jean': 'With Jean is a contemporary fashion brand known for its modern, feminine designs and focus on creating versatile pieces for everyday wear.',
  'revolve': 'Revolve is an online fashion retailer known for its curated selection of contemporary clothing and accessories from various emerging and established brands.',
  'shopbop': 'Shopbop is an online fashion retailer specializing in contemporary designer clothing, shoes, and accessories for women.',
  'net-a-porter': 'Net-a-Porter is a luxury online fashion retailer known for its curated selection of designer clothing, accessories, and beauty products.',
  'mytheresa': 'Mytheresa is a luxury online fashion retailer specializing in designer clothing, shoes, and accessories for women and children.',
  'farfetch': 'Farfetch is a global online luxury fashion platform that connects customers with boutiques and brands from around the world.',
  'ssense': 'SSENSE is a Canadian luxury fashion retailer known for its avant-garde selection of designer clothing, accessories, and lifestyle products.',
  'matchesfashion': 'MatchesFashion is a luxury online fashion retailer known for its curated selection of designer clothing, accessories, and beauty products.',
  'luisaviaroma': 'LuisaViaRoma is an Italian luxury fashion retailer known for its exclusive selection of designer clothing, accessories, and lifestyle products.',
  'moda-operandi': 'Moda Operandi is a luxury fashion platform known for its trunk shows and exclusive access to designer collections before they hit stores.',
  'the-outnet': 'The Outnet is a luxury fashion outlet offering discounted designer clothing, shoes, and accessories from previous seasons.',
  'yoox': 'Yoox is an Italian online fashion retailer specializing in discounted designer clothing, shoes, and accessories from previous seasons.',
  'vestiaire-collective': 'Vestiaire Collective is a global online marketplace for pre-owned luxury fashion, allowing users to buy and sell authenticated designer items.',
  'the-realreal': 'The RealReal is a luxury consignment marketplace specializing in authenticated pre-owned designer clothing, jewelry, and accessories.',
  'depop': 'Depop is a social shopping app where users can buy and sell vintage, designer, and unique fashion items in a community-driven marketplace.'
};

// Validate configuration
function validateConfig(): void {
  const missing: string[] = [];
  
  if (!config.supabase.url) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!config.supabase.anonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(envVar => console.error(`   - ${envVar}`));
    console.error('\nPlease add these to your .env.local file and try again.');
    process.exit(1);
  }
  
  console.log('✅ Configuration validated');
}

// Initialize Supabase client
function initializeSupabase() {
  return createClient(config.supabase.url, config.supabase.anonKey);
}

// Generate description for unknown brands
function generateGenericDescription(brandName: string): string {
  const genericDescriptions = [
    `A contemporary fashion brand known for ${brandName.toLowerCase()} style and quality craftsmanship.`,
    `An established fashion label offering ${brandName.toLowerCase()} collections with a focus on modern design and customer satisfaction.`,
    `A fashion brand specializing in ${brandName.toLowerCase()} apparel and accessories, known for its commitment to style and quality.`,
    `A well-known fashion company offering ${brandName.toLowerCase()} clothing with contemporary designs and attention to detail.`,
    `A fashion brand recognized for ${brandName.toLowerCase()} designs, innovative style, and commitment to quality craftsmanship.`
  ];
  
  // Use brand name length to determine which description to use
  const index = brandName.length % genericDescriptions.length;
  return genericDescriptions[index];
}

// Get description for a brand
function getBrandDescription(brandName: string, slug: string): string {
  // First try to find by slug
  if (brandDescriptions[slug]) {
    return brandDescriptions[slug];
  }
  
  // Then try to find by name (case insensitive)
  const lowerName = brandName.toLowerCase();
  for (const [key, description] of Object.entries(brandDescriptions)) {
    if (key.includes(lowerName) || lowerName.includes(key)) {
      return description;
    }
  }
  
  // Generate generic description
  return generateGenericDescription(brandName);
}

// Get all brands from Supabase
async function getAllBrands(supabase: ReturnType<typeof createClient>): Promise<Brand[]> {
  console.log('📊 Fetching brands from Supabase...');
  
  try {
    const { data: brands, error } = await supabase
      .from('brands')
      .select('slug, name, description, url')
      .order('name');
    
    if (error) {
      throw error;
    }
    
    console.log(`📦 Found ${brands?.length || 0} brands`);
    return brands || [];
  } catch (error) {
    console.error('❌ Error fetching brands:', error);
    throw error;
  }
}

// Update brand description in Supabase
async function updateBrandDescription(
  supabase: ReturnType<typeof createClient>, 
  slug: string, 
  description: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('brands')
      .update({ description })
      .eq('slug', slug);
    
    if (error) {
      throw error;
    }
    
    console.log(`✅ Updated description for slug: ${slug}`);
  } catch (error) {
    console.error(`❌ Error updating description for ${slug}:`, error);
    throw error;
  }
}

// Add delay between requests to avoid rate limiting
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main function to update all brand descriptions
async function updateAllBrandDescriptions(): Promise<void> {
  console.log('🚀 Starting comprehensive brand description update...\n');
  
  try {
    // Validate configuration
    validateConfig();
    
    // Initialize Supabase client
    const supabase = initializeSupabase();
    
    // Get all brands
    const brands = await getAllBrands(supabase);
    
    if (brands.length === 0) {
      console.log('⚠️ No brands found in Supabase');
      return;
    }
    
    // Show current state
    const brandsWithBasicDescriptions = brands.filter(brand => 
      brand.description && brand.description.includes('sizing & reviews')
    );
    const brandsNeedingBetterDescriptions = brands.filter(brand => 
      !brand.description || brand.description.includes('sizing & reviews')
    );
    
    console.log(`📊 Current state:`);
    console.log(`   - Brands with basic descriptions: ${brandsWithBasicDescriptions.length}`);
    console.log(`   - Brands needing better descriptions: ${brandsNeedingBetterDescriptions.length}`);
    
    if (brandsNeedingBetterDescriptions.length === 0) {
      console.log('✅ All brands already have proper descriptions');
      return;
    }
    
    // Process each brand
    let updated = 0;
    let failed = 0;
    
    for (let i = 0; i < brandsNeedingBetterDescriptions.length; i++) {
      const brand = brandsNeedingBetterDescriptions[i];
      
      try {
        console.log(`\n📝 Processing ${i + 1}/${brandsNeedingBetterDescriptions.length}: ${brand.name}`);
        
        // Get description
        const description = getBrandDescription(brand.name, brand.slug);
        
        console.log(`   New description: ${description}`);
        
        // Update in Supabase
        await updateBrandDescription(supabase, brand.slug, description);
        
        updated++;
        
        // Add delay to avoid rate limiting
        if (i < brandsNeedingBetterDescriptions.length - 1) {
          await delay(500); // 0.5 second delay between requests
        }
        
      } catch (error) {
        console.error(`❌ Failed to update ${brand.name}:`, error);
        failed++;
      }
    }
    
    // Summary
    console.log('\n📊 Update Summary:');
    console.log(`   - Brands processed: ${brandsNeedingBetterDescriptions.length}`);
    console.log(`   - Successfully updated: ${updated}`);
    console.log(`   - Failed updates: ${failed}`);
    
    if (updated === brandsNeedingBetterDescriptions.length) {
      console.log('\n🎉 All brand descriptions updated successfully!');
    } else if (updated > 0) {
      console.log('\n⚠️ Some brand descriptions were updated successfully');
    } else {
      console.log('\n❌ No brand descriptions were updated');
    }
    
  } catch (error) {
    console.error('\n💥 Update failed:', error);
    process.exit(1);
  }
}

// Run update if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateAllBrandDescriptions();
}

export { updateAllBrandDescriptions };
