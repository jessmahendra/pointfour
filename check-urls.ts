#!/usr/bin/env tsx

/**
 * Check Current Brand URLs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkUrls() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Check a few specific brands
  const brandsToCheck = ['Zara', 'Reformation', 'Toteme', 'Khaite', 'Amina Muaddi', 'COS', 'Levi\'s'];
  
  console.log('Current brand URLs:');
  for (const brandName of brandsToCheck) {
    const { data: brand } = await supabase
      .from('brands')
      .select('name, url')
      .eq('name', brandName)
      .single();
    
    console.log(`${brandName}: ${brand?.url || 'NO URL'}`);
  }
  
  // Check total count with URLs
  const { data: brandsWithUrls } = await supabase
    .from('brands')
    .select('name, url')
    .not('url', 'is', null)
    .neq('url', '');
  
  console.log(`\nBrands with URLs: ${brandsWithUrls?.length || 0}`);
  
  // Check brands without URLs
  const { data: brandsWithoutUrls } = await supabase
    .from('brands')
    .select('name, url')
    .or('url.is.null,url.eq.');
  
  console.log(`Brands without URLs: ${brandsWithoutUrls?.length || 0}`);
  
  if (brandsWithoutUrls && brandsWithoutUrls.length > 0) {
    console.log('\nBrands missing URLs:');
    brandsWithoutUrls.forEach(brand => {
      console.log(`  - ${brand.name}`);
    });
  }
}

checkUrls();
