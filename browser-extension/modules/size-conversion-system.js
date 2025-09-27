// ========================================
// SIZE CONVERSION SYSTEM
// ========================================

/**
 * Size Conversion System for Different Brand Sizing Systems
 * 
 * This module handles conversion between different sizing systems used by various brands.
 * It provides intelligent size recommendations based on the brand's specific sizing system.
 */

// Brand-specific sizing system mappings
const BRAND_SIZING_SYSTEMS = {
    'frame': 'frame_numeric',
    'frame denim': 'frame_numeric',
    'frame jeans': 'frame_numeric',
    'agolde': 'frame_numeric', // Similar to Frame
    'mother': 'frame_numeric', // Similar to Frame
    'citizens of humanity': 'frame_numeric', // Similar to Frame
    'j brand': 'frame_numeric', // Similar to Frame
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
    // US Standard to Frame Numeric
    'us_to_frame': {
        0: 23,   // XXS
        2: 24,   // XS
        4: 25,   // XS
        6: 25,   // S
        8: 26,   // S
        10: 27,  // M
        12: 28,  // M
        14: 29,  // L
        16: 30,  // L
        18: 31,  // XL
        20: 32,  // XL
        22: 33,  // XXL
        24: 34   // XXL
    },
    
    // Frame Numeric to US Standard
    'frame_to_us': {
        23: 0,   // XXS
        24: 2,   // XS
        25: 6,   // S
        26: 8,   // S
        27: 10,  // M
        28: 12,  // M
        29: 14,  // L
        30: 16,  // L
        31: 18,  // XL
        32: 20,  // XL
        33: 22,  // XXL
        34: 24   // XXL
    },
    
    // US Standard to European
    'us_to_eu': {
        0: 32,   // XXS
        2: 34,   // XS
        4: 36,   // XS
        6: 36,   // S
        8: 38,   // S
        10: 40,  // M
        12: 42,  // M
        14: 44,  // L
        16: 46,  // L
        18: 48,  // XL
        20: 50,  // XL
        22: 52,  // XXL
        24: 54   // XXL
    },
    
    // European to US Standard
    'eu_to_us': {
        32: 0,   // XXS
        34: 2,   // XS
        36: 6,   // S
        38: 8,   // S
        40: 10,  // M
        42: 12,  // M
        44: 14,  // L
        46: 16,  // L
        48: 18,  // XL
        50: 20,  // XL
        52: 22,  // XXL
        54: 24   // XXL
    },
    
    // US Standard to UK
    'us_to_uk': {
        0: 4,    // XXS
        2: 6,    // XS
        4: 8,    // XS
        6: 8,    // S
        8: 10,   // S
        10: 12,  // M
        12: 14,  // M
        14: 16,  // L
        16: 18,  // L
        18: 20,  // XL
        20: 22,  // XL
        22: 24,  // XXL
        24: 26   // XXL
    },
    
    // UK to US Standard
    'uk_to_us': {
        4: 0,    // XXS
        6: 2,    // XS
        8: 6,    // S
        10: 8,   // S
        12: 10,  // M
        14: 12,  // M
        16: 14,  // L
        18: 16,  // L
        20: 18,  // XL
        22: 20,  // XL
        24: 22,  // XXL
        26: 24   // XXL
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
export function detectBrandSizingSystem(brandName, sizeChart = null) {
    console.log('[PointFour] Detecting sizing system for brand:', brandName);
    
    if (!brandName) {
        return 'standard_us'; // Default fallback
    }
    
    const brandKey = brandName.toLowerCase().trim();
    
    // Check if brand is in our mapping
    if (BRAND_SIZING_SYSTEMS[brandKey]) {
        const system = BRAND_SIZING_SYSTEMS[brandKey];
        console.log('[PointFour] Brand sizing system detected:', system);
        return system;
    }
    
    // If we have a size chart, analyze the sizes to detect the system
    if (sizeChart && sizeChart.measurements) {
        const detectedSystem = analyzeSizeChartForSystem(sizeChart);
        if (detectedSystem) {
            console.log('[PointFour] Size chart analysis detected system:', detectedSystem);
            return detectedSystem;
        }
    }
    
    // Default to US standard
    console.log('[PointFour] Using default US standard sizing system');
    return 'standard_us';
}

/**
 * Analyze a size chart to detect the sizing system
 */
function analyzeSizeChartForSystem(sizeChart) {
    const sizes = Object.keys(sizeChart.measurements);
    
    // Check for Frame numeric sizing (25, 26, 27, etc.)
    const frameNumericSizes = sizes.filter(size => {
        const num = parseInt(size);
        return !isNaN(num) && num >= 23 && num <= 34;
    });
    
    if (frameNumericSizes.length >= 3) {
        return 'frame_numeric';
    }
    
    // Check for European sizing (32, 34, 36, etc.)
    const europeanSizes = sizes.filter(size => {
        const num = parseInt(size);
        return !isNaN(num) && num >= 32 && num <= 54 && num % 2 === 0;
    });
    
    if (europeanSizes.length >= 3) {
        return 'european';
    }
    
    // Check for UK sizing (4, 6, 8, etc.)
    const ukSizes = sizes.filter(size => {
        const num = parseInt(size);
        return !isNaN(num) && num >= 4 && num <= 26 && num % 2 === 0;
    });
    
    if (ukSizes.length >= 3) {
        return 'uk';
    }
    
    // Check for US standard sizing (0, 2, 4, 6, 8, etc.)
    const usSizes = sizes.filter(size => {
        const num = parseInt(size);
        return !isNaN(num) && num >= 0 && num <= 24 && num % 2 === 0;
    });
    
    if (usSizes.length >= 3) {
        return 'standard_us';
    }
    
    // Check for letter sizing (XS, S, M, L, XL)
    const letterSizes = sizes.filter(size => {
        return ['XS', 'S', 'M', 'L', 'XL', 'XXL'].includes(size.toUpperCase());
    });
    
    if (letterSizes.length >= 3) {
        return 'asian';
    }
    
    return null;
}

/**
 * Convert a size from one system to another
 */
export function convertSize(size, fromSystem, toSystem) {
    console.log('[PointFour] Converting size:', { size, fromSystem, toSystem });
    
    if (fromSystem === toSystem) {
        return size;
    }
    
    const conversionKey = `${fromSystem}_to_${toSystem}`;
    const conversionTable = SIZE_CONVERSION_TABLES[conversionKey];
    
    if (!conversionTable) {
        console.warn('[PointFour] No conversion table found for:', conversionKey);
        return size;
    }
    
    const convertedSize = conversionTable[size];
    
    if (convertedSize === undefined) {
        console.warn('[PointFour] No conversion found for size:', size);
        return size;
    }
    
    console.log('[PointFour] Size converted:', { original: size, converted: convertedSize });
    return convertedSize;
}

/**
 * Generate intelligent size recommendation based on brand's sizing system
 */
export function generateIntelligentSizeRecommendation(userSize, brandName, sizeChart = null) {
    console.log('[PointFour] Generating intelligent size recommendation:', { userSize, brandName });
    
    // Detect the brand's sizing system
    const brandSystem = detectBrandSizingSystem(brandName, sizeChart);
    const userSystem = 'standard_us'; // Assume user size is in US standard
    
    // Convert user size to brand's system
    const convertedSize = convertSize(userSize, userSystem, brandSystem);
    
    // Generate recommendation text
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
export function getSizeConversionInfo(brandName, sizeChart = null) {
    const brandSystem = detectBrandSizingSystem(brandName, sizeChart);
    const systemInfo = SIZE_SYSTEMS[brandSystem];
    
    return {
        brandSystem: brandSystem,
        systemName: systemInfo.name,
        description: systemInfo.description,
        availableSizes: systemInfo.sizes,
        conversionTable: SIZE_CONVERSION_TABLES[`standard_us_to_${brandSystem}`] || null
    };
}

/**
 * Check if a size exists in a brand's sizing system
 */
export function isValidSizeForBrand(size, brandName, sizeChart = null) {
    const brandSystem = detectBrandSizingSystem(brandName, sizeChart);
    const systemInfo = SIZE_SYSTEMS[brandSystem];
    
    return systemInfo.sizes.includes(parseInt(size)) || systemInfo.sizes.includes(size);
}

/**
 * Get alternative sizes for a brand (one size up/down)
 */
export function getAlternativeSizesForBrand(size, brandName, sizeChart = null) {
    const brandSystem = detectBrandSizingSystem(brandName, sizeChart);
    const systemInfo = SIZE_SYSTEMS[brandSystem];
    const sizes = systemInfo.sizes;
    
    const currentIndex = sizes.indexOf(parseInt(size));
    
    if (currentIndex === -1) {
        return { sizeUp: null, sizeDown: null };
    }
    
    return {
        sizeUp: currentIndex < sizes.length - 1 ? sizes[currentIndex + 1] : null,
        sizeDown: currentIndex > 0 ? sizes[currentIndex - 1] : null
    };
}
