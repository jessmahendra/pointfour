// ========================================
// POINTFOUR - REVIEW ANALYSIS MODULE
// ========================================

// ========================================
// QUALITY INSIGHTS EXTRACTION
// ========================================

export function extractQualityInsights(searchData) {
    if (!searchData || !searchData.brandFitSummary || !searchData.brandFitSummary.sections) {
        return null;
    }
    
    const sections = searchData.brandFitSummary.sections;
    const insights = [];
    
    // Check for quality section
    if (sections.quality) {
        insights.push({
            type: 'quality',
            recommendation: sections.quality.recommendation,
            confidence: sections.quality.confidence,
            priority: 3 // Highest priority
        });
    }
    
    // Check for fabric section
    if (sections.fabric) {
        insights.push({
            type: 'fabric',
            recommendation: sections.fabric.recommendation,
            confidence: sections.fabric.confidence,
            priority: 2
        });
    }
    
    // Check for wash care section
    if (sections.washCare) {
        insights.push({
            type: 'care',
            recommendation: sections.washCare.recommendation,
            confidence: sections.washCare.confidence,
            priority: 1
        });
    }
    
    if (insights.length === 0) {
        return null;
    }
    
    // Sort by priority (highest first) and combine
    insights.sort((a, b) => b.priority - a.priority);
    
    // Build a comprehensive but concise recommendation
    const recommendations = [];
    
    // Add quality info first if available
    const qualityInsight = insights.find(i => i.type === 'quality');
    if (qualityInsight) {
        recommendations.push(qualityInsight.recommendation);
    }
    
    // Add fabric info if different from quality
    const fabricInsight = insights.find(i => i.type === 'fabric');
    if (fabricInsight && !qualityInsight?.recommendation.toLowerCase().includes('material')) {
        recommendations.push(fabricInsight.recommendation);
    }
    
    // Add care info if significant
    const careInsight = insights.find(i => i.type === 'care');
    if (careInsight && careInsight.confidence !== 'low') {
        recommendations.push(careInsight.recommendation);
    }
    
    // Get the highest confidence level from included insights
    const includedConfidences = recommendations.length > 0 ? 
        insights.filter(i => recommendations.some(r => r === i.recommendation))
               .map(i => i.confidence)
               .filter(Boolean) : [];
    
    const highestConfidence = includedConfidences.includes('high') ? 'high' : 
                             includedConfidences.includes('medium') ? 'medium' : 'low';
    
    return recommendations.length > 0 ? {
        recommendation: recommendations.join('. '),
        confidence: highestConfidence,
        sections: insights.length
    } : null;
}

// ========================================
// REVIEW RELEVANCE CLASSIFICATION
// ========================================

export function classifyReviewRelevance(review, itemName, brandName) {
    if (!itemName || itemName === 'Unknown Item') {
        return { isItemSpecific: false, relevance: 'low' };
    }
    
    const text = `${review.title} ${review.snippet} ${review.fullContent || ''}`.toLowerCase();
    const itemWords = itemName.toLowerCase().split(' ').filter(word => word.length > 2);
    const brandWords = brandName.toLowerCase().split(' ').filter(word => word.length > 2);
    
    // Check for exact item name matches
    const hasExactItemMatch = itemWords.some(word => text.includes(word));
    const hasExactBrandMatch = brandWords.some(word => text.includes(word));
    
    // Check for fit/sizing keywords
    const hasFitKeywords = review.tags.some(tag => 
        tag.toLowerCase().includes('fit') || 
        tag.toLowerCase().includes('size') ||
        tag.toLowerCase().includes('sizing')
    );
    
    // Check for quality keywords
    const hasQualityKeywords = review.tags.some(tag => 
        tag.toLowerCase().includes('quality') || 
        tag.toLowerCase().includes('durable') ||
        tag.toLowerCase().includes('material') ||
        tag.toLowerCase().includes('fabric') ||
        tag.toLowerCase().includes('excellent') ||
        tag.toLowerCase().includes('cheap')
    );
    
    // Determine relevance
    if (hasExactItemMatch && hasExactBrandMatch && (hasFitKeywords || hasQualityKeywords)) {
        return { isItemSpecific: true, relevance: 'high' };
    } else if ((hasExactItemMatch || hasExactBrandMatch) && (hasFitKeywords || hasQualityKeywords)) {
        return { isItemSpecific: true, relevance: 'medium' };
    } else if (hasFitKeywords || hasQualityKeywords) {
        return { isItemSpecific: false, relevance: 'medium' };
    } else {
        return { isItemSpecific: false, relevance: 'low' };
    }
}

// ========================================
// CATEGORY DETECTION AND FILTERING
// ========================================

export function detectCategoryFromItemName(itemName = '') {
    console.log('[PointFour] Detecting category from item name:', itemName);
    
    const lowerItemName = itemName.toLowerCase();
    
    // Define category keywords with priority scoring
    const categoryKeywords = {
        footwear: {
            keywords: [
                'sneakers', 'shoes', 'boots', 'sandals', 'heels', 'flats', 'loafers', 
                'oxfords', 'pumps', 'stilettos', 'wedges', 'clogs', 'moccasins',
                'trainers', 'runners', 'athletic shoes', 'dress shoes', 'casual shoes',
                'ankle boots', 'knee boots', 'combat boots', 'chelsea boots',
                'ballerinas', 'ballet flats', 'espadrilles', 'slip-ons',
                'footwear', 'chaussures', 'scarpe', 'zapatos', 'schuhe'
            ],
            score: 0
        },
        tops: {
            keywords: [
                'shirt', 't-shirt', 'tshirt', 'blouse', 'top', 'sweater', 'jumper',
                'cardigan', 'hoodie', 'sweatshirt', 'pullover', 'vest', 'tank',
                'camisole', 'tunic', 'polo', 'henley', 'crop top', 'bodysuit',
                'blazer', 'jacket', 'coat', 'outerwear', 'windbreaker', 'parka',
                'bomber', 'denim jacket', 'leather jacket', 'suit jacket'
            ],
            score: 0
        },
        bottoms: {
            keywords: [
                'pants', 'trousers', 'jeans', 'chinos', 'shorts', 'skirt', 'dress',
                'leggings', 'joggers', 'sweatpants', 'cargo pants', 'wide-leg',
                'skinny jeans', 'straight jeans', 'bootcut', 'flare jeans',
                'mini skirt', 'maxi skirt', 'pencil skirt', 'a-line skirt',
                'midi dress', 'maxi dress', 'mini dress', 'shift dress', 'wrap dress'
            ],
            score: 0
        },
        accessories: {
            keywords: [
                'bag', 'purse', 'handbag', 'clutch', 'tote', 'backpack', 'satchel',
                'wallet', 'belt', 'scarf', 'hat', 'cap', 'beanie', 'jewelry',
                'necklace', 'bracelet', 'earrings', 'ring', 'watch', 'sunglasses',
                'gloves', 'mittens', 'hair accessory', 'headband', 'brooch'
            ],
            score: 0
        }
    };
    
    // Score each category based on keyword matches
    for (const [category, data] of Object.entries(categoryKeywords)) {
        for (const keyword of data.keywords) {
            if (lowerItemName.includes(keyword)) {
                data.score += keyword.length; // Longer keywords get higher scores
                
                // Exact matches get bonus points
                if (lowerItemName === keyword) {
                    data.score += 10;
                }
                
                // Word boundary matches get bonus points
                const wordBoundaryRegex = new RegExp(`\\b${keyword}\\b`, 'i');
                if (wordBoundaryRegex.test(itemName)) {
                    data.score += 5;
                }
            }
        }
    }
    
    // Find the category with the highest score
    let bestCategory = 'unknown';
    let highestScore = 0;
    let confidence = 'low';
    
    for (const [category, data] of Object.entries(categoryKeywords)) {
        if (data.score > highestScore) {
            highestScore = data.score;
            bestCategory = category;
        }
    }
    
    // Determine confidence based on score
    if (highestScore >= 15) {
        confidence = 'high';
    } else if (highestScore >= 8) {
        confidence = 'medium';
    } else if (highestScore > 0) {
        confidence = 'low';
    }
    
    console.log('[PointFour] Category detection results:', {
        category: bestCategory,
        confidence: confidence,
        score: highestScore,
        scores: Object.fromEntries(
            Object.entries(categoryKeywords).map(([cat, data]) => [cat, data.score])
        )
    });
    
    return { category: bestCategory, confidence: confidence, score: highestScore };
}

export function filterReviewsByCategory(reviews, detectedCategory, itemName = '') {
    if (!reviews || !Array.isArray(reviews) || !detectedCategory) {
        return reviews;
    }
    
    console.log('[PointFour] Filtering reviews by category:', detectedCategory, 'for item:', itemName);
    
    // Define category-specific keywords for review filtering
    const categoryFilters = {
        footwear: {
            include: [
                'shoe', 'boot', 'sneaker', 'sandal', 'heel', 'flat', 'loafer',
                'oxford', 'pump', 'stiletto', 'wedge', 'clog', 'moccasin',
                'trainer', 'runner', 'athletic', 'dress shoe', 'casual shoe',
                'ankle boot', 'knee boot', 'combat boot', 'chelsea boot',
                'ballerina', 'ballet flat', 'espadrille', 'slip-on',
                'footwear', 'sole', 'lace', 'strap', 'arch support', 'heel height',
                'toe box', 'insole', 'outsole', 'sizing', 'width', 'comfortable to walk'
            ],
            exclude: [
                'shirt', 'top', 'blouse', 'sweater', 'cardigan', 'jacket', 'coat',
                'dress', 'skirt', 'pants', 'trouser', 'jean', 'short', 'legging',
                'sleeve', 'collar', 'button', 'zipper', 'pocket', 'waist', 'hem'
            ]
        },
        tops: {
            include: [
                'shirt', 'top', 'blouse', 'sweater', 'cardigan', 'jacket', 'coat',
                'blazer', 'vest', 'hoodie', 'sweatshirt', 't-shirt', 'tank top',
                'camisole', 'crop top', 'tunic', 'polo', 'button-down',
                'sleeve', 'collar', 'neckline', 'shoulder', 'chest', 'armpit',
                'length', 'fit around chest', 'arm length', 'sleeve length'
            ],
            exclude: [
                'shoe', 'boot', 'sneaker', 'sandal', 'heel', 'flat',
                'pants', 'trouser', 'jean', 'short', 'legging', 'skirt', 'dress',
                'bag', 'purse', 'wallet', 'belt', 'scarf', 'hat', 'jewelry'
            ]
        },
        bottoms: {
            include: [
                'pants', 'trouser', 'jean', 'short', 'legging', 'skirt', 'dress',
                'overall', 'jumpsuit', 'romper', 'culotte', 'palazzo',
                'waist', 'hip', 'thigh', 'leg', 'inseam', 'rise', 'hem',
                'length', 'fit around waist', 'leg length', 'crotch', 'seat'
            ],
            exclude: [
                'shoe', 'boot', 'sneaker', 'sandal', 'heel', 'flat',
                'shirt', 'top', 'blouse', 'sweater', 'cardigan', 'jacket',
                'bag', 'purse', 'wallet', 'belt', 'scarf', 'hat', 'jewelry'
            ]
        },
        accessories: {
            include: [
                'bag', 'purse', 'wallet', 'belt', 'scarf', 'hat', 'jewelry',
                'watch', 'bracelet', 'necklace', 'earring', 'ring', 'brooch',
                'hair accessory', 'headband', 'tie', 'bow tie', 'cufflink',
                'sunglasses', 'glove', 'mitten', 'clutch', 'handbag', 'backpack',
                'tote', 'messenger bag', 'crossbody', 'shoulder bag'
            ],
            exclude: [
                'shoe', 'boot', 'sneaker', 'sandal', 'heel', 'flat',
                'shirt', 'top', 'blouse', 'sweater', 'cardigan', 'jacket',
                'pants', 'trouser', 'jean', 'short', 'legging', 'skirt', 'dress'
            ]
        }
    };
    
    const filter = categoryFilters[detectedCategory.category];
    if (!filter) {
        console.log('[PointFour] No filter found for category:', detectedCategory.category);
        return reviews;
    }
    
    const filteredReviews = reviews.filter(review => {
        const reviewText = `${review.title || ''} ${review.snippet || ''} ${review.fullContent || ''}`.toLowerCase();
        
        // Check if review contains category-specific keywords
        const hasIncludeKeywords = filter.include.some(keyword => reviewText.includes(keyword));
        const hasExcludeKeywords = filter.exclude.some(keyword => reviewText.includes(keyword));
        
        // Prioritize item name mentions
        let mentionsItem = false;
        if (itemName) {
            const itemWords = itemName.toLowerCase().split(' ').filter(word => word.length > 2);
            mentionsItem = itemWords.some(word => reviewText.includes(word));
        }
        
        // If review mentions the specific item, always include (high relevance)
        if (mentionsItem) {
            return true;
        }
        
        // Otherwise, use category filtering
        return hasIncludeKeywords && !hasExcludeKeywords;
    });
    
    console.log('[PointFour] Category filtering results:', {
        category: detectedCategory.category,
        originalCount: reviews.length,
        filteredCount: filteredReviews.length,
        filterRatio: Math.round((filteredReviews.length / reviews.length) * 100) + '%'
    });
    
    return filteredReviews;
}

// ========================================
// RELEVANT QUOTES EXTRACTION
// ========================================

export function extractRelevantQuotes(data, section = null, sectionClaim = null) {
    if (!data.externalSearchResults?.reviews || !section || !sectionClaim) {
        return [];
    }
    
    let reviews = data.externalSearchResults.reviews;
    const quotes = [];
    
    // ENHANCEMENT: Filter and prioritize reviews based on relevance
    const brandName = data.brandName;
    const itemName = window.pointFourURLExtraction?.itemName;
    
    console.log('🔍 [PointFour] Quote extraction with differentiation:', {
        totalReviews: reviews.length,
        hasItemName: !!itemName,
        itemName: itemName,
        brandName: brandName
    });
    
    if (itemName && brandName) {
        // Apply category filtering first if available
        const pageData = window.pointFourPageData;
        let productCategory = pageData?.productCategory;
        
        // Fallback: if no category is available, try to detect from item name
        if (!productCategory || productCategory.category === 'unknown') {
            productCategory = detectCategoryFromItemName(itemName);
            console.log('[PointFour] Using fallback category detection:', productCategory);
        }
        
        let categoryFilteredReviews = reviews;
        if (productCategory && productCategory.category !== 'unknown') {
            categoryFilteredReviews = filterReviewsByCategory(reviews, productCategory, itemName);
            console.log('[PointFour] Applied category filtering:', productCategory.category);
        }
        
        // Classify and sort reviews by relevance
        const classifiedReviews = categoryFilteredReviews.map(review => ({
            ...review,
            relevance: classifyReviewRelevance(review, itemName, brandName)
        }));
        
        // Sort by relevance: item-specific high > item-specific medium > general medium > general low
        classifiedReviews.sort((a, b) => {
            if (a.relevance.isItemSpecific && !b.relevance.isItemSpecific) return -1;
            if (!a.relevance.isItemSpecific && b.relevance.isItemSpecific) return 1;
            
            const relevanceOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            return relevanceOrder[b.relevance.relevance] - relevanceOrder[a.relevance.relevance];
        });
        
        // Use sorted reviews prioritizing item-specific content
        reviews = classifiedReviews;
        
        console.log('🔍 [PointFour] Review prioritization results:', {
            highRelevanceCount: classifiedReviews.filter(r => r.relevance.relevance === 'high').length,
            itemSpecificHighCount: classifiedReviews.filter(r => r.relevance.isItemSpecific && r.relevance.relevance === 'high').length
        });
    }
    
    // Helper function to detect if text sounds like a genuine user review
    const isUserReview = (text) => {
        const userReviewIndicators = [
            // Personal pronouns and opinions
            /\bi\s/i, /\bmy\s/i, /\bme\s/i, /\bwould\s/i, /\blove\s/i, /\bhate\s/i, /\bthink\s/i, /\bfeel\s/i,
            // Purchase/experience language
            /\bbought\s/i, /\bpurchased\s/i, /\bordered\s/i, /\breceived\s/i, /\bwearing\s/i, /\bwore\s/i,
            // Review-specific language
            /\brecommend\s/i, /\bwould buy\s/i, /\bso happy\s/i, /\bdisappointed\s/i, /\bexpected\s/i,
            // Quality assessments
            /\bgreat quality\s/i, /\bpoor quality\s/i, /\bworth it\s/i, /\bnot worth\s/i
        ];
        
        // Must contain at least one user review indicator
        const hasUserIndicator = userReviewIndicators.some(pattern => pattern.test(text));
        
        // Exclude obvious product descriptions/marketing copy
        const marketingIndicators = [
            /^[A-Z][a-z]+ - /i, // "Brand - product name" format
            /\b(classic|iconic|premium|luxury|collection|designed|crafted|features|composition|model is wearing|drop shoulder|crew neck)\b/i,
            /\bmade (in|from|with)\b/i,
            /\b(uk|us|eu) size\b/i,
            /\bwomen's clothing\b/i,
            /\btall women's fashion\b/i,
            /\bfinely knitted\b/i,
            /100% (organic )?cotton/i,
            /100% (soft )?merino wool/i
        ];
        
        const hasMarketingIndicator = marketingIndicators.some(pattern => pattern.test(text));
        
        return hasUserIndicator && !hasMarketingIndicator;
    };
    
    // Define claim-specific patterns that must match the exact section claim
    const getClaimPatterns = (section, claim) => {
        const claimLower = claim.toLowerCase();
        
        if (section === 'fit') {
            if (claimLower.includes('true to size')) {
                return [
                    /true to size/i,
                    /fits (true to|as expected|perfectly)/i,
                    /(ordered|bought|got) my (usual|normal|regular) size/i,
                    /size (s|m|l|xl|\d+) (fits|is) (perfect|great)/i,
                    /no need to size (up|down)/i
                ];
            } else if (claimLower.includes('runs small')) {
                return [
                    /runs small/i,
                    /size up/i,
                    /ordered (a )?size (up|larger)/i,
                    /too (small|tight)/i,
                    /smaller than expected/i
                ];
            } else if (claimLower.includes('runs large')) {
                return [
                    /runs large/i,
                    /size down/i,
                    /ordered (a )?size (down|smaller)/i,
                    /too (big|loose)/i,
                    /larger than expected/i
                ];
            } else if (claimLower.includes('oversized') || claimLower.includes('relaxed')) {
                return [
                    /oversized/i,
                    /relaxed fit/i,
                    /loose/i,
                    /roomy/i,
                    /baggy/i
                ];
            }
        } else if (section === 'quality') {
            if (claimLower.includes('high quality') || claimLower.includes('excellent') || claimLower.includes('premium')) {
                return [
                    /high quality/i,
                    /(excellent|amazing|great|premium|superior) quality/i,
                    /(very )?well made/i,
                    /feels (premium|luxurious|expensive)/i,
                    /worth (the money|every penny)/i,
                    /quality is (amazing|excellent|great)/i
                ];
            } else if (claimLower.includes('good quality') || claimLower.includes('decent')) {
                return [
                    /good quality/i,
                    /decent quality/i,
                    /quality is (good|decent|okay)/i,
                    /well constructed/i
                ];
            } else if (claimLower.includes('poor quality') || claimLower.includes('cheap')) {
                return [
                    /poor quality/i,
                    /cheap (feeling|quality)/i,
                    /not worth/i,
                    /disappointing quality/i,
                    /feels cheap/i
                ];
            } else if (claimLower.includes('soft') || claimLower.includes('comfortable')) {
                return [
                    /(very |so )?soft/i,
                    /(really |very )?comfortable/i,
                    /feels (great|amazing|soft)/i,
                    /comfortable to wear/i
                ];
            }
        } else if (section === 'washCare') {
            if (claimLower.includes('shrink')) {
                return [
                    /shrink/i,
                    /shrunk/i,
                    /got smaller/i,
                    /after wash/i
                ];
            } else if (claimLower.includes('wash') || claimLower.includes('care')) {
                return [
                    /wash(ed|ing)/i,
                    /(after|post) wash/i,
                    /easy to care for/i,
                    /holds up well/i,
                    /maintained/i,
                    /care instructions/i
                ];
            }
        }
        
        return []; // No patterns match - no quotes should be shown
    };
    
    const claimPatterns = getClaimPatterns(section, sectionClaim);
    
    // If no specific patterns for this claim, don't show quotes
    if (claimPatterns.length === 0) {
        return [];
    }
    
    for (const review of reviews.slice(0, 15)) { // Check more reviews for better matching
        // Only use actual review content fields
        const reviewFields = [
            review.fullContent,
            review.reviewText,
            review.content,
            review.text
        ].filter(Boolean);
        
        if (reviewFields.length === 0) continue;
        
        const fullText = reviewFields.join(' ').toLowerCase();
        
        // Double-check brand relevance
        const brandName = data.brandName?.toLowerCase() || '';
        if (brandName) {
            // Create flexible brand matching
            const brandVariations = [
                brandName,
                brandName.replace(/frames?$/, ''),
                brandName.replace(/[^a-z]/g, ''),
                brandName.split(/[^a-z]/)[0]
            ].filter(v => v.length > 2);
            
            const hasValidBrandMention = brandVariations.some(variation => 
                fullText.includes(variation)
            );
            
            if (!hasValidBrandMention) {
                continue;
            }
        }
        
        // Check if this text matches the claim patterns
        const matchingPatterns = claimPatterns.filter(pattern => pattern.test(fullText));
        
        if (matchingPatterns.length === 0) continue;
        
        // Verify it's actually a user review
        if (!isUserReview(fullText)) continue;
        
        // Extract the most relevant sentence containing the match
        const sentences = fullText.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
        
        for (const pattern of matchingPatterns) {
            const matchingSentence = sentences.find(sentence => pattern.test(sentence));
            
            if (matchingSentence && matchingSentence.length >= 20 && matchingSentence.length <= 200) {
                // Clean up the sentence
                const cleanedSentence = matchingSentence
                    .replace(/^(and |but |so |also )/i, '')
                    .charAt(0).toUpperCase() + matchingSentence.slice(1);
                
                quotes.push({
                    text: cleanedSentence,
                    source: review.source || 'Review',
                    confidence: 'high',
                    pattern: pattern.source
                });
                
                if (quotes.length >= 2) break; // Limit quotes per section
            }
        }
        
        if (quotes.length >= 2) break;
    }
    
    return quotes.slice(0, 2); // Max 2 quotes per section
}

export default {
    extractQualityInsights,
    classifyReviewRelevance,
    detectCategoryFromItemName,
    filterReviewsByCategory,
    extractRelevantQuotes
};