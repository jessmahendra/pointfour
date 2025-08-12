import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID,
    AIRTABLE_BRANDS_TABLE: process.env.AIRTABLE_BRANDS_TABLE,
    AIRTABLE_REVIEWS_TABLE: process.env.AIRTABLE_REVIEWS_TABLE,
  },
  // Ensure environment variables are available at build time
  serverExternalPackages: ['airtable'],
};

export default nextConfig;
