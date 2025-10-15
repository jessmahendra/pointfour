/** @type {import('next').NextConfig} */



// Debug: Log all environment variables to apply the changes
console.log('🔍 ENVIRONMENT DEBUG:', {
  NODE_ENV: process.env.NODE_ENV,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET'
});


const nextConfig = {
  env: {
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
