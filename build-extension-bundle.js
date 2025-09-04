import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔨 Building bundled extension without ES6 modules...');

// Read all module files
const modulesDir = path.join(__dirname, 'browser-extension', 'modules');
const modules = [
    'config.js',
    'api-security.js', 
    'state.js',
    'site-detection.js',
    'brand-detection.js',
    'product-extraction.js',
    'review-analysis.js',
    'widget-management.js'
];

let bundledContent = `// ========================================
// POINTFOUR BROWSER EXTENSION - BUNDLED VERSION
// Version: 4.0 (Modular Architecture - Bundled for Browser Compatibility)
// ========================================

`;

// Process each module file
for (const moduleFile of modules) {
    const modulePath = path.join(modulesDir, moduleFile);
    let moduleContent = fs.readFileSync(modulePath, 'utf8');
    
    console.log(`📦 Processing module: ${moduleFile}`);
    
    // Remove all import/export statements and convert to IIFE pattern
    moduleContent = moduleContent
        // Remove import statements
        .replace(/import\s+.*?from\s+['"].*?['"];?\s*\n?/g, '')
        // Remove export statements but keep the declarations
        .replace(/export\s+/g, '')
        // Remove export default blocks completely
        .replace(/export\s+default\s+{[^}]*};\s*$/m, '')
        // Remove any remaining 'default' statements that got orphaned
        .replace(/^default\s+{[^}]*};\s*$/gm, '')
        // Remove standalone 'default' statements
        .replace(/^default\s+[^;{]*;\s*$/gm, '')
        // Clean up multiple empty lines
        .replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Add module content with header
    bundledContent += `
// ========================================
// MODULE: ${moduleFile.toUpperCase().replace('.JS', '')}
// ========================================

${moduleContent}

`;
}

// Add the main execution logic
bundledContent += `
// ========================================
// MAIN EXECUTION FLOW
// ========================================

(function() {
    'use strict';

    // Initialize API security measures
    initializeAPISecurity();

    async function initialize() {
        console.log('[PointFour] Bundled content script initializing...');
        
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
                contentDiv.innerHTML = \`
                    <div class="pointfour-loading-spinner">
                        <div class="pointfour-spinner"></div>
                        <p>Searching for \${brand} reviews...</p>
                    </div>
                \`;
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
            const apiUrl = \`http://localhost:3000/api/extension/search-reviews?\${params.toString()}\`;
            console.log('[PointFour] API Request:', apiUrl);

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(\`API request failed: \${response.status} \${response.statusText}\`);
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

    console.log('[PointFour] Bundled content script loaded successfully');

})();
`;

// Write the bundled content script
const outputPath = path.join(__dirname, 'browser-extension', 'content-script-bundled.js');
fs.writeFileSync(outputPath, bundledContent, 'utf8');

console.log('✅ Bundled content script created at:', outputPath);
console.log('📊 Bundle size:', Math.round(bundledContent.length / 1024), 'KB');