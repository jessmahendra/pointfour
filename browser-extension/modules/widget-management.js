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
    
    // Debug logging for data detection
    console.log('🔍 [PointFour] Data detection debug:', {
        hasReviews,
        hasStructuredAnalysis,
        hasRecommendation,
        sectionsData: data.externalSearchResults?.brandFitSummary?.sections || data.brandFitSummary?.sections,
        sectionsKeys: data.externalSearchResults?.brandFitSummary?.sections ? Object.keys(data.externalSearchResults.brandFitSummary.sections) : 
                     (data.brandFitSummary?.sections ? Object.keys(data.brandFitSummary.sections) : []),
        recommendation: data.recommendation?.substring(0, 100)
    });
    
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
    
    // Simplified logic: if we have structured analysis OR recommendation, show it
    const isCompleteData = hasStructuredAnalysis || hasRecommendation || isFinalResponse;
    
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
    
    // Debug logging for sections
    console.log('🔍 [PointFour] renderFinalContent debug:', {
        sectionsData: sections,
        sectionsKeys: Object.keys(sections),
        sectionsCount: Object.keys(sections).length,
        hasFit: !!sections.fit,
        hasQuality: !!sections.quality,
        hasWashCare: !!sections.washCare,
        fitRecommendation: sections.fit?.recommendation?.substring(0, 100),
        qualityRecommendation: sections.quality?.recommendation?.substring(0, 100),
        fitEvidence: sections.fit?.evidence?.length || 0,
        qualityEvidence: sections.quality?.evidence?.length || 0,
        washCareEvidence: sections.washCare?.evidence?.length || 0
    });
    
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
    
    console.log('🔍 [PointFour] Main recommendation check:', {
        hasRecommendation: !!data.recommendation,
        hasMeaningfulData,
        recommendation: data.recommendation?.substring(0, 100),
        sectionsWithEvidence: Object.values(sections).map(section => ({
            hasEvidence: !!(section && section.evidence && section.evidence.length > 0),
            evidenceCount: section?.evidence?.length || 0
        }))
    });
    
    if (data.recommendation) {
        const cleanedRecommendation = cleanRecommendationText(data.recommendation);
        console.log('🔍 [PointFour] Showing main recommendation:', cleanedRecommendation.substring(0, 100));
        contentHTML += `
            <div class="pointfour-fit-info">
                <div class="pointfour-main-rec">${cleanedRecommendation}</div>
            </div>
        `;
    } else {
        console.log('🔍 [PointFour] Not showing main recommendation - missing recommendation');
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
        console.log('🔍 [PointFour] Rendering sections:', {
            sectionsCount: Object.keys(sections).length,
            sectionKeys: Object.keys(sections),
            sections: sections
        });
        
        contentHTML += '<div class="pointfour-sections">';
        
        // Prioritize sections: fit > quality > washCare
        const sectionPriority = ['fit', 'quality', 'washCare'];
        const sortedSections = sectionPriority.filter(key => sections[key]);
        
        console.log('🔍 [PointFour] Sorted sections to render:', sortedSections);
        
        for (const sectionKey of sortedSections.slice(0, 3)) {
            const section = sections[sectionKey];
            console.log(`🔍 [PointFour] Processing section ${sectionKey}:`, {
                hasSection: !!section,
                hasRecommendation: !!(section && section.recommendation),
                recommendation: section?.recommendation?.substring(0, 100),
                isUseful: section && section.recommendation ? isUsefulRecommendation(section.recommendation) : false,
                hasEvidence: !!(section && section.evidence && section.evidence.length > 0),
                evidenceCount: section?.evidence?.length || 0
            });
            
            if (section && section.recommendation) {
                const renderedSection = renderSectionWithQuotes(sectionKey, section);
                console.log(`🔍 [PointFour] Rendered section ${sectionKey}:`, renderedSection.substring(0, 200) + '...');
                contentHTML += renderedSection;
            } else {
                console.log(`🔍 [PointFour] Skipping section ${sectionKey} - missing data`);
            }
        }
        
        contentHTML += '</div>';
    } else {
        console.log('🔍 [PointFour] No sections to render - sections object is empty');
    }
    
    // Enhanced Size Chart - show if available
    if (data.enhancedSizeChart && data.enhancedSizeChart.measurements && Object.keys(data.enhancedSizeChart.measurements).length > 0) {
        contentHTML += renderEnhancedSizeChart(data.enhancedSizeChart);
    }
    
    // Always show tailored recommendations section (even without size chart)
    contentHTML += `
        <div class="pointfour-tailored-recommendations">
            <button class="pointfour-tailored-btn" onclick="window.pointFourShowSizeInput()">
                Find my size
            </button>
        </div>
    `;
    
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

function renderEnhancedSizeChart(sizeChart) {
    const { brand, productType, measurements, sizeSystem, confidence, sizingAdvice, modelInfo } = sizeChart;
    
    // Create size chart table
    const sizes = Object.keys(measurements).slice(0, 6); // Limit to first 6 sizes
    const measurementKeys = ['waist', 'hips', 'bust', 'chest', 'length', 'inseam'];
    
    let tableHTML = '';
    if (sizes.length > 0) {
        // Get available measurements from the first size
        const firstSize = measurements[sizes[0]];
        const availableMeasurements = measurementKeys.filter(key => firstSize[key] !== undefined);
        
        if (availableMeasurements.length > 0) {
            tableHTML = `
                <div class="pointfour-size-chart">
                    <h4>📏 Size Chart (${sizeSystem})</h4>
                    <div class="pointfour-size-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Size</th>
                                    ${availableMeasurements.map(key => `<th>${key.charAt(0).toUpperCase() + key.slice(1)}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${sizes.map(size => `
                                    <tr>
                                        <td><strong>${size}</strong></td>
                                        ${availableMeasurements.map(key => `<td>${measurements[size][key] || '-'}</td>`).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }
    }
    
    // Add sizing advice if available
    let adviceHTML = '';
    if (sizingAdvice && sizingAdvice.length > 0) {
        adviceHTML = `
            <div class="pointfour-sizing-advice">
                <h4>💡 Sizing Tips</h4>
                <ul>
                    ${sizingAdvice.slice(0, 3).map(advice => `<li>${advice}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    // Add model info if available
    let modelHTML = '';
    if (modelInfo && (modelInfo.height || modelInfo.size)) {
        modelHTML = `
            <div class="pointfour-model-info">
                <small>Model info: ${modelInfo.height ? `Height: ${modelInfo.height}` : ''}${modelInfo.height && modelInfo.size ? ', ' : ''}${modelInfo.size ? `Wearing size: ${modelInfo.size}` : ''}</small>
            </div>
        `;
    }
    
    return `
        <div class="pointfour-enhanced-size-chart">
            ${tableHTML}
            ${adviceHTML}
            ${modelHTML}
        </div>
    `;
}

// ========================================
// TAILORED RECOMMENDATIONS - SIZE INPUT MODAL
// ========================================

function showSizeInputModal() {
    console.log('[PointFour] Showing size input in widget...');
    
    // Get the current size chart data
    const currentData = getState('currentData');
    const sizeChart = currentData?.enhancedSizeChart;
    
    // Find the tailored recommendations section
    const tailoredSection = document.querySelector('.pointfour-tailored-recommendations');
    if (!tailoredSection) {
        console.log('[PointFour] Tailored recommendations section not found');
        return;
    }
    
    // Create size input form
    const sizeOptions = sizeChart && sizeChart.measurements ? 
        Object.keys(sizeChart.measurements).map(size => 
            `<option value="${size}">${size.toUpperCase()}</option>`
        ).join('') : 
        '<option value="xs">XS</option><option value="s">S</option><option value="m">M</option><option value="l">L</option><option value="xl">XL</option>';
    
    tailoredSection.innerHTML = `
        <div class="pointfour-size-input-form">
            <h4>Get Tailored Recommendations</h4>
            <p class="pointfour-form-description">Share your size for personalized fit advice</p>
            <form id="pointfour-size-form" class="pointfour-size-form">
                <div class="pointfour-form-group">
                    <label for="pointfour-size-select">Your Size</label>
                    <select id="pointfour-size-select" name="size">
                        <option value="">Select your size</option>
                        ${sizeOptions}
                    </select>
                </div>
                <div class="pointfour-form-group">
                    <label for="pointfour-measurements">Measurements (optional)</label>
                    <div class="pointfour-measurements-grid">
                        <input type="number" id="pointfour-bust" placeholder="Bust (cm)" min="0" max="200">
                        <input type="number" id="pointfour-waist" placeholder="Waist (cm)" min="0" max="200">
                        <input type="number" id="pointfour-hips" placeholder="Hips (cm)" min="0" max="200">
                    </div>
                </div>
                <div class="pointfour-form-actions">
                    <button type="button" class="pointfour-btn-secondary" onclick="window.pointFourResetSizeInput()">
                        Cancel
                    </button>
                    <button type="submit" class="pointfour-btn-primary">
                        Get Recommendations
                    </button>
                </div>
            </form>
        </div>
    `;
    
    // Handle form submission
    const form = document.getElementById('pointfour-size-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSizeFormSubmission(form, sizeChart);
    });
    
    // Make reset function globally available
    window.pointFourResetSizeInput = () => {
        tailoredSection.innerHTML = `
            <button class="pointfour-tailored-btn" onclick="window.pointFourShowSizeInput()">
                Find my size
            </button>
        `;
    };
    
    // Make the size input function globally available
    window.pointFourShowSizeInput = showSizeInputModal;
}

function handleSizeFormSubmission(form, sizeChart) {
    const formData = new FormData(form);
    const selectedSize = formData.get('size');
    const bust = document.getElementById('pointfour-bust').value;
    const waist = document.getElementById('pointfour-waist').value;
    const hips = document.getElementById('pointfour-hips').value;
    
    console.log('[PointFour] Size form submitted:', { selectedSize, bust, waist, hips });
    
    // Generate tailored recommendations
    const recommendations = generateTailoredRecommendations(selectedSize, { bust, waist, hips }, sizeChart);
    
    // Show recommendations
    showTailoredRecommendations(recommendations, sizeChart);
    
    // Close the modal
    window.pointFourCloseSizeInput();
}

function generateTailoredRecommendations(selectedSize, measurements, sizeChart) {
    console.log('[PointFour] Generating tailored recommendations:', {
        selectedSize,
        measurements,
        hasSizeChart: !!sizeChart,
        sizeChartKeys: sizeChart ? Object.keys(sizeChart.measurements || {}) : []
    });
    
    const recommendations = {
        sizeMatch: null,
        fitAdvice: [],
        confidence: 'low',
        alternativeSizes: [],
        fitAnalysis: null,
        reviewInsights: []
    };
    
    if (sizeChart && sizeChart.measurements && Object.keys(sizeChart.measurements).length > 0) {
        // Use sophisticated size matching algorithm
        const bestMatch = findBestSizeMatch(selectedSize, measurements, sizeChart.measurements);
        
        recommendations.sizeMatch = bestMatch;
        recommendations.confidence = bestMatch.confidence;
        recommendations.fitAdvice = generateSizeAdvice(bestMatch, measurements, sizeChart);
        recommendations.alternativeSizes = findAlternativeSizes(bestMatch, sizeChart.measurements);
        recommendations.fitAnalysis = analyzeFitPatterns(bestMatch, sizeChart);
        
        // TODO: Add review insights when we implement review filtering
        // recommendations.reviewInsights = findSimilarReviewers(measurements, sizeChart);
        
    } else {
        recommendations.fitAdvice = [
            'No size chart available for this item.',
            'Consider trying your usual size or checking the brand\'s general sizing guide.',
            'Look for reviews mentioning sizing to get additional guidance.'
        ];
    }
    
    return recommendations;
}

// ========================================
// SOPHISTICATED SIZE MATCHING ALGORITHM
// ========================================

/**
 * Find the best size match using measurements and size chart data
 */
function findBestSizeMatch(selectedSize, measurements, sizeChartMeasurements) {
    console.log('[PointFour] Finding best size match:', {
        selectedSize,
        measurements,
        availableSizes: Object.keys(sizeChartMeasurements)
    });
    
    const availableSizes = Object.keys(sizeChartMeasurements);
    let bestMatch = {
        size: selectedSize || 'unknown',
        confidence: 'low',
        score: 0,
        measurements: null,
        fitNotes: []
    };
    
    // If user provided measurements, find the closest match
    if (measurements.bust || measurements.waist || measurements.hips) {
        let bestScore = Infinity;
        let bestSize = selectedSize;
        
        for (const size of availableSizes) {
            const sizeData = sizeChartMeasurements[size];
            if (!sizeData || typeof sizeData !== 'object') continue;
            
            const score = calculateSizeMatchScore(measurements, sizeData);
            console.log(`[PointFour] Size ${size} score:`, score);
            
            if (score < bestScore) {
                bestScore = score;
                bestSize = size;
                bestMatch = {
                    size: size,
                    confidence: score < 2 ? 'high' : score < 5 ? 'medium' : 'low',
                    score: score,
                    measurements: sizeData,
                    fitNotes: generateFitNotes(measurements, sizeData, score)
                };
            }
        }
    } else if (selectedSize && sizeChartMeasurements[selectedSize]) {
        // If no measurements provided, use selected size
        bestMatch = {
            size: selectedSize,
            confidence: 'medium',
            score: 0,
            measurements: sizeChartMeasurements[selectedSize],
            fitNotes: ['Based on your selected size']
        };
    }
    
    return bestMatch;
}

/**
 * Calculate how well user measurements match a size's measurements
 */
function calculateSizeMatchScore(userMeasurements, sizeMeasurements) {
    let totalScore = 0;
    let measurementCount = 0;
    
    // Check each measurement type
    const measurementTypes = ['bust', 'waist', 'hip', 'chest'];
    
    for (const type of measurementTypes) {
        const userValue = parseFloat(userMeasurements[type]);
        const sizeValue = parseFloat(sizeMeasurements[type]);
        
        if (!isNaN(userValue) && !isNaN(sizeValue)) {
            const difference = Math.abs(userValue - sizeValue);
            // Score based on difference (lower is better)
            totalScore += difference;
            measurementCount++;
        }
    }
    
    // Return average difference, or high score if no measurements match
    return measurementCount > 0 ? totalScore / measurementCount : 10;
}

/**
 * Generate fit notes based on measurement comparison
 */
function generateFitNotes(userMeasurements, sizeMeasurements, score) {
    const notes = [];
    
    if (score < 2) {
        notes.push('Excellent fit match!');
    } else if (score < 5) {
        notes.push('Good fit match with minor adjustments needed');
    } else {
        notes.push('Consider trying a different size');
    }
    
    // Add specific measurement notes
    const measurementTypes = ['bust', 'waist', 'hip', 'chest'];
    
    for (const type of measurementTypes) {
        const userValue = parseFloat(userMeasurements[type]);
        const sizeValue = parseFloat(sizeMeasurements[type]);
        
        if (!isNaN(userValue) && !isNaN(sizeValue)) {
            const difference = userValue - sizeValue;
            if (Math.abs(difference) > 2) {
                if (difference > 0) {
                    notes.push(`${type} is ${difference.toFixed(1)}cm larger than size chart`);
                } else {
                    notes.push(`${type} is ${Math.abs(difference).toFixed(1)}cm smaller than size chart`);
                }
            }
        }
    }
    
    return notes;
}

/**
 * Find alternative sizes based on the best match
 */
function findAlternativeSizes(bestMatch, sizeChartMeasurements) {
    const alternatives = [];
    const currentSize = bestMatch.size;
    
    // Get size order for finding adjacent sizes
    const sizeOrder = getSizeOrder(Object.keys(sizeChartMeasurements));
    const currentIndex = sizeOrder.indexOf(currentSize);
    
    if (currentIndex !== -1) {
        // Add adjacent sizes
        if (currentIndex > 0) {
            const smallerSize = sizeOrder[currentIndex - 1];
            if (sizeChartMeasurements[smallerSize]) {
                alternatives.push({
                    size: smallerSize,
                    reason: 'Try one size smaller if you prefer a tighter fit',
                    measurements: sizeChartMeasurements[smallerSize]
                });
            }
        }
        
        if (currentIndex < sizeOrder.length - 1) {
            const largerSize = sizeOrder[currentIndex + 1];
            if (sizeChartMeasurements[largerSize]) {
                alternatives.push({
                    size: largerSize,
                    reason: 'Try one size larger if you prefer a looser fit',
                    measurements: sizeChartMeasurements[largerSize]
                });
            }
        }
    }
    
    return alternatives;
}

/**
 * Get size order for finding adjacent sizes
 */
function getSizeOrder(sizes) {
    const sizeOrder = ['xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'];
    const numericSizes = sizes.filter(size => !isNaN(parseInt(size))).sort((a, b) => parseInt(a) - parseInt(b));
    const alphaSizes = sizes.filter(size => isNaN(parseInt(size))).sort((a, b) => {
        const aIndex = sizeOrder.indexOf(a.toLowerCase());
        const bIndex = sizeOrder.indexOf(b.toLowerCase());
        return aIndex - bIndex;
    });
    
    return [...alphaSizes, ...numericSizes];
}

/**
 * Generate size advice based on the match and size chart
 */
function generateSizeAdvice(bestMatch, measurements, sizeChart) {
    const advice = [];
    
    // Add fit notes
    advice.push(...bestMatch.fitNotes);
    
    // Add confidence-based advice
    if (bestMatch.confidence === 'high') {
        advice.push('This size should fit you well based on the measurements');
    } else if (bestMatch.confidence === 'medium') {
        advice.push('This size is close to your measurements - consider your fit preference');
    } else {
        advice.push('Consider trying this size but be prepared to exchange if needed');
    }
    
    // Add size chart specific advice
    if (sizeChart.sizingAdvice && sizeChart.sizingAdvice.length > 0) {
        advice.push(...sizeChart.sizingAdvice.slice(0, 2));
    }
    
    // Add brand-specific advice based on confidence
    if (sizeChart.confidence === 'high') {
        advice.push('Size chart data is reliable for this brand');
    } else if (sizeChart.confidence === 'medium') {
        advice.push('Size chart data is generally accurate for this brand');
    }
    
    return advice;
}

/**
 * Analyze fit patterns for future review integration
 */
function analyzeFitPatterns(bestMatch, sizeChart) {
    return {
        recommendedSize: bestMatch.size,
        confidence: bestMatch.confidence,
        measurementAccuracy: bestMatch.score,
        // TODO: Add review-based fit patterns when we implement review filtering
        reviewFitPatterns: null,
        commonIssues: []
    };
}

function showTailoredRecommendations(recommendations, sizeChart) {
    console.log('[PointFour] Showing tailored recommendations:', recommendations);
    
    // Create recommendations display
    const recommendationsHTML = `
        <div class="pointfour-tailored-results">
            <h4>Your Personalized Size Recommendations</h4>
            
            ${recommendations.sizeMatch ? `
                <div class="pointfour-size-match">
                    <div class="pointfour-recommended-size">
                        <strong>Recommended Size:</strong> ${recommendations.sizeMatch.size.toUpperCase()}
                        <span class="pointfour-confidence-badge confidence-${recommendations.sizeMatch.confidence}">
                            ${recommendations.sizeMatch.confidence} confidence
                        </span>
                    </div>
                    ${recommendations.sizeMatch.measurements ? `
                        <div class="pointfour-size-measurements">
                            <small>Size chart measurements: 
                                ${Object.entries(recommendations.sizeMatch.measurements)
                                    .filter(([key, value]) => typeof value === 'number' && !isNaN(value))
                                    .map(([key, value]) => `${key}: ${value}cm`)
                                    .join(', ')}
                            </small>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            
            ${recommendations.fitAdvice.length > 0 ? `
                <div class="pointfour-fit-advice">
                    <strong>Fit Analysis:</strong>
                    <ul>
                        ${recommendations.fitAdvice.map(advice => `<li>${advice}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${recommendations.alternativeSizes.length > 0 ? `
                <div class="pointfour-alternative-sizes">
                    <strong>Alternative Sizes:</strong>
                    <ul>
                        ${recommendations.alternativeSizes.map(alt => `
                            <li>
                                <strong>${alt.size.toUpperCase()}</strong> - ${alt.reason}
                                ${alt.measurements ? `
                                    <small>(${Object.entries(alt.measurements)
                                        .filter(([key, value]) => typeof value === 'number' && !isNaN(value))
                                        .map(([key, value]) => `${key}: ${value}cm`)
                                        .join(', ')})</small>
                                ` : ''}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
            
            <div class="pointfour-tailored-actions">
                <button class="pointfour-btn-secondary" onclick="window.pointFourResetSizeInput()">
                    Try Different Size
                </button>
            </div>
        </div>
    `;
    
    // Find the tailored recommendations section and replace it
    const tailoredSection = document.querySelector('.pointfour-tailored-recommendations');
    if (tailoredSection) {
        tailoredSection.innerHTML = recommendationsHTML;
    }
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