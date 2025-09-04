// ========================================
// POINTFOUR - WIDGET MANAGEMENT MODULE
// ========================================

import { CONFIG } from './config.js';
import { getState, setState } from './state.js';
import { extractQualityInsights } from './review-analysis.js';

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
            <button class="pointfour-close" aria-label="Close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="18" y1="6" x2="6" y2="18" stroke-width="2" stroke-linecap="round"/>
                    <line x1="6" y1="6" x2="18" y2="18" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
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
    if (closeBtn) {
        closeBtn.addEventListener('click', hideWidget);
    }
    
    // Click outside to close
    document.addEventListener('click', function(e) {
        const currentContainer = getState('widgetContainer');
        if (currentContainer && !currentContainer.contains(e.target)) {
            hideWidget();
        }
    });
    
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
        hasReviews: !!data?.externalSearchResults?.reviews,
        reviewsCount: data?.externalSearchResults?.reviews?.length || 0,
        hasStructuredData: !!data?.externalSearchResults?.brandFitSummary?.sections,
        sectionsCount: data?.externalSearchResults?.brandFitSummary?.sections ? Object.keys(data.externalSearchResults.brandFitSummary.sections).length : 0,
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
    const hasStructuredAnalysis = data.externalSearchResults?.brandFitSummary?.sections && 
                                Object.keys(data.externalSearchResults?.brandFitSummary?.sections).length > 0;
    const hasRecommendation = data.recommendation && 
                             data.recommendation !== 'Analyzing fit information...' &&
                             data.recommendation.length > 20; // Reduced from 50 to 20
    
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
    
    // If this isn't complete data yet, show progressive loading
    if (!isCompleteData && !data.error) {
        renderProgressiveLoading(brandName, contentDiv);
        return;
    }
    
    // Mark as complete and render final content
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
    const sections = data.externalSearchResults?.brandFitSummary?.sections || {};
    const qualityInsight = extractQualityInsights(data);
    
    let contentHTML = `
        <div class="pointfour-results">
            <h3>${brandName}</h3>
            <div class="pointfour-meta">
                <span class="pointfour-review-count">Based on ${totalReviews} reviews</span>
                ${isMarketplace ? '<span class="pointfour-marketplace-tag">Multi-brand site</span>' : ''}
            </div>
    `;
    
    // Main recommendation
    if (data.recommendation) {
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
    
    // Fit sections
    if (Object.keys(sections).length > 0) {
        contentHTML += '<div class="pointfour-sections">';
        
        // Prioritize sections: fit > quality > fabric > washCare
        const sectionPriority = ['fit', 'quality', 'fabric', 'washCare'];
        const sortedSections = sectionPriority.filter(key => sections[key]);
        
        for (const sectionKey of sortedSections.slice(0, 3)) {  // Show max 3 sections
            const section = sections[sectionKey];
            if (section && section.recommendation) {
                const sectionTitle = getSectionTitle(sectionKey);
                const sectionIcon = getSectionIcon(sectionKey);
                
                contentHTML += `
                    <div class="pointfour-section">
                        <div class="pointfour-section-header">
                            ${sectionIcon}
                            <span>${sectionTitle}</span>
                        </div>
                        <div class="pointfour-section-content">
                            <p>${section.recommendation}</p>
                        </div>
                    </div>
                `;
            }
        }
        
        contentHTML += '</div>';
    }
    
    // Style button
    const urlExtraction = window.pointFourURLExtraction;
    if (urlExtraction && urlExtraction.itemName) {
        contentHTML += `
            <div class="pointfour-actions">
                <button class="pointfour-style-btn" data-brand="${brandName}" data-item="${urlExtraction.itemName}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M20 6L9 17l-5-5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Find Similar Styles
                </button>
            </div>
        `;
    }
    
    contentHTML += '</div>';
    contentDiv.innerHTML = contentHTML;
    
    // Add style button event listener
    const styleBtn = contentDiv.querySelector('.pointfour-style-btn');
    if (styleBtn) {
        styleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const brand = styleBtn.dataset.brand;
            const item = styleBtn.dataset.item;
            handleStyleButtonClick(brand, data);
        });
    }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

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

function handleStyleButtonClick(brandName, data) {
    const urlExtraction = window.pointFourURLExtraction;
    if (!urlExtraction) return;
    
    const params = new URLSearchParams({
        brand: brandName,
        item: urlExtraction.itemName || '',
        category: urlExtraction.category || '',
        source: 'extension'
    });
    
    // Add product image if available
    if (urlExtraction.productImage) {
        params.set('image', urlExtraction.productImage);
    }
    
    // Open the style page in a new tab
    const styleUrl = `https://www.pointfour.in/style?${params.toString()}`;
    console.log('🎨 Opening style URL:', styleUrl);
    
    window.open(styleUrl, '_blank', 'noopener,noreferrer');
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