// ========================================
// POINTFOUR BROWSER EXTENSION - MODULAR CONTENT SCRIPT
// Version: 4.0 (Refactored Modular Architecture)
// ========================================

import { initializeAPISecurity } from './modules/api-security.js';
import { CONFIG } from './modules/config.js';
import { getState, setState, updateState } from './modules/state.js';
import { detectFashionSite, detectPageType, shouldRunOnThisPage } from './modules/site-detection.js';
import { 
    extractBrandFromContent, 
    extractBrandFromDomain, 
    isMarketplaceSite, 
    cleanBrandName 
} from './modules/brand-detection.js';
import {
    extractAllProductData,
    extractProductFromURL,
    extractProductImageFromPage,
    extractItemNameFromPage
} from './modules/product-extraction.js';
import {
    extractQualityInsights,
    classifyReviewRelevance,
    extractRelevantQuotes
} from './modules/review-analysis.js';
import {
    createWidget,
    showWidget,
    hideWidget,
    updateWidgetContent
} from './modules/widget-management.js';

(function() {
    'use strict';

    // ========================================
    // INITIALIZATION
    // ========================================
    
    // Initialize API security measures
    initializeAPISecurity();

    // ========================================
    // MAIN EXECUTION FLOW
    // ========================================

    async function initialize() {
        console.log('[PointFour] Modular content script initializing...');
        
        // Check if we should run on this page
        if (!shouldRunOnThisPage()) {
            console.log('[PointFour] Page not suitable for analysis, skipping');
            return;
        }

        // Detect if this is a fashion site
        const fashionDetection = detectFashionSite();
        console.log('[PointFour] Fashion site detection:', fashionDetection);

        if (!fashionDetection.isFashionSite) {
            console.log('[PointFour] Not a fashion site, skipping analysis');
            return;
        }

        // Update state with detection results
        updateState({
            detectionScore: fashionDetection.score,
            isHighConfidence: fashionDetection.isHighConfidence
        });

        // Detect page type (product vs listing)
        const pageType = detectPageType();
        console.log('[PointFour] Page type detection:', pageType);

        // Extract comprehensive product data
        const productData = extractAllProductData();
        console.log('[PointFour] Product data extracted:', productData);
        
        // Store product data globally for other functions
        window.pointFourURLExtraction = productData;
        window.pointFourPageData = { pageType, fashionDetection };

        // Extract or detect brand
        let brandName = productData.brand || await detectBrandFromPage();
        
        if (!brandName) {
            console.log('[PointFour] No brand detected, cannot proceed');
            return;
        }

        // Clean the brand name
        brandName = cleanBrandName(brandName);
        console.log('[PointFour] Final brand name:', brandName);

        // Store current brand in state
        setState('currentBrand', brandName);

        // Check if this is a marketplace site
        const isMarketplace = isMarketplaceSite(brandName);
        console.log('[PointFour] Marketplace detection:', isMarketplace);

        // Create and show widget
        createWidget();
        showWidget();

        // Start brand analysis
        await fetchBrandAnalysis(brandName, productData);
    }

    async function detectBrandFromPage() {
        console.log('[PointFour] Detecting brand from page...');
        
        // Try content-based brand extraction first
        let brand = extractBrandFromContent();
        
        if (brand) {
            console.log('[PointFour] Brand found via content extraction:', brand);
            return brand;
        }

        // Fallback to domain-based extraction
        brand = extractBrandFromDomain();
        
        if (brand) {
            console.log('[PointFour] Brand found via domain extraction:', brand);
            return brand;
        }

        console.log('[PointFour] No brand could be detected from page');
        return null;
    }

    async function fetchBrandAnalysis(brand, extractedData = null) {
        if (!brand || getState('isProcessing')) return;

        // Additional brand validation - don't analyze non-fashion brands
        const nonFashionBrands = [
            'google', 'microsoft', 'apple', 'amazon', 'facebook', 'meta', 'twitter', 'x',
            'youtube', 'linkedin', 'instagram', 'tiktok', 'snapchat', 'pinterest',
            'netflix', 'spotify', 'uber', 'lyft', 'airbnb', 'tesla', 'boeing',
            'ford', 'gm', 'toyota', 'honda', 'bmw', 'mercedes', 'audi',
            'walmart', 'target', 'costco', 'home depot', 'lowes', 'cvs', 'walgreens',
            'mcdonalds', 'burger king', 'kfc', 'subway', 'starbucks', 'dunkin',
            'visa', 'mastercard', 'paypal', 'stripe', 'square',
            'reddit', 'github', 'stackoverflow', 'wikipedia', 'twitch'
        ];

        if (nonFashionBrands.includes(brand.toLowerCase().trim())) {
            console.log('[PointFour] Skipping: Non-fashion brand detected:', brand);
            hideWidget();
            return;
        }

        console.log('[PointFour] Fetching analysis for brand:', brand);
        setState('isProcessing', true);

        // Show loading state in widget
        const widgetContainer = getState('widgetContainer');
        if (widgetContainer) {
            widgetContainer.classList.add('pointfour-loading');
            const contentDiv = widgetContainer.querySelector('.pointfour-content');
            if (contentDiv) {
                contentDiv.innerHTML = `
                    <div class="pointfour-loading-spinner">
                        <div class="pointfour-spinner"></div>
                        <p>Searching for ${brand} reviews...</p>
                    </div>
                `;
            }
        }

        try {
            // Build API parameters
            const params = new URLSearchParams({
                brand: brand,
                searchType: 'all',
                enableExternalSearch: 'true'
            });

            // Add extracted data if available
            if (extractedData) {
                if (extractedData.itemName) {
                    params.set('item', extractedData.itemName);
                }
                if (extractedData.category) {
                    params.set('category', extractedData.category);
                }
                if (extractedData.productImage) {
                    params.set('productImage', extractedData.productImage);
                }
            }

            // Add page context
            params.set('url', window.location.href);
            params.set('pageTitle', document.title);

            // Make API call
            const apiUrl = `https://www.pointfour.in/api/extension/search-reviews?${params.toString()}`;
            console.log('[PointFour] API Request:', apiUrl);

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('[PointFour] API Response:', data);

            // Update widget with results
            updateWidgetContent(data);

        } catch (error) {
            console.error('[PointFour] API request failed:', error);
            updateWidgetContent({
                error: 'Unable to load fit analysis. Please try refreshing the page.',
                brandName: brand
            });
        } finally {
            setState('isProcessing', false);
        }
    }

    // ========================================
    // URL CHANGE DETECTION
    // ========================================

    let currentUrl = window.location.href;
    let urlCheckInterval;

    function detectURLChanges() {
        const newUrl = window.location.href;
        if (newUrl !== currentUrl) {
            console.log('[PointFour] URL changed:', currentUrl, '->', newUrl);
            currentUrl = newUrl;
            
            // Reset state and re-initialize
            const currentContainer = getState('widgetContainer');
            if (currentContainer) {
                currentContainer.remove();
            }
            
            // Reset state
            updateState({
                widgetInjected: false,
                widgetContainer: null,
                currentBrand: null,
                isProcessing: false,
                detectionScore: 0
            });

            // Clear any existing timeouts
            const initTimeout = getState('initTimeout');
            if (initTimeout) {
                clearTimeout(initTimeout);
            }

            // Re-initialize after a short delay
            const newTimeout = setTimeout(initialize, CONFIG.INIT_DELAY);
            setState('initTimeout', newTimeout);
        }
    }

    // ========================================
    // STARTUP LOGIC
    // ========================================

    // Wait for page to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initialize, CONFIG.INIT_DELAY);
        });
    } else {
        setTimeout(initialize, CONFIG.INIT_DELAY);
    }

    // Set up URL change detection
    urlCheckInterval = setInterval(detectURLChanges, 1000);

    // Also use MutationObserver for SPA navigation
    const urlObserver = new MutationObserver(() => {
        detectURLChanges();
    });

    if (document.body) {
        urlObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (urlCheckInterval) {
            clearInterval(urlCheckInterval);
        }
        if (urlObserver) {
            urlObserver.disconnect();
        }
        
        const initTimeout = getState('initTimeout');
        if (initTimeout) {
            clearTimeout(initTimeout);
        }
    });

    console.log('[PointFour] Modular content script loaded successfully');

})();