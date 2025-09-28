#!/usr/bin/env tsx

/**
 * Verify Updated Brand Descriptions
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function verifyDescriptions() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Check a few specific brands
  const brandsToCheck = ['Zara', 'Reformation', 'Toteme', 'Khaite', 'Amina Muaddi'];
  
  for (const brandName of brandsToCheck) {
    const { data: brand } = await supabase
      .from('brands')
      .select('name, description')
      .eq('name', brandName)
      .single();
    
    console.log(`${brandName}: ${brand?.description}`);
  }
  
  // Check total count
  const { count } = await supabase
    .from('brands')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\nTotal brands: ${count}`);
}

verifyDescriptions();
