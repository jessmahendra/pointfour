#!/usr/bin/env tsx

/**
 * Check Current Brand Descriptions
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkDescriptions() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: brands } = await supabase
    .from('brands')
    .select('name, description')
    .limit(10);

  console.log('Sample brand descriptions:');
  brands?.forEach((brand, i) => {
    console.log(`${i+1}. ${brand.name}: ${brand.description}`);
  });
}

checkDescriptions();
