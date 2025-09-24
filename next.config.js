/** @type {import('next').NextConfig} */

// GPT-5 Testing Configuration
const ENABLE_GPT5_TESTING = process.env.ENABLE_GPT5_TESTING === 'true';
const GPT5_TEST_PERCENTAGE = parseInt(process.env.GPT5_TEST_PERCENTAGE || '10') || 10;

// Debug: Log all environment variables to apply the changes
console.log('🔍 ENVIRONMENT DEBUG:', {
  NODE_ENV: process.env.NODE_ENV,
  ENABLE_GPT5_TESTING: process.env.ENABLE_GPT5_TESTING,
  GPT5_TEST_PERCENTAGE: process.env.GPT5_TEST_PERCENTAGE,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET'
});

console.log('🧪 GPT-5 TESTING CONFIG:', {
  enabled: ENABLE_GPT5_TESTING,
  testPercentage: GPT5_TEST_PERCENTAGE,
  model: 'gpt-5-mini'
});

const nextConfig = {
  env: {
    // GPT-5 Testing Configuration
    ENABLE_GPT5_TESTING: process.env.ENABLE_GPT5_TESTING || 'false',
    GPT5_TEST_PERCENTAGE: process.env.GPT5_TEST_PERCENTAGE || '10',
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/analyze',
        permanent: false, // temporary redirect - easy to remove later
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Handle Konva canvas dependency
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
