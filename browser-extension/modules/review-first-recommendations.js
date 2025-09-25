// ========================================
// REVIEW-FIRST RECOMMENDATION SYSTEM
// ========================================

/**
 * Calculation-First Size Recommendation Engine with Social Review Enhancement
 * 
 * This system uses size calculations as the PRIMARY decision factor,
 * with social reviews providing important validation and enhancement.
 * 
 * Philosophy: "Measurements first, social insights enhance"
 */

// Review-based sizing patterns
const REVIEW_SIZING_PATTERNS = {
  RUNS_SMALL: {
    keywords: ['runs small', 'fits small', 'too small', 'size up', 'sized up', 'tight'],
    weight: 1.0,
    recommendation: 'size_up'
  },
  RUNS_LARGE: {
    keywords: ['runs large', 'fits large', 'too big', 'too large', 'size down', 'sized down', 'oversized'],
    weight: 1.0,
    recommendation: 'size_down'
  },
  TRUE_TO_SIZE: {
    keywords: ['true to size', 'fits perfectly', 'perfect fit', 'great fit', 'good fit', 'fits well'],
    weight: 1.0,
    recommendation: 'true_to_size'
  },
  INCONSISTENT: {
    keywords: ['inconsistent', 'varies', 'depends', 'sometimes', 'mixed'],
    weight: 0.8,
    recommendation: 'caution'
  }
};

// Source credibility weights (higher = more trusted)
const SOURCE_CREDIBILITY = {
  'reddit.com': 1.0,           // Community discussions
  'substack.com': 0.9,         // Independent reviews
  'styleforum.net': 0.9,       // Fashion community
  'thefashionspot.com': 0.8,   // Fashion community
  'purseforum.com': 0.8,       // Fashion community
  'medium.com': 0.7,           // Blog reviews
  'youtube.com': 0.7,          // Video reviews
  'instagram.com': 0.6,        // Social media
  'twitter.com': 0.6,          // Social media
  'vogue.com': 0.5,            // Editorial (less personal)
  'elle.com': 0.5,             // Editorial
  'default': 0.5               // Other sources
};

/**
 * Analyze social reviews to determine sizing patterns
 * This is the PRIMARY decision factor
 */
export function analyzeSocialReviewPatterns(reviews) {
    console.log('[PointFour] Analyzing social review patterns...');
    
    if (!reviews || reviews.length === 0) {
        return {
            pattern: 'no_data',
            confidence: 0,
            evidence: [],
            recommendation: 'use_measurements_only'
        };
    }

    const patternScores = {};
    const evidence = [];
    let totalWeight = 0;

    // Initialize pattern scores
    Object.keys(REVIEW_SIZING_PATTERNS).forEach(pattern => {
        patternScores[pattern] = 0;
    });

    // Analyze each review
    reviews.forEach(review => {
        const text = `${review.title || ''} ${review.snippet || ''}`.toLowerCase();
        const source = getSourceFromUrl(review.url);
        const credibility = SOURCE_CREDIBILITY[source] || SOURCE_CREDIBILITY.default;
        
        // Check each pattern
        Object.entries(REVIEW_SIZING_PATTERNS).forEach(([patternName, pattern]) => {
            pattern.keywords.forEach(keyword => {
                if (text.includes(keyword)) {
                    const score = pattern.weight * credibility;
                    patternScores[patternName] += score;
                    totalWeight += score;
                    
                    // Collect evidence
                    evidence.push({
                        pattern: patternName,
                        keyword: keyword,
                        source: source,
                        credibility: credibility,
                        quote: extractRelevantQuote(text, keyword),
                        url: review.url
                    });
                }
            });
        });
    });

    // Determine dominant pattern
    const dominantPattern = Object.entries(patternScores)
        .sort((a, b) => b[1] - a[1])[0];

    const confidence = totalWeight > 0 ? Math.min(dominantPattern[1] / totalWeight, 1.0) : 0;

    console.log('[PointFour] Review analysis results:', {
        dominantPattern: dominantPattern[0],
        confidence: confidence,
        evidenceCount: evidence.length,
        totalWeight: totalWeight
    });

    return {
        pattern: dominantPattern[0],
        confidence: confidence,
        evidence: evidence.slice(0, 5), // Top 5 pieces of evidence
        recommendation: REVIEW_SIZING_PATTERNS[dominantPattern[0]]?.recommendation || 'unknown',
        totalReviews: reviews.length,
        patternScores: patternScores
    };
}

/**
 * Generate size recommendation based primarily on calculations with social review enhancement
 * Size calculations are PRIMARY, social reviews provide important validation/enhancement
 */
export function generateCalculationFirstRecommendation(userMeasurements, sizeChart, socialReviews, garmentType = 'general') {
    console.log('[PointFour] Generating calculation-first recommendation with social review enhancement...');
    
    // Step 1: Calculate ease targets and find best size match (PRIMARY FACTOR)
    const easeTargets = calculateEaseTargets(garmentType);
    const baseRecommendation = generateMeasurementBasedRecommendation(userMeasurements, sizeChart, easeTargets);
    
    // Step 2: Analyze social review patterns (ENHANCEMENT FACTOR)
    const reviewAnalysis = analyzeSocialReviewPatterns(socialReviews);
    
    // Step 3: Enhance recommendation with social review insights
    let enhancedRecommendation = {
        ...baseRecommendation,
        evidence: [],
        socialReviewCount: socialReviews.length,
        reviewPattern: reviewAnalysis.pattern,
        reviewEnhancement: null
    };

    // Step 4: Apply social review enhancements (if available)
    if (reviewAnalysis.pattern !== 'no_data' && reviewAnalysis.confidence > 0.3) {
        enhancedRecommendation = applySocialReviewEnhancement(
            enhancedRecommendation, 
            reviewAnalysis, 
            easeTargets
        );
    }

    // Step 5: Add social review evidence
    enhancedRecommendation.evidence = reviewAnalysis.evidence;

    console.log('[PointFour] Calculation-first recommendation generated:', {
        baseSize: baseRecommendation.size,
        enhancedSize: enhancedRecommendation.size,
        confidence: enhancedRecommendation.confidence,
        reviewPattern: enhancedRecommendation.reviewPattern,
        evidenceCount: enhancedRecommendation.evidence.length
    });

    return enhancedRecommendation;
}

/**
 * Apply social review enhancements to calculation-based recommendation
 * This enhances the primary calculation with social insights
 */
function applySocialReviewEnhancement(baseRecommendation, reviewAnalysis, easeTargets) {
    const enhanced = { ...baseRecommendation };
    
    // Boost confidence if reviews support the calculation
    if (reviewAnalysis.confidence > 0.5) {
        if (enhanced.confidence === 'low') enhanced.confidence = 'medium';
        else if (enhanced.confidence === 'medium') enhanced.confidence = 'high';
    }

    // Apply social review insights as enhancements
    switch (reviewAnalysis.recommendation) {
        case 'size_up':
            enhanced.reasoning.push('Customer reviews suggest sizing up - consider one size larger');
            enhanced.fitAdvice.push('Social reviews indicate this brand runs small');
            enhanced.reviewEnhancement = 'suggest_size_up';
            break;
            
        case 'size_down':
            enhanced.reasoning.push('Customer reviews suggest sizing down - consider one size smaller');
            enhanced.fitAdvice.push('Social reviews indicate this brand runs large');
            enhanced.reviewEnhancement = 'suggest_size_down';
            break;
            
        case 'true_to_size':
            enhanced.reasoning.push('Customer reviews confirm true-to-size fit');
            enhanced.fitAdvice.push('Social reviews support the calculated size recommendation');
            enhanced.reviewEnhancement = 'confirm_true_to_size';
            break;
            
        case 'caution':
            enhanced.reasoning.push('Customer reviews show mixed sizing - double-check measurements');
            enhanced.fitAdvice.push('Social reviews indicate inconsistent sizing');
            enhanced.reviewEnhancement = 'caution_inconsistent';
            enhanced.confidence = 'medium'; // Lower confidence due to inconsistency
            break;
    }

    // Add specific review quotes for context
    reviewAnalysis.evidence.slice(0, 2).forEach(evidence => {
        if (evidence.quote) {
            enhanced.fitAdvice.push(`Customer feedback: "${evidence.quote}"`);
        }
    });

    return enhanced;
}

/**
 * Fallback recommendation using only measurements
 */
function generateMeasurementBasedRecommendation(userMeasurements, sizeChart, easeTargets) {
    return {
        size: findBestSizeMatch(userMeasurements, sizeChart, easeTargets),
        confidence: 'low',
        reasoning: ['Using measurements only - no social reviews available'],
        fitAdvice: ['Consider checking customer reviews for sizing insights'],
        alternativeSizes: []
    };
}

/**
 * Find size with adjustment based on review insights
 */
function findSizeWithAdjustment(userMeasurements, sizeChart, adjustment, easeTargets) {
    // This would integrate with the existing size matching logic
    // but apply the review-based adjustment
    const baseSize = findBestSizeMatch(userMeasurements, sizeChart, easeTargets);
    
    if (adjustment === 0) return baseSize;
    
    // Apply size adjustment based on review insights
    // This is where we'd implement the logic to go up/down one size
    return applySizeAdjustment(baseSize, adjustment, sizeChart);
}

/**
 * Calculate ease targets for different garment types
 */
function calculateEaseTargets(garmentType) {
    const easeTargets = {
        'tops': { bust: 2, waist: 2, hip: 2 },
        'bottoms': { waist: 1, hip: 1, inseam: 0 },
        'dresses': { bust: 2, waist: 1, hip: 2 },
        'shoes': { length: 0.5, width: 0.5 },
        'general': { bust: 2, waist: 1, hip: 1 }
    };
    
    return easeTargets[garmentType] || easeTargets.general;
}

/**
 * Find best size match using measurements and ease targets
 */
function findBestSizeMatch(userMeasurements, sizeChart, easeTargets) {
    // This would integrate with existing size matching logic
    // Enhanced with ease calculations
    return 'M'; // Placeholder
}

/**
 * Apply size adjustment based on review insights
 */
function applySizeAdjustment(baseSize, adjustment, sizeChart) {
    // This would implement logic to go up/down one size
    // based on the size chart data
    return baseSize; // Placeholder
}

/**
 * Extract relevant quote from review text
 */
function extractRelevantQuote(text, keyword) {
    const sentences = text.split(/[.!?]+/);
    const relevantSentence = sentences.find(sentence => 
        sentence.toLowerCase().includes(keyword)
    );
    
    if (relevantSentence) {
        return relevantSentence.trim().substring(0, 120) + '...';
    }
    
    return null;
}

/**
 * Get source from URL
 */
function getSourceFromUrl(url) {
    try {
        const domain = new URL(url).hostname.toLowerCase();
        return domain.replace('www.', '');
    } catch {
        return 'default';
    }
}

/**
 * Calculate overall confidence based on review quality and quantity
 */
export function calculateReviewConfidence(reviews, reviewAnalysis) {
    let confidence = 0;
    
    // Base confidence from review analysis
    confidence += reviewAnalysis.confidence * 0.6;
    
    // Boost for review quantity
    if (reviews.length >= 10) {
        confidence += 0.3;
    } else if (reviews.length >= 5) {
        confidence += 0.2;
    } else if (reviews.length >= 2) {
        confidence += 0.1;
    }
    
    // Boost for high-quality sources
    const highQualitySources = reviews.filter(review => {
        const source = getSourceFromUrl(review.url);
        return SOURCE_CREDIBILITY[source] >= 0.8;
    });
    
    if (highQualitySources.length >= 3) {
        confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
}
