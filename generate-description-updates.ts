#!/usr/bin/env tsx

/**
 * Brand Description Update Script with RLS Handling
 * 
 * This script updates brand descriptions, handling RLS policies properly.
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

// Curated brand descriptions
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
  'everlane': 'Everlane is an American clothing retailer known for its transparent pricing, ethical manufacturing practices, and minimalist aesthetic.',
  'ganni': 'Ganni is a Danish fashion brand known for its playful, contemporary designs and commitment to sustainable fashion practices.',
  'mango': 'Mango is a Spanish clothing design and manufacturing company known for its contemporary, feminine fashion for women with a focus on Mediterranean style.'
};

// Generate description for unknown brands
function generateGenericDescription(brandName: string): string {
  const genericDescriptions = [
    `A contemporary fashion brand known for ${brandName.toLowerCase()} style and quality craftsmanship.`,
    `An established fashion label offering ${brandName.toLowerCase()} collections with a focus on modern design and customer satisfaction.`,
    `A fashion brand specializing in ${brandName.toLowerCase()} apparel and accessories, known for its commitment to style and quality.`,
    `A well-known fashion company offering ${brandName.toLowerCase()} clothing with contemporary designs and attention to detail.`,
    `A fashion brand recognized for ${brandName.toLowerCase()} designs, innovative style, and commitment to quality craftsmanship.`
  ];
  
  const index = brandName.length % genericDescriptions.length;
  return genericDescriptions[index];
}

// Get description for a brand
function getBrandDescription(brandName: string, slug: string): string {
  if (brandDescriptions[slug]) {
    return brandDescriptions[slug];
  }
  
  const lowerName = brandName.toLowerCase();
  for (const [key, description] of Object.entries(brandDescriptions)) {
    if (key.includes(lowerName) || lowerName.includes(key)) {
      return description;
    }
  }
  
  return generateGenericDescription(brandName);
}

// Generate SQL update statements
function generateUpdateSQL(brands: Array<{slug: string, name: string}>): string {
  let sql = '-- Brand Description Updates\n';
  sql += '-- Run these statements in your Supabase SQL Editor\n\n';
  
  for (const brand of brands) {
    const description = getBrandDescription(brand.name, brand.slug);
    const escapedDescription = description.replace(/'/g, "''");
    sql += `UPDATE brands SET description = '${escapedDescription}' WHERE slug = '${brand.slug}';\n`;
  }
  
  return sql;
}

// Main function
async function generateDescriptionUpdates(): Promise<void> {
  console.log('🚀 Generating brand description updates...\n');
  
  try {
    const supabase = createClient(config.supabase.url, config.supabase.anonKey);
    
    // Get all brands
    const { data: brands, error } = await supabase
      .from('brands')
      .select('slug, name, description')
      .order('name');
    
    if (error) {
      throw error;
    }
    
    console.log(`📦 Found ${brands?.length || 0} brands`);
    
    // Filter brands that need better descriptions
    const brandsNeedingUpdates = brands?.filter(brand => 
      !brand.description || brand.description.includes('sizing & reviews')
    ) || [];
    
    console.log(`📊 Brands needing better descriptions: ${brandsNeedingUpdates.length}`);
    
    if (brandsNeedingUpdates.length === 0) {
      console.log('✅ All brands already have proper descriptions');
      return;
    }
    
    // Generate SQL
    const sql = generateUpdateSQL(brandsNeedingUpdates);
    
    // Save to file
    const fs = await import('fs');
    fs.writeFileSync('brand-description-updates.sql', sql);
    
    console.log('\n📝 Generated SQL update statements:');
    console.log('   - Saved to: brand-description-updates.sql');
    console.log('   - Copy and paste the SQL into your Supabase SQL Editor');
    
    // Show preview
    console.log('\n📋 Preview of updates:');
    brandsNeedingUpdates.slice(0, 5).forEach(brand => {
      const description = getBrandDescription(brand.name, brand.slug);
      console.log(`   ${brand.name}: ${description.substring(0, 80)}...`);
    });
    
    if (brandsNeedingUpdates.length > 5) {
      console.log(`   ... and ${brandsNeedingUpdates.length - 5} more`);
    }
    
  } catch (error) {
    console.error('\n💥 Generation failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateDescriptionUpdates();
}

export { generateDescriptionUpdates };
