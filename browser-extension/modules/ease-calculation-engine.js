// ========================================
// EASE CALCULATION ENGINE
// ========================================

/**
 * Ease Calculation Engine for Size Recommendations
 * 
 * This engine calculates appropriate ease (extra room) for different garment types
 * and integrates with the calculation-first recommendation system.
 */

// Category-specific ease targets (in inches)
const EASE_TARGETS = {
    'tops': {
        bust: { min: 1.5, ideal: 2.5, max: 4.0 },
        waist: { min: 1.0, ideal: 2.0, max: 3.5 },
        hip: { min: 1.0, ideal: 2.0, max: 3.5 },
        shoulder: { min: 0.5, ideal: 1.0, max: 2.0 },
        sleeve: { min: 0.5, ideal: 1.0, max: 2.0 }
    },
    'bottoms': {
        waist: { min: 0.5, ideal: 1.0, max: 2.0 },
        hip: { min: 1.0, ideal: 2.0, max: 3.0 },
        inseam: { min: 0, ideal: 0, max: 0.5 },
        rise: { min: 0, ideal: 0, max: 0.5 }
    },
    'dresses': {
        bust: { min: 1.0, ideal: 2.0, max: 3.5 },
        waist: { min: 0.5, ideal: 1.0, max: 2.0 },
        hip: { min: 1.0, ideal: 2.0, max: 3.0 },
        length: { min: 0, ideal: 0, max: 1.0 }
    },
    'shoes': {
        length: { min: 0.25, ideal: 0.5, max: 0.75 },
        width: { min: 0.1, ideal: 0.2, max: 0.3 }
    },
    'accessories': {
        // Minimal ease for accessories
        width: { min: 0, ideal: 0.25, max: 0.5 }
    },
    'general': {
        bust: { min: 1.5, ideal: 2.5, max: 4.0 },
        waist: { min: 1.0, ideal: 2.0, max: 3.5 },
        hip: { min: 1.0, ideal: 2.0, max: 3.5 }
    }
};

// Fit preference adjustments
const FIT_PREFERENCE_ADJUSTMENTS = {
    'slim_fit': -0.5,      // Reduce ease by 0.5"
    'regular_fit': 0,       // No adjustment
    'relaxed_fit': 0.5,     // Increase ease by 0.5"
    'oversized': 1.0        // Increase ease by 1.0"
};

/**
 * Calculate ease targets for a specific garment type
 */
export function calculateEaseTargets(garmentType, fitPreference = 'regular_fit') {
    console.log('[PointFour] Calculating ease targets:', { garmentType, fitPreference });
    
    const baseTargets = EASE_TARGETS[garmentType] || EASE_TARGETS.general;
    const adjustment = FIT_PREFERENCE_ADJUSTMENTS[fitPreference] || 0;
    
    const adjustedTargets = {};
    Object.entries(baseTargets).forEach(([measurement, ease]) => {
        adjustedTargets[measurement] = {
            min: Math.max(0, ease.min + adjustment),
            ideal: Math.max(0, ease.ideal + adjustment),
            max: Math.max(0, ease.max + adjustment)
        };
    });
    
    console.log('[PointFour] Ease targets calculated:', adjustedTargets);
    return adjustedTargets;
}

/**
 * Calculate ideal garment measurements based on body measurements and ease targets
 */
export function calculateIdealGarmentMeasurements(bodyMeasurements, easeTargets) {
    console.log('[PointFour] Calculating ideal garment measurements...');
    
    const idealMeasurements = {};
    
    Object.entries(easeTargets).forEach(([measurement, ease]) => {
        const bodyValue = bodyMeasurements[measurement];
        if (bodyValue && typeof bodyValue === 'number') {
            idealMeasurements[measurement] = {
                body: bodyValue,
                ideal: bodyValue + ease.ideal,
                min: bodyValue + ease.min,
                max: bodyValue + ease.max,
                ease: ease.ideal
            };
        }
    });
    
    console.log('[PointFour] Ideal garment measurements:', idealMeasurements);
    return idealMeasurements;
}

/**
 * Find best size match using ease calculations
 */
export function findBestSizeMatchWithEase(userMeasurements, sizeChart, garmentType, fitPreference = 'regular_fit') {
    console.log('[PointFour] Finding best size match with ease calculations...');
    
    // Step 1: Calculate ease targets
    const easeTargets = calculateEaseTargets(garmentType, fitPreference);
    
    // Step 2: Calculate ideal garment measurements
    const idealMeasurements = calculateIdealGarmentMeasurements(userMeasurements, easeTargets);
    
    // Step 3: Find best matching size
    const availableSizes = Object.keys(sizeChart.measurements || {});
    let bestMatch = {
        size: null,
        score: Infinity,
        confidence: 'low',
        measurements: null,
        fitNotes: [],
        easeAnalysis: {}
    };
    
    availableSizes.forEach(size => {
        const sizeData = sizeChart.measurements[size];
        if (!sizeData || typeof sizeData !== 'object') return;
        
        const matchScore = calculateEaseMatchScore(idealMeasurements, sizeData, easeTargets);
        
        if (matchScore.totalScore < bestMatch.score) {
            bestMatch = {
                size: size,
                score: matchScore.totalScore,
                confidence: matchScore.confidence,
                measurements: sizeData,
                fitNotes: matchScore.fitNotes,
                easeAnalysis: matchScore.easeAnalysis
            };
        }
    });
    
    console.log('[PointFour] Best size match found:', {
        size: bestMatch.size,
        score: bestMatch.score,
        confidence: bestMatch.confidence
    });
    
    return bestMatch;
}

/**
 * Calculate how well a size matches ideal measurements with ease considerations
 */
function calculateEaseMatchScore(idealMeasurements, sizeMeasurements, easeTargets) {
    let totalScore = 0;
    let measurementCount = 0;
    const fitNotes = [];
    const easeAnalysis = {};
    
    Object.entries(idealMeasurements).forEach(([measurement, ideal]) => {
        const sizeValue = sizeMeasurements[measurement];
        if (sizeValue && typeof sizeValue === 'number') {
            measurementCount++;
            
            // Calculate ease difference
            const actualEase = sizeValue - ideal.body;
            const easeDifference = Math.abs(actualEase - ideal.ease);
            
            // Score based on ease difference (lower is better)
            const easeScore = easeDifference * 2; // Weight ease heavily
            totalScore += easeScore;
            
            // Analyze fit
            const fitAnalysis = analyzeFit(actualEase, ideal, measurement);
            fitNotes.push(fitAnalysis.note);
            easeAnalysis[measurement] = {
                body: ideal.body,
                garment: sizeValue,
                actualEase: actualEase,
                idealEase: ideal.ease,
                easeDifference: easeDifference,
                fit: fitAnalysis.fit
            };
        }
    });
    
    // Calculate confidence based on score and measurement count
    const avgScore = measurementCount > 0 ? totalScore / measurementCount : 10;
    let confidence = 'low';
    if (avgScore < 1) confidence = 'high';
    else if (avgScore < 2) confidence = 'medium';
    
    return {
        totalScore: avgScore,
        confidence: confidence,
        fitNotes: fitNotes,
        easeAnalysis: easeAnalysis
    };
}

/**
 * Analyze fit based on ease
 */
function analyzeFit(actualEase, ideal, measurement) {
    const easeDifference = actualEase - ideal.ease;
    
    if (actualEase < ideal.min) {
        return {
            fit: 'tight',
            note: `${measurement} will be tight (${actualEase.toFixed(1)}" ease vs ${ideal.min.toFixed(1)}" minimum)`
        };
    } else if (actualEase > ideal.max) {
        return {
            fit: 'loose',
            note: `${measurement} will be loose (${actualEase.toFixed(1)}" ease vs ${ideal.max.toFixed(1)}" maximum)`
        };
    } else if (Math.abs(easeDifference) <= 0.5) {
        return {
            fit: 'ideal',
            note: `${measurement} will fit well (${actualEase.toFixed(1)}" ease)`
        };
    } else if (easeDifference > 0) {
        return {
            fit: 'slightly_loose',
            note: `${measurement} will be slightly loose (${actualEase.toFixed(1)}" ease)`
        };
    } else {
        return {
            fit: 'slightly_tight',
            note: `${measurement} will be slightly tight (${actualEase.toFixed(1)}" ease)`
        };
    }
}

/**
 * Generate fit advice based on ease analysis
 */
export function generateEaseBasedFitAdvice(easeAnalysis, garmentType) {
    const advice = [];
    const fitIssues = [];
    const goodFits = [];
    
    Object.entries(easeAnalysis).forEach(([measurement, analysis]) => {
        if (analysis.fit === 'ideal' || analysis.fit === 'slightly_loose' || analysis.fit === 'slightly_tight') {
            goodFits.push(measurement);
        } else {
            fitIssues.push(analysis);
        }
    });
    
    // Generate advice based on fit analysis
    if (fitIssues.length === 0) {
        advice.push('This size should provide a good fit across all measurements');
    } else {
        fitIssues.forEach(issue => {
            if (issue.fit === 'tight') {
                advice.push(`Consider sizing up for better ${issue.measurement} fit`);
            } else if (issue.fit === 'loose') {
                advice.push(`Consider sizing down for better ${issue.measurement} fit`);
            }
        });
    }
    
    // Add garment-specific advice
    if (garmentType === 'tops' && goodFits.includes('bust') && goodFits.includes('waist')) {
        advice.push('Good fit for tops - bust and waist measurements align well');
    } else if (garmentType === 'bottoms' && goodFits.includes('waist') && goodFits.includes('hip')) {
        advice.push('Good fit for bottoms - waist and hip measurements align well');
    }
    
    return advice;
}

/**
 * Detect garment type from product information
 */
export function detectGarmentType(productName, category) {
    const name = (productName || '').toLowerCase();
    const cat = (category || '').toLowerCase();
    
    // Tops
    if (name.includes('shirt') || name.includes('blouse') || name.includes('top') || 
        name.includes('sweater') || name.includes('cardigan') || name.includes('tank') ||
        cat.includes('top')) {
        return 'tops';
    }
    
    // Bottoms
    if (name.includes('pants') || name.includes('jeans') || name.includes('trousers') || 
        name.includes('shorts') || name.includes('skirt') || cat.includes('bottom')) {
        return 'bottoms';
    }
    
    // Dresses
    if (name.includes('dress') || name.includes('gown') || cat.includes('dress')) {
        return 'dresses';
    }
    
    // Shoes
    if (name.includes('shoe') || name.includes('boot') || name.includes('sneaker') || 
        name.includes('sandal') || cat.includes('shoe') || cat.includes('footwear')) {
        return 'shoes';
    }
    
    // Accessories
    if (name.includes('bag') || name.includes('belt') || name.includes('hat') || 
        cat.includes('accessory')) {
        return 'accessories';
    }
    
    return 'general';
}

/**
 * Calculate size recommendation with ease and social review integration
 */
export function calculateSizeRecommendation(userMeasurements, sizeChart, socialReviews, productInfo) {
    console.log('[PointFour] Calculating comprehensive size recommendation...');
    
    // Step 1: Detect garment type
    const garmentType = detectGarmentType(productInfo.name, productInfo.category);
    
    // Step 2: Find best size match using ease calculations (PRIMARY)
    const sizeMatch = findBestSizeMatchWithEase(userMeasurements, sizeChart, garmentType);
    
    // Step 3: Generate fit advice based on ease analysis
    const fitAdvice = generateEaseBasedFitAdvice(sizeMatch.easeAnalysis, garmentType);
    
    // Step 4: Create base recommendation
    const recommendation = {
        size: sizeMatch.size,
        confidence: sizeMatch.confidence,
        reasoning: [`Calculated based on your measurements and ${garmentType} ease targets`],
        fitAdvice: fitAdvice,
        easeAnalysis: sizeMatch.easeAnalysis,
        garmentType: garmentType,
        socialReviewCount: socialReviews.length,
        evidence: []
    };
    
    // Step 5: Enhance with social reviews (if available)
    if (socialReviews && socialReviews.length > 0) {
        const reviewAnalysis = analyzeSocialReviewPatterns(socialReviews);
        if (reviewAnalysis.pattern !== 'no_data') {
            recommendation.evidence = reviewAnalysis.evidence;
            recommendation.reviewPattern = reviewAnalysis.pattern;
            
            // Add social review insights
            switch (reviewAnalysis.recommendation) {
                case 'size_up':
                    recommendation.fitAdvice.push('Customer reviews suggest sizing up');
                    break;
                case 'size_down':
                    recommendation.fitAdvice.push('Customer reviews suggest sizing down');
                    break;
                case 'true_to_size':
                    recommendation.fitAdvice.push('Customer reviews confirm true-to-size fit');
                    if (recommendation.confidence === 'low') recommendation.confidence = 'medium';
                    break;
            }
        }
    }
    
    console.log('[PointFour] Comprehensive recommendation generated:', {
        size: recommendation.size,
        confidence: recommendation.confidence,
        garmentType: recommendation.garmentType,
        socialReviewCount: recommendation.socialReviewCount
    });
    
    return recommendation;
}
