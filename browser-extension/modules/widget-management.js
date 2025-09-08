// ========================================
// POINTFOUR - WIDGET MANAGEMENT MODULE
// ========================================

import { CONFIG } from './config.js';
import { getState, setState } from './state.js';
import { extractQualityInsights } from './review-analysis.js';
import { extractMaterialsFromPage } from './product-extraction.js';

// ========================================
// WIDGET CREATION AND LIFECYCLE
// ========================================

export function createWidget() {
    const widgetInjected = getState('widgetInjected');
    if (widgetInjected) {
        console.log('[PointFour] Widget already exists');
        return;
    }
    
    console.log('[PointFour] Creating widget...');
    
    // Reset loading state
    setState('currentLoadingPhase', 'initial');
    setState('hasShownFinalData', false);
    setState('loadingStartTime', Date.now());
    setState('lastDataQuality', 0);
    setState('dataUpdateCount', 0);
    
    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'pointfour-widget';
    widgetContainer.className = 'pointfour-widget pointfour-loading';
    
    // Add confidence indicator based on detection score
    const detectionScore = getState('detectionScore');
    if (detectionScore >= CONFIG.DETECTION_THRESHOLDS.HIGH_CONFIDENCE) {
        widgetContainer.classList.add('high-confidence');
    }
    
    widgetContainer.innerHTML = `
        <div class="pointfour-header">
            <div class="pointfour-logo">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" stroke-width="2"/>
                    <path d="M12 6v6l4 2" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span>PointFour</span>
            </div>
            <div class="pointfour-header-buttons">
                <button class="pointfour-minimize" aria-label="Minimize">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <line x1="5" y1="12" x2="19" y2="12" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
                <button class="pointfour-close" aria-label="Close">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <line x1="18" y1="6" x2="6" y2="18" stroke-width="2" stroke-linecap="round"/>
                        <line x1="6" y1="6" x2="18" y2="18" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>
        </div>
        <div class="pointfour-content">
            <div class="pointfour-loading-spinner">
                <div class="pointfour-spinner"></div>
                <p>Initializing analysis...</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(widgetContainer);
    setState('widgetInjected', true);
    setState('widgetContainer', widgetContainer);
    
    // Add event listeners
    const closeBtn = widgetContainer.querySelector('.pointfour-close');
    const minimizeBtn = widgetContainer.querySelector('.pointfour-minimize');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', hideWidget);
    }
    
    if (minimizeBtn) {
        minimizeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleMinimize();
        });
    }
    
    // Note: Click-outside-to-close behavior has been removed 
    // Users can close the widget using the X button or minimize it
    
    console.log('[PointFour] Widget created successfully');
}

export function showWidget() {
    const widgetContainer = getState('widgetContainer');
    if (!widgetContainer) return;
    
    // Force display and visibility
    widgetContainer.style.display = 'block';
    widgetContainer.style.visibility = 'visible';
    
    // Trigger reflow to ensure CSS transition works
    widgetContainer.offsetHeight;
    
    // Add the visible class
    widgetContainer.classList.add('pointfour-visible');
    
    console.log('[PointFour] Widget shown');
}

export function hideWidget() {
    const widgetContainer = getState('widgetContainer');
    if (!widgetContainer) return;
    
    widgetContainer.classList.remove('pointfour-visible');
    
    setTimeout(() => {
        const currentContainer = getState('widgetContainer');
        if (currentContainer && !currentContainer.classList.contains('pointfour-visible')) {
            currentContainer.remove();
            setState('widgetContainer', null);
            setState('widgetInjected', false);
        }
    }, 300);
}

export function toggleMinimize() {
    console.log('[PointFour] Toggle minimize clicked');
    const widgetContainer = getState('widgetContainer');
    if (!widgetContainer) {
        console.log('[PointFour] No widget container found');
        return;
    }
    
    const isMinimized = widgetContainer.classList.contains('pointfour-minimized');
    const minimizeBtn = widgetContainer.querySelector('.pointfour-minimize');
    const content = widgetContainer.querySelector('.pointfour-content');
    
    console.log('[PointFour] Current minimized state:', isMinimized);
    
    if (isMinimized) {
        // Expand widget
        console.log('[PointFour] Expanding widget');
        widgetContainer.classList.remove('pointfour-minimized');
        if (content) {
            content.style.display = 'block';
            console.log('[PointFour] Content display set to block');
        }
        
        // Change minimize button icon to minimize (horizontal line)
        if (minimizeBtn) {
            minimizeBtn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="5" y1="12" x2="19" y2="12" stroke-width="2" stroke-linecap="round"/>
                </svg>
            `;
            minimizeBtn.setAttribute('aria-label', 'Minimize');
        }
        
        setState('widgetMinimized', false);
    } else {
        // Minimize widget
        console.log('[PointFour] Minimizing widget');
        widgetContainer.classList.add('pointfour-minimized');
        if (content) {
            content.style.display = 'none';
            console.log('[PointFour] Content display set to none');
        }
        
        // Change minimize button icon to expand (plus or up arrow)
        if (minimizeBtn) {
            minimizeBtn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="18,15 12,9 6,15" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
            minimizeBtn.setAttribute('aria-label', 'Expand');
        }
        
        setState('widgetMinimized', true);
    }
}

// ========================================
// WIDGET CONTENT MANAGEMENT
// ========================================

export function updateWidgetContent(data) {
    const widgetContainer = getState('widgetContainer');
    if (!widgetContainer) return;
    
    const contentDiv = widgetContainer.querySelector('.pointfour-content');
    if (!contentDiv) return;
    
    // Log all data updates for debugging
    console.log('🔄 [PointFour] updateWidgetContent called with data:', {
        hasData: !!data,
        error: data?.error,
        brandName: data?.brandName,
        hasReviews: !!(data?.reviews || data?.externalSearchResults?.reviews),
        reviewsCount: (data?.reviews?.length || data?.externalSearchResults?.reviews?.length || 0),
        hasStructuredData: !!(data?.brandFitSummary?.sections || data?.externalSearchResults?.brandFitSummary?.sections),
        sectionsCount: (data?.brandFitSummary?.sections ? Object.keys(data.brandFitSummary.sections).length : 
                       (data?.externalSearchResults?.brandFitSummary?.sections ? Object.keys(data.externalSearchResults.brandFitSummary.sections).length : 0)),
        recommendation: data?.recommendation?.substring(0, 100) + '...' || 'N/A',
        currentLoadingPhase: getState('currentLoadingPhase'),
        hasShownFinalData: getState('hasShownFinalData'),
        elapsed: Date.now() - getState('loadingStartTime')
    });
    
    // Keep loading state if we're still processing
    const isProcessing = getState('isProcessing');
    if (isProcessing && !data) {
        console.log('[PointFour] Still processing, maintaining loading state');
        return;
    }
    
    // If we've already shown final data, don't show intermediate states
    const hasShownFinalData = getState('hasShownFinalData');
    if (hasShownFinalData && data && !data.error) {
        console.log('[PointFour] Final data already shown, ignoring intermediate update');
        return;
    }
    
    // Only remove loading state when we have actual data or an error
    if (data) {
        widgetContainer.classList.remove('pointfour-loading');
    }
    
    if (data && data.error) {
        contentDiv.innerHTML = `
            <div class="pointfour-error">
                <p>Unable to load fit analysis</p>
                <small>${data.error === true ? 'Please try refreshing the page' : data.error}</small>
            </div>
        `;
        setState('hasShownFinalData', true);
    } else if (data && data.status === 'no_data') {
        contentDiv.innerHTML = `
            <div class="pointfour-no-data">
                <p>${data.message || 'No fit data available for this brand'}</p>
                <small>We're working on adding more brands!</small>
            </div>
        `;
        setState('hasShownFinalData', true);
    } else if (data) {
        renderMainContent(data, contentDiv);
    }
}

function renderMainContent(data, contentDiv) {
    const brandName = data.brandName || getState('currentBrand') || 'Unknown Brand';
    const totalReviews = data.totalResults ||
                        data.brandFitSummary?.totalResults ||
                        data.externalSearchResults?.totalResults || 
                        data.richSummaryData?.totalResults || 
                        0;
    
    // Check if this is complete data that should be shown
    const hasReviews = (data.externalSearchResults?.reviews && data.externalSearchResults.reviews.length > 0) ||
                       (data.reviews && data.reviews.length > 0);
    const hasStructuredAnalysis = (data.externalSearchResults?.brandFitSummary?.sections && Object.keys(data.externalSearchResults.brandFitSummary.sections).length > 0) ||
                                (data.brandFitSummary?.sections && Object.keys(data.brandFitSummary.sections).length > 0);
    const hasRecommendation = data.recommendation && 
                             data.recommendation !== 'Analyzing fit information...' &&
                             data.recommendation.length > 20;
    
    // Calculate data quality score (0-100)
    let dataQuality = 0;
    if (hasReviews) dataQuality += 30;
    if (hasStructuredAnalysis) dataQuality += 40;
    if (hasRecommendation) dataQuality += 30;
    
    // Check if this is a final/definitive response (even if negative)
    const isFinalResponse = data.recommendation && (
        data.recommendation.includes('marketplace brand') ||
        data.recommendation.includes('not applicable') ||
        data.recommendation.includes('not available') ||
        data.recommendation.includes('no data') ||
        data.recommendation.includes('unable to analyze')
    );
    
    const isCompleteData = (hasReviews && (hasStructuredAnalysis || hasRecommendation)) || isFinalResponse;
    
    // Track data quality progression
    const dataUpdateCount = getState('dataUpdateCount') + 1;
    setState('dataUpdateCount', dataUpdateCount);
    
    const lastDataQuality = getState('lastDataQuality');
    const qualityImproved = dataQuality > lastDataQuality;
    setState('lastDataQuality', dataQuality);
    
    // Check if we should force completion due to timeout or processing state
    const elapsed = Date.now() - getState('loadingStartTime');
    const isProcessing = getState('isProcessing');
    const forceComplete = elapsed > 20000 || (!isProcessing && elapsed > 5000);
    
    // If this isn't complete data yet and we're not forcing completion, show progressive loading
    if (!isCompleteData && !data.error && !forceComplete) {
        renderProgressiveLoading(brandName, contentDiv);
        return;
    }
    
    // Mark as complete and render final content (even if incomplete)
    setState('hasShownFinalData', true);
    renderFinalContent(data, brandName, totalReviews, contentDiv);
}

function renderProgressiveLoading(brandName, contentDiv) {
    const elapsed = Date.now() - getState('loadingStartTime');
    const currentLoadingPhase = getState('currentLoadingPhase');
    
    if (elapsed < 5000) {
        // First 5 seconds: Searching
        if (currentLoadingPhase !== 'searching') {
            setState('currentLoadingPhase', 'searching');
            contentDiv.innerHTML = `
                <div class="pointfour-results">
                    <h3>${brandName}</h3>
                    <div class="pointfour-fit-info">
                        <div class="pointfour-loading-spinner">
                            <div class="pointfour-spinner"></div>
                            <p>Searching for reviews and fit information...</p>
                        </div>
                    </div>
                </div>
            `;
        }
    } else if (elapsed < 15000) {
        // 5-15 seconds: Collating
        if (currentLoadingPhase !== 'collating') {
            setState('currentLoadingPhase', 'collating');
            contentDiv.innerHTML = `
                <div class="pointfour-results">
                    <h3>${brandName}</h3>
                    <div class="pointfour-fit-info">
                        <div class="pointfour-loading-spinner">
                            <div class="pointfour-spinner"></div>
                            <p>Collating reviews and analyzing patterns...</p>
                        </div>
                    </div>
                </div>
            `;
        }
    } else {
        // 15+ seconds: Analyzing
        if (currentLoadingPhase !== 'analyzing') {
            setState('currentLoadingPhase', 'analyzing');
            contentDiv.innerHTML = `
                <div class="pointfour-results">
                    <h3>${brandName}</h3>
                    <div class="pointfour-fit-info">
                        <div class="pointfour-loading-spinner">
                            <div class="pointfour-spinner"></div>
                            <p>Generating fit analysis...</p>
                        </div>
                    </div>
                </div>
            `;
        }
    }
}

function renderFinalContent(data, brandName, totalReviews, contentDiv) {
    const isMarketplace = data.isMarketplace || false;
    const sections = data.externalSearchResults?.brandFitSummary?.sections || data.brandFitSummary?.sections || {};
    const qualityInsight = extractQualityInsights(data);
    
    // Determine if this is item-specific or brand-general
    const urlExtraction = window.pointFourURLExtraction || null;
    const itemName = urlExtraction?.itemName || null;
    const isItemSpecific = itemName && itemName.length > 0;
    
    // Generate category-specific review context copy with sources
    let reviewContext = '';
    const genericTerms = ['shop', 'store', 'collection', 'brand', 'clothing', 'fashion'];
    const isGenericTerm = itemName && genericTerms.includes(itemName.toLowerCase());
    
    // Get category information from data
    const category = data.category || urlExtraction?.category;
    const productType = data.productType || urlExtraction?.productType;
    const relevanceLevel = data.relevanceLevel;
    
    // Get top sources for transparency
    const sources = data.externalSearchResults?.brandFitSummary?.sources || [];
    const hasMoreSources = data.externalSearchResults?.brandFitSummary?.hasMoreSources || false;
    let sourcesText = '';
    
    if (sources.length > 0) {
        const sourceNames = sources.slice(0, 3).map(s => s.name);
        
        if (sourceNames.length === 1) {
            sourcesText = ` from ${sourceNames[0]}`;
        } else if (sourceNames.length === 2) {
            sourcesText = ` from ${sourceNames[0]} and ${sourceNames[1]}`;
        } else if (sourceNames.length === 3) {
            sourcesText = ` from ${sourceNames[0]}, ${sourceNames[1]}, and ${sourceNames[2]}`;
        }
        
        // Add "and more" if there are additional sources
        if (hasMoreSources) {
            sourcesText += ' and more';
        }
    }
    
    // Generate context based on category specificity and relevance
    if (relevanceLevel === 'exact_product' && itemName && !isGenericTerm) {
        reviewContext = `Based on ${totalReviews} reviews${sourcesText} for ${itemName}`;
    } else if (relevanceLevel === 'product_type' && productType) {
        const categoryText = getCategoryDisplayText(category, productType);
        reviewContext = `Based on ${totalReviews} ${brandName} ${categoryText} reviews${sourcesText}`;
    } else if (relevanceLevel === 'category' && category && category !== 'unknown') {
        const categoryText = getCategoryDisplayText(category);
        reviewContext = `Based on ${totalReviews} ${brandName} ${categoryText} reviews${sourcesText}`;
    } else if (isItemSpecific && itemName && !isGenericTerm) {
        reviewContext = `Based on ${totalReviews} reviews${sourcesText} for ${itemName}`;
    } else if (category && category !== 'unknown') {
        const categoryText = getCategoryDisplayText(category);
        reviewContext = `Based on ${totalReviews} ${brandName} ${categoryText} reviews${sourcesText}`;
    } else {
        reviewContext = `Based on ${totalReviews} ${brandName} reviews${sourcesText}`;
    }
    
    let contentHTML = `
        <div class="pointfour-results">
            <h3>${brandName}</h3>
            <div class="pointfour-meta">
                <span class="pointfour-review-count">${reviewContext}</span>
                ${isMarketplace ? '<span class="pointfour-marketplace-tag">Multi-brand site</span>' : ''}
            </div>
    `;
    
    // Main recommendation - only show if we have sections with evidence
    const hasMeaningfulData = Object.values(sections).some(section => 
        section && section.evidence && section.evidence.length > 0
    );
    
    if (data.recommendation && hasMeaningfulData) {
        const cleanedRecommendation = cleanRecommendationText(data.recommendation);
        contentHTML += `
            <div class="pointfour-fit-info">
                <div class="pointfour-main-rec">${cleanedRecommendation}</div>
            </div>
        `;
    }
    
    // Quality insights
    if (qualityInsight) {
        contentHTML += `
            <div class="pointfour-quality-insight">
                <strong>Quality:</strong> ${qualityInsight.recommendation}
            </div>
        `;
    }
    
    // Fit sections with real quotes
    if (Object.keys(sections).length > 0) {
        contentHTML += '<div class="pointfour-sections">';
        
        // Prioritize sections: fit > quality > washCare
        const sectionPriority = ['fit', 'quality', 'washCare'];
        const sortedSections = sectionPriority.filter(key => sections[key]);
        
        for (const sectionKey of sortedSections.slice(0, 3)) {
            const section = sections[sectionKey];
            if (section && section.recommendation && isUsefulRecommendation(section.recommendation)) {
                contentHTML += renderSectionWithQuotes(sectionKey, section);
            }
        }
        
        contentHTML += '</div>';
    }
    
    // Materials and Care - only show on product pages
    if (isProductPage()) {
        const materials = extractMaterialsFromPage();
        if (materials && (materials.composition.length > 0 || materials.careInstructions.length > 0)) {
            contentHTML += renderMaterialsAndCare(materials);
        }
    }
    
    // Reviews page button - show if we have reviews OR analysis data
    if (totalReviews > 0 || sections && Object.keys(sections).length > 0) {
        // Reuse urlExtraction already declared above
        
        // Build URL parameters for the full reviews page
        const params = new URLSearchParams({
            brand: brandName,
            from: 'extension'
        });
        
        // Add extracted data if available
        if (urlExtraction) {
            if (urlExtraction.itemName) params.set('item', urlExtraction.itemName);
            if (urlExtraction.category) params.set('category', urlExtraction.category);
            if (urlExtraction.productImage) params.set('image', urlExtraction.productImage);
        }
        
        // Add page context
        params.set('url', window.location.href);
        params.set('pageTitle', document.title);
        
        const analyzeUrl = `https://www.pointfour.in/extension-reviews?${params.toString()}`;
        
        contentHTML += `
            <div class="pointfour-search-info">
                <a href="${analyzeUrl}" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   class="pointfour-reviews-button">
                    <span>${totalReviews > 0 ? `Found ${totalReviews} review${totalReviews === 1 ? '' : 's'}` : 'View Full Analysis'}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M7 17L17 7"></path>
                        <path d="M7 7h10v10"></path>
                    </svg>
                </a>
            </div>
        `;
    }

    
    contentHTML += '</div>';
    contentDiv.innerHTML = contentHTML;
    
}

// ========================================
// SECTION RENDERING WITH QUOTES
// ========================================

function renderSectionWithQuotes(sectionKey, section) {
    const sectionTitle = getSectionTitle(sectionKey);
    const sectionIcon = getSectionIcon(sectionKey);
    
    // Extract the main insight from recommendation (before the quotes)
    let mainInsight = section.recommendation;
    if (mainInsight.length > 100) {
        // Truncate very long recommendations
        mainInsight = mainInsight.substring(0, 100) + '...';
    }
    
    let html = `
        <div class="pointfour-section">
            <div class="pointfour-section-header">
                <span>${sectionTitle}</span>
            </div>
            <div class="pointfour-section-content">
                <p class="pointfour-main-insight">${mainInsight}</p>
    `;
    
    // Add real user quotes if evidence exists - filter for section relevance
    if (section.evidence && section.evidence.length > 0) {
        const relevantQuotes = filterQuotesForSection(section.evidence, sectionKey);
        
        if (relevantQuotes.length > 0) {
            html += '<div class="pointfour-quotes-container">';
            for (const quote of relevantQuotes.slice(0, 3)) { // Show max 3 relevant quotes
                if (quote && quote.trim().length > 10) {
                    const cleanedQuote = cleanQuoteText(quote);
                    html += `<div class="pointfour-quote">"${cleanedQuote}"</div>`;
                }
            }
            html += '</div>';
        }
    }
    
    // Show confidence warning only if confidence is low
    if (section.confidence === 'low') {
        html += '<div class="pointfour-source">Limited data available - based on fewer reviews</div>';
    }
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}

function filterQuotesForSection(quotes, sectionKey) {
    // Define keywords for each section type
    const sectionKeywords = {
        fit: [
            // Sizing terms
            'runs small', 'runs large', 'run small', 'run large', 'runs big', 'run big',
            'true to size', 'tts', 'size up', 'size down', 'sized up', 'sized down',
            'fits small', 'fits large', 'fits big', 'fits tight', 'fits loose',
            'tight', 'loose', 'snug', 'roomy', 'baggy', 'fitted', 'oversized',
            'smaller than expected', 'bigger than expected', 'larger than expected',
            'size', 'sizing', 'fit', 'fits', 'fitting',
            // Specific size references
            'went up a size', 'went down a size', 'order a size up', 'order a size down',
            'usual size', 'normal size', 'typical size', 'my size'
        ],
        
        quality: [
            // Quality terms
            'quality', 'well made', 'poorly made', 'cheap', 'expensive', 'worth it',
            'durable', 'lasted', 'lasts', 'falling apart', 'falls apart', 
            'construction', 'stitching', 'seams', 'pilling', 'pills',
            'fades', 'faded', 'color', 'fabric quality', 'material quality',
            'feels cheap', 'feels expensive', 'feels good', 'feels bad',
            'impressive', 'disappointed', 'disappointed with', 'love the quality',
            'hate the quality', 'amazing quality', 'terrible quality',
            'overpriced', 'worth the money', 'value for money'
        ],
        
        washCare: [
            // Care and washing terms
            'wash', 'washed', 'washing', 'shrink', 'shrinks', 'shrank', 'shrinkage',
            'dry clean', 'machine wash', 'hand wash', 'cold wash', 'hot wash',
            'dryer', 'tumble dry', 'air dry', 'hang dry', 'lay flat',
            'iron', 'ironing', 'wrinkle', 'wrinkles', 'care instructions',
            'bleach', 'detergent', 'fabric softener', 'delicate cycle',
            'after washing', 'holds up', 'maintains shape', 'lost shape'
        ]
    };
    
    const keywords = sectionKeywords[sectionKey] || [];
    if (keywords.length === 0) return quotes; // Return all if no keywords defined
    
    // Score each quote based on relevance to the section
    const scoredQuotes = quotes.map(quote => {
        const lowerQuote = quote.toLowerCase();
        let score = 0;
        
        // Count keyword matches
        for (const keyword of keywords) {
            if (lowerQuote.includes(keyword.toLowerCase())) {
                score += 1;
                // Give extra weight to exact phrase matches
                if (lowerQuote.includes(keyword.toLowerCase())) {
                    score += 0.5;
                }
            }
        }
        
        return { quote, score };
    });
    
    // Filter out quotes with no relevance and sort by relevance score
    return scoredQuotes
        .filter(item => item.score > 0) // Only keep quotes with at least one keyword match
        .sort((a, b) => b.score - a.score) // Sort by relevance (highest first)
        .map(item => item.quote); // Return just the quotes
}

function cleanQuoteText(quote) {
    // Clean up quote text for display
    return quote
        .replace(/^\s*["']+|["']+\s*$/g, '') // Remove surrounding quotes
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim()
        .substring(0, 120); // Limit length
}

function isProductPage() {
    // Detect if we're on a specific product page vs a listing/category page
    const url = window.location.pathname.toLowerCase();
    const hostname = window.location.hostname.replace('www.', '').toLowerCase();
    
    // Common product page patterns
    const productPatterns = [
        /\/products?\//,  // /product/ or /products/
        /\/item\//,       // /item/
        /\/p\//,          // /p/
        /-p\d+\.html/,    // Zara style: item-name-p123.html
        /\/[^\/]+\.html/, // General .html product pages
    ];
    
    // Check URL patterns
    for (const pattern of productPatterns) {
        if (pattern.test(url)) return true;
    }
    
    // Site-specific detection
    const siteDetection = {
        'reformation.com': () => url.includes('/products/'),
        'roheframes.com': () => url.includes('/products/'),
        'everlane.com': () => url.includes('/products/'),
        'zara.com': () => /-p\d+\.html/.test(url),
    };
    
    if (siteDetection[hostname]) {
        return siteDetection[hostname]();
    }
    
    // Fallback: check for product-specific elements on page
    const productElements = [
        '.product-details',
        '.product-info', 
        '.product-form',
        '[class*="add-to-cart"]',
        '[class*="size-selector"]',
        '.product-images'
    ];
    
    return productElements.some(selector => document.querySelector(selector));
}

function renderMaterialsAndCare(materials) {
    let html = '';
    
    // Materials section
    if (materials.composition && materials.composition.length > 0) {
        // Remove duplicates and clean up
        const uniqueComposition = [...new Set(materials.composition)]
            .map(comp => comp.trim())
            .filter(comp => comp.length > 0);
            
        if (uniqueComposition.length > 0) {
            html += `
                <div class="pointfour-section">
                    <div class="pointfour-section-header">
                        <span>Materials</span>
                    </div>
                    <div class="pointfour-section-content">
                        <ul class="pointfour-bullet-list pointfour-materials-list">
            `;
            
            for (const comp of uniqueComposition.slice(0, 5)) { // Max 5 items
                html += `<li>${comp}</li>`;
            }
            
            html += `
                        </ul>
                    </div>
                </div>
            `;
        }
    }
    
    // Care instructions section
    if (materials.careInstructions && materials.careInstructions.length > 0) {
        const uniqueCareInstructions = [...new Set(materials.careInstructions)]
            .map(care => care.trim())
            .filter(care => care.length > 0);
            
        if (uniqueCareInstructions.length > 0) {
            html += `
                <div class="pointfour-section">
                    <div class="pointfour-section-header">
                        <span>Care</span>
                    </div>
                    <div class="pointfour-section-content">
                        <ul class="pointfour-bullet-list pointfour-care-list">
            `;
            
            for (const care of uniqueCareInstructions.slice(0, 4)) { // Max 4 items
                html += `<li>${care}</li>`;
            }
            
            html += `
                        </ul>
                    </div>
                </div>
            `;
        }
    }
    
    return html;
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function isUsefulRecommendation(recommendation) {
    if (!recommendation || recommendation.length < 15) return false;
    
    // Filter out generic/unhelpful responses
    const genericPhrases = [
        'no specific washing or care instructions',
        'not applicable',
        'not explicitly mentioned',
        'information is not provided',
        'information not explicitly mentioned',
        'no specific advice',
        'general care should be followed'
    ];
    
    const lowerRec = recommendation.toLowerCase();
    const isGeneric = genericPhrases.some(phrase => lowerRec.includes(phrase));
    
    return !isGeneric;
}

function cleanRecommendationText(text) {
    // Remove redundant phrases and clean up the recommendation
    return text
        .replace(/Based on \d+ reviews?,?\s*/gi, '')
        .replace(/According to reviews?,?\s*/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function getSectionTitle(sectionKey) {
    const titles = {
        fit: 'Fit',
        quality: 'Quality',
        fabric: 'Fabric',
        washCare: 'Care'
    };
    return titles[sectionKey] || sectionKey;
}

function getSectionIcon(sectionKey) {
    const icons = {
        fit: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke-width="2"/></svg>',
        quality: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" stroke-width="2"/></svg>',
        fabric: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2L2 7v10l10 5 10-5V7l-10-5z" stroke-width="2"/></svg>',
        washCare: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3" stroke-width="2"/><path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke-width="2"/></svg>'
    };
    return icons[sectionKey] || '';
}

function getCategoryDisplayText(category, productType = null) {
    // Map category and product type to user-friendly display text
    const categoryMapping = {
        shoes: productType ? `${productType}` : 'shoe',
        bags: productType ? `${productType}` : 'bag', 
        clothing: productType ? `${productType}` : 'clothing',
        accessories: productType ? `${productType}` : 'accessory'
    };
    
    const displayText = categoryMapping[category];
    if (displayText) {
        // Ensure it's in singular form for better grammar
        return displayText.endsWith('s') && displayText !== 'dress' ? displayText : displayText;
    }
    
    return category || 'product';
}


// ========================================
// PUBLIC API
// ========================================

export default {
    createWidget,
    showWidget,
    hideWidget,
    updateWidgetContent
};