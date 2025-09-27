// ========================================
// SIZE CONVERSION UTILITIES FOR API
// ========================================

/**
 * Size conversion utilities for API routes
 * This provides the same functionality as the browser extension size conversion system
 * but adapted for server-side use in Next.js API routes
 */

// Brand-specific sizing system mappings
const BRAND_SIZING_SYSTEMS = {
    'frame': 'frame_numeric',
    'frame denim': 'frame_numeric',
    'frame jeans': 'frame_numeric',
    'agolde': 'frame_numeric',
    'mother': 'frame_numeric',
    'citizens of humanity': 'frame_numeric',
    'j brand': 'frame_numeric',
    'rag & bone': 'standard_us',
    'everlane': 'standard_us',
    'madewell': 'standard_us',
    'anthropologie': 'standard_us',
    'urban outfitters': 'standard_us',
    'zara': 'european',
    'h&m': 'european',
    'cos': 'european',
    'uniqlo': 'asian',
    'mango': 'european'
};

// Size conversion tables between different systems
const SIZE_CONVERSION_TABLES = {
    'us_to_frame': {
        0: 23, 2: 24, 4: 25, 6: 25, 8: 26, 10: 27, 12: 28, 14: 29, 16: 30, 18: 31, 20: 32, 22: 33, 24: 34
    },
    'frame_to_us': {
        23: 0, 24: 2, 25: 6, 26: 8, 27: 10, 28: 12, 29: 14, 30: 16, 31: 18, 32: 20, 33: 22, 34: 24
    },
    'us_to_eu': {
        0: 32, 2: 34, 4: 36, 6: 36, 8: 38, 10: 40, 12: 42, 14: 44, 16: 46, 18: 48, 20: 50, 22: 52, 24: 54
    },
    'eu_to_us': {
        32: 0, 34: 2, 36: 6, 38: 8, 40: 10, 42: 12, 44: 14, 46: 16, 48: 18, 50: 20, 52: 22, 54: 24
    },
    'us_to_uk': {
        0: 4, 2: 6, 4: 8, 6: 8, 8: 10, 10: 12, 12: 14, 14: 16, 16: 18, 18: 20, 20: 22, 22: 24, 24: 26
    },
    'uk_to_us': {
        4: 0, 6: 2, 8: 6, 10: 8, 12: 10, 14: 12, 16: 14, 18: 16, 20: 18, 22: 20, 24: 22, 26: 24
    }
};

// Size system definitions
const SIZE_SYSTEMS = {
    'standard_us': {
        name: 'US Standard',
        sizes: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24],
        description: 'Standard US sizing (0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24)'
    },
    'frame_numeric': {
        name: 'Frame Numeric',
        sizes: [23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34],
        description: 'Frame numeric sizing (23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34)'
    },
    'european': {
        name: 'European',
        sizes: [32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54],
        description: 'European sizing (32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54)'
    },
    'uk': {
        name: 'UK',
        sizes: [4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26],
        description: 'UK sizing (4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26)'
    },
    'asian': {
        name: 'Asian',
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        description: 'Asian sizing (XS, S, M, L, XL, XXL)'
    }
};

/**
 * Detect the sizing system used by a brand
 */
export function detectBrandSizingSystem(brandName: string): string {
    if (!brandName) {
        return 'standard_us';
    }
    
    const brandKey = brandName.toLowerCase().trim();
    
    if (BRAND_SIZING_SYSTEMS[brandKey]) {
        return BRAND_SIZING_SYSTEMS[brandKey];
    }
    
    return 'standard_us';
}

/**
 * Convert a size from one system to another
 */
export function convertSize(size: number, fromSystem: string, toSystem: string): number {
    if (fromSystem === toSystem) {
        return size;
    }
    
    const conversionKey = `${fromSystem}_to_${toSystem}`;
    const conversionTable = SIZE_CONVERSION_TABLES[conversionKey];
    
    if (!conversionTable) {
        return size;
    }
    
    const convertedSize = conversionTable[size];
    
    if (convertedSize === undefined) {
        return size;
    }
    
    return convertedSize;
}

/**
 * Generate intelligent size recommendation based on brand's sizing system
 */
export function generateIntelligentSizeRecommendation(
    userSize: number, 
    brandName: string
): {
    recommendedSize: number;
    originalSize: number;
    brandSystem: string;
    systemName: string;
    recommendation: string;
    confidence: string;
} {
    const brandSystem = detectBrandSizingSystem(brandName);
    const userSystem = 'standard_us';
    
    const convertedSize = convertSize(userSize, userSystem, brandSystem);
    const systemInfo = SIZE_SYSTEMS[brandSystem];
    
    let recommendation = '';
    
    if (brandSystem === 'frame_numeric') {
        recommendation = `If you're usually a US size ${userSize}, try Frame size ${convertedSize}. Frame uses numeric sizing (${systemInfo.description}).`;
    } else if (brandSystem === 'european') {
        recommendation = `If you're usually a US size ${userSize}, try size ${convertedSize} (European sizing).`;
    } else if (brandSystem === 'uk') {
        recommendation = `If you're usually a US size ${userSize}, try UK size ${convertedSize}.`;
    } else if (brandSystem === 'asian') {
        recommendation = `If you're usually a US size ${userSize}, try size ${convertedSize} (Asian sizing).`;
    } else {
        recommendation = `If you're usually a size ${userSize}, this brand uses standard US sizing, so try size ${userSize}.`;
    }
    
    return {
        recommendedSize: convertedSize,
        originalSize: userSize,
        brandSystem: brandSystem,
        systemName: systemInfo.name,
        recommendation: recommendation,
        confidence: 'high'
    };
}

/**
 * Get size conversion information for a brand
 */
export function getSizeConversionInfo(brandName: string) {
    const brandSystem = detectBrandSizingSystem(brandName);
    const systemInfo = SIZE_SYSTEMS[brandSystem];
    
    return {
        brandSystem: brandSystem,
        systemName: systemInfo.name,
        description: systemInfo.description,
        availableSizes: systemInfo.sizes,
        conversionTable: SIZE_CONVERSION_TABLES[`standard_us_to_${brandSystem}`] || null
    };
}
