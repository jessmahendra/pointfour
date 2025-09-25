// ========================================
// ENHANCED SIZE CHART EXTRACTION MODULE
// ========================================

/**
 * Enhanced size chart extraction with better accuracy and structured data
 * for tailored recommendations
 */

// Enhanced size chart data model with BODY vs GARMENT measurement detection
export interface EnhancedSizeChart {
    brand: string;
    productType: 'tops' | 'bottoms' | 'dresses' | 'shoes' | 'accessories' | 'general';
    measurements: {
        [size: string]: {
            body?: {
                bust?: number;
                waist?: number;
                hips?: number;
                hip?: number;
            };
            garment?: {
                chest?: number;
                length?: number;
                inseam?: number;
                shoulder?: number;
                sleeve?: number;
                width?: number;
                rise?: number;
            };
            // Legacy support for mixed/unclassified measurements
            bust?: number;
            waist?: number;
            hips?: number;
            length?: number;
            inseam?: number;
            shoulder?: number;
            sleeve?: number;
            chest?: number;
            hip?: number;
        };
    };
    measurementType: 'body' | 'garment' | 'mixed' | 'unknown';
    sizeSystem: 'US' | 'UK' | 'EU' | 'JP' | 'custom';
    confidence: 'low' | 'medium' | 'high';
    source: string;
    sizingAdvice: string[];
    modelInfo: {
        height?: string;
        size?: string;
        measurements?: string;
    };
    extractionNotes: string[];
}

/**
 * Enhanced size chart extraction with improved accuracy
 */
export function extractEnhancedSizeChart() {
    console.log('[PointFour] Starting enhanced size chart extraction...');
    
    const sizeChart = {
        brand: extractBrandFromPage(),
        productType: detectProductType(),
        measurements: {},
        measurementType: 'unknown' as const,
        sizeSystem: 'US', // Default to US
        confidence: 'low' as const,
        source: window.location.href,
        sizingAdvice: [],
        modelInfo: {},
        extractionNotes: []
    };

    // Enhanced selectors for better coverage
    const sizeChartSelectors = [
        // Primary size chart containers
        '.size-guide',
        '.size-chart',
        '.sizing-info',
        '.fit-guide',
        '.measurement-guide',
        '.size-table',
        '.sizing-table',
        '.measurement-table',
        
        // Modal and popup selectors
        '[data-tab="sizing"]',
        '[data-tab="size-guide"]',
        '[data-tab="measurements"]',
        '.modal-size-guide',
        '.popup-size-guide',
        '[class*="modal"] [class*="size"]',
        '[class*="popup"] [class*="size"]',
        
        // Table-based selectors
        'table[class*="size"]',
        'table[id*="size"]',
        'table[class*="measurement"]',
        'table[class*="chart"]',
        '.size-table table',
        '.sizing-chart table',
        '.measurement-table table',
        
        // Link and button selectors
        'a[href*="size-guide"]',
        'a[href*="sizing"]',
        'button[class*="size-guide"]',
        'button[class*="sizing"]',
        
        // Generic table selector (fallback)
        'table'
    ];

    // Enhanced size keywords for better detection
    const sizeKeywords = [
        'xs', 'small', 'medium', 'large', 'xl', 'xxl', 'xxxl',
        'bust', 'waist', 'hip', 'chest', 'shoulder', 'length', 'inseam',
        'size', 'measurement', 'fit', 'sizing', 'chart', 'guide',
        'petite', 'regular', 'tall', 'plus', 'curve'
    ];

    // Enhanced measurement patterns
    const measurementPatterns = [
        // Standard measurements with units
        /(\d+(?:\.\d+)?)\s*(?:cm|inch|inches|in|")/gi,
        /(\d+(?:\.\d+)?)\s*(?:cm|inch|inches|in|")\s*-\s*(\d+(?:\.\d+)?)\s*(?:cm|inch|inches|in|")/gi,
        
        // Size-specific patterns
        /size\s+(\w+):\s*([\d\-\s]+)/gi,
        /(\w+):\s*(\d+(?:\.\d+)?)\s*(?:cm|inch|inches|in|")?/gi,
        
        // Range patterns
        /(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*(?:cm|inch|inches|in|")/gi,
        
        // Model info patterns
        /model\s+(?:is\s+)?wearing\s+size\s+(\w+)/gi,
        /model\s+(?:is\s+)?(\d+(?:'\s*\d+")?\s*tall)/gi,
        /model\s+(?:is\s+)?(\d+(?:'\s*\d+")?\s*and\s+\d+\s*lbs)/gi
    ];

    // Process each selector
    for (const selector of sizeChartSelectors) {
        const elements = document.querySelectorAll(selector);
        
        for (const element of elements) {
            const text = (element.innerText || element.textContent || '').toLowerCase();
            
            // Check if this element contains size-related content
            const containsSizeInfo = sizeKeywords.some(keyword => text.includes(keyword));
            
            if (containsSizeInfo) {
                console.log(`[PointFour] Found size chart candidate: ${selector}`);
                
                // If it's a table, extract structured data
                if (element.tagName === 'TABLE') {
                    const tableData = extractEnhancedTableData(element);
                    if (tableData.measurements && Object.keys(tableData.measurements).length > 0) {
                        Object.assign(sizeChart.measurements, tableData.measurements);
                        sizeChart.confidence = 'high';
                        sizeChart.sizeSystem = tableData.sizeSystem || 'US';
                        sizeChart.measurementType = tableData.measurementType || 'unknown';
                        sizeChart.extractionNotes.push(...tableData.extractionNotes);
                    }
                } else {
                    // Extract measurements from text
                    const textData = extractMeasurementsFromText(text, measurementPatterns);
                    if (textData.measurements && Object.keys(textData.measurements).length > 0) {
                        Object.assign(sizeChart.measurements, textData.measurements);
                        sizeChart.confidence = 'medium';
                    }
                }
                
                // Extract sizing advice
                const advice = extractSizingAdvice(text);
                sizeChart.sizingAdvice.push(...advice);
                
                // Extract model info
                const modelInfo = extractModelInfo(text);
                Object.assign(sizeChart.modelInfo, modelInfo);
            }
        }
    }

    // Remove duplicates from sizing advice
    sizeChart.sizingAdvice = [...new Set(sizeChart.sizingAdvice)];
    
    // Determine size system if not already set
    if (sizeChart.sizeSystem === 'US') {
        sizeChart.sizeSystem = detectSizeSystem(sizeChart.measurements);
    }

    console.log('[PointFour] Enhanced size chart extraction complete:', {
        measurements: Object.keys(sizeChart.measurements).length,
        measurementType: sizeChart.measurementType,
        confidence: sizeChart.confidence,
        sizeSystem: sizeChart.sizeSystem,
        sizingAdvice: sizeChart.sizingAdvice.length,
        extractionNotes: sizeChart.extractionNotes
    });

    return sizeChart;
}

/**
 * Enhanced table data extraction with BODY vs GARMENT measurement detection
 */
function extractEnhancedTableData(table) {
    const data = {
        measurements: {},
        measurementType: 'unknown',
        sizeSystem: 'US',
        confidence: 'low',
        extractionNotes: []
    };

    if (!table || table.tagName !== 'TABLE') return data;

    try {
        const rows = table.querySelectorAll('tr');
        if (rows.length < 2) return data;

        // Find header row (usually first row, but check for common patterns)
        let headerRowIndex = 0;
        const firstRow = rows[0];
        const firstRowCells = Array.from(firstRow.querySelectorAll('th, td'));
        
        // Check if first row looks like headers
        const firstRowText = firstRowCells.map(cell => cell.textContent.trim().toLowerCase()).join(' ');
        const hasSizeKeywords = ['size', 'bust', 'waist', 'hip', 'chest', 'shoulder'].some(keyword => 
            firstRowText.includes(keyword)
        );

        if (!hasSizeKeywords && rows.length > 1) {
            // Check second row
            const secondRow = rows[1];
            const secondRowCells = Array.from(secondRow.querySelectorAll('th, td'));
            const secondRowText = secondRowCells.map(cell => cell.textContent.trim().toLowerCase()).join(' ');
            const secondRowHasKeywords = ['size', 'bust', 'waist', 'hip', 'chest', 'shoulder'].some(keyword => 
                secondRowText.includes(keyword)
            );
            
            if (secondRowHasKeywords) {
                headerRowIndex = 1;
            }
        }

        const headerRow = rows[headerRowIndex];
        const headers = Array.from(headerRow.querySelectorAll('th, td')).map(cell => 
            cell.textContent.trim().toLowerCase()
        );

        // Enhanced size indicators
        const sizeIndicators = [
            'size', 'bust', 'waist', 'hip', 'chest', 'shoulder', 'length', 'inseam',
            'xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl', 'petite', 'regular', 'tall'
        ];

        const isSizeChart = headers.some(header => 
            sizeIndicators.some(indicator => header.includes(indicator))
        );

        if (isSizeChart) {
            console.log('[PointFour] Processing size chart table with headers:', headers);
            
            // Determine size system from headers
            data.sizeSystem = detectSizeSystemFromHeaders(headers);
            
            // Detect measurement type from headers and context
            data.measurementType = detectMeasurementType(headers, table);
            data.extractionNotes.push(`Detected measurement type: ${data.measurementType}`);
            
            // Extract measurements from data rows
            for (let i = headerRowIndex + 1; i < Math.min(rows.length, 15); i++) {
                const cells = Array.from(rows[i].querySelectorAll('td, th')).map(cell => 
                    cell.textContent.trim()
                );

                if (cells.length >= 2) {
                    const sizeOrMeasurement = cells[0].toLowerCase().trim();
                    const measurements = {};

                    // Parse each measurement column with type classification
                    for (let j = 1; j < Math.min(cells.length, headers.length); j++) {
                        const header = headers[j] || `col_${j}`;
                        const value = cells[j];
                        
                        if (value && value !== '-') {
                            // Extract numeric value
                            const numericValue = extractNumericValue(value);
                            if (numericValue !== null) {
                                // Classify measurement type
                                const measurementType = classifyMeasurementType(header, data.measurementType);
                                if (measurementType === 'body') {
                                    measurements.body = measurements.body || {};
                                    measurements.body[header] = numericValue;
                                } else if (measurementType === 'garment') {
                                    measurements.garment = measurements.garment || {};
                                    measurements.garment[header] = numericValue;
                                } else {
                                    // Legacy fallback for unclassified measurements
                                    measurements[header] = numericValue;
                                }
                            }
                        }
                    }

                    if (Object.keys(measurements).length > 0) {
                        data.measurements[sizeOrMeasurement] = measurements;
                        data.confidence = 'high';
                    }
                }
            }
        }
    } catch (error) {
        console.log('[PointFour] Error extracting enhanced table data:', error);
    }

    return data;
}

/**
 * Extract measurements from text using patterns
 */
function extractMeasurementsFromText(text, patterns) {
    const data = {
        measurements: {},
        confidence: 'low'
    };

    for (const pattern of patterns) {
        const matches = [...text.matchAll(pattern)];
        for (const match of matches) {
            if (match[1] && match[2]) {
                const key = match[1].toLowerCase().trim();
                const value = extractNumericValue(match[2]);
                if (value !== null) {
                    data.measurements[key] = value;
                    data.confidence = 'medium';
                }
            }
        }
    }

    return data;
}

/**
 * Extract sizing advice from text
 */
function extractSizingAdvice(text) {
    const advice = [];
    
    const advicePatterns = [
        /runs?\s+(small|large|true\s+to\s+size)/gi,
        /model\s+(?:is\s+)?wearing\s+size\s+(\w+)/gi,
        /model\s+(?:is\s+)?(\d+(?:'\s*\d+")?\s*tall)/gi,
        /recommend\s+sizing\s+(up|down)/gi,
        /suggest\s+sizing\s+(up|down)/gi,
        /we\s+recommend\s+sizing\s+(up|down)/gi,
        /consider\s+sizing\s+(up|down)/gi,
        /size\s+(up|down)\s+for\s+(.+)fit/gi,
        /runs?\s+(tight|loose|narrow|wide)/gi
    ];

    for (const pattern of advicePatterns) {
        const matches = text.match(pattern);
        if (matches) {
            advice.push(...matches);
        }
    }

    return advice;
}

/**
 * Extract model information
 */
function extractModelInfo(text) {
    const modelInfo = {};

    const modelPatterns = [
        /model\s+(?:is\s+)?wearing\s+size\s+(\w+)/gi,
        /model\s+(?:is\s+)?(\d+(?:'\s*\d+")?\s*tall)/gi,
        /model\s+(?:is\s+)?(\d+(?:'\s*\d+")?\s*and\s+\d+\s*lbs)/gi,
        /model\s+(?:is\s+)?(\d+(?:'\s*\d+")?\s*and\s+\d+\s*kg)/gi
    ];

    for (const pattern of modelPatterns) {
        const match = text.match(pattern);
        if (match) {
            if (pattern.source.includes('size')) {
                modelInfo.size = match[1];
            } else if (pattern.source.includes('tall')) {
                modelInfo.height = match[1];
            } else if (pattern.source.includes('lbs') || pattern.source.includes('kg')) {
                modelInfo.measurements = match[1];
            }
        }
    }

    return modelInfo;
}

/**
 * Extract numeric value from text
 */
function extractNumericValue(text) {
    // Remove common non-numeric characters
    const cleaned = text.replace(/[^\d.-]/g, '');
    const match = cleaned.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : null;
}

/**
 * Detect size system from measurements
 */
function detectSizeSystem(measurements) {
    const sizeKeys = Object.keys(measurements);
    
    // Check for common size patterns
    if (sizeKeys.some(key => ['xs', 'sm', 'md', 'lg', 'xl'].includes(key.toLowerCase()))) {
        return 'US';
    }
    
    if (sizeKeys.some(key => ['32', '34', '36', '38', '40', '42'].includes(key))) {
        return 'EU';
    }
    
    if (sizeKeys.some(key => ['6', '8', '10', '12', '14', '16'].includes(key))) {
        return 'UK';
    }
    
    return 'US'; // Default
}

/**
 * Detect size system from table headers
 */
function detectSizeSystemFromHeaders(headers) {
    const headerText = headers.join(' ').toLowerCase();
    
    if (headerText.includes('eu') || headerText.includes('european')) {
        return 'EU';
    }
    
    if (headerText.includes('uk') || headerText.includes('british')) {
        return 'UK';
    }
    
    if (headerText.includes('jp') || headerText.includes('japanese')) {
        return 'JP';
    }
    
    return 'US'; // Default
}

/**
 * Detect product type from page content
 */
function detectProductType() {
    const text = document.body.innerText.toLowerCase();
    
    if (text.includes('jeans') || text.includes('pants') || text.includes('trousers') || text.includes('shorts')) {
        return 'bottoms';
    }
    
    if (text.includes('shirt') || text.includes('blouse') || text.includes('top') || text.includes('sweater')) {
        return 'tops';
    }
    
    if (text.includes('dress') || text.includes('gown')) {
        return 'dresses';
    }
    
    if (text.includes('shoe') || text.includes('boot') || text.includes('sneaker')) {
        return 'shoes';
    }
    
    return 'general';
}

/**
 * Detect measurement type from table headers and context
 */
function detectMeasurementType(headers, table) {
    const headerText = headers.join(' ').toLowerCase();
    const tableText = table.textContent.toLowerCase();
    
    // Check for explicit measurement type indicators
    const bodyIndicators = [
        'body measurement', 'body size', 'body fit', 'body dimensions',
        'measure your body', 'body chart', 'body guide',
        'bust', 'waist', 'hip', 'hips'
    ];
    
    const garmentIndicators = [
        'garment measurement', 'garment size', 'garment fit', 'garment dimensions',
        'measure the garment', 'garment chart', 'garment guide',
        'chest', 'length', 'inseam', 'shoulder', 'sleeve', 'width', 'rise'
    ];
    
    const mixedIndicators = [
        'both', 'body and garment', 'measurements', 'size guide',
        'fit guide', 'sizing chart'
    ];
    
    // Check table context for measurement type
    const hasBodyIndicators = bodyIndicators.some(indicator => 
        headerText.includes(indicator) || tableText.includes(indicator)
    );
    
    const hasGarmentIndicators = garmentIndicators.some(indicator => 
        headerText.includes(indicator) || tableText.includes(indicator)
    );
    
    const hasMixedIndicators = mixedIndicators.some(indicator => 
        headerText.includes(indicator) || tableText.includes(indicator)
    );
    
    // Determine measurement type based on indicators
    if (hasBodyIndicators && hasGarmentIndicators) {
        return 'mixed';
    } else if (hasBodyIndicators) {
        return 'body';
    } else if (hasGarmentIndicators) {
        return 'garment';
    } else if (hasMixedIndicators) {
        return 'mixed';
    }
    
    // Fallback: analyze header content
    const bodyHeaders = ['bust', 'waist', 'hip', 'hips'];
    const garmentHeaders = ['chest', 'length', 'inseam', 'shoulder', 'sleeve', 'width', 'rise'];
    
    const bodyHeaderCount = headers.filter(header => 
        bodyHeaders.some(bodyHeader => header.includes(bodyHeader))
    ).length;
    
    const garmentHeaderCount = headers.filter(header => 
        garmentHeaders.some(garmentHeader => header.includes(garmentHeader))
    ).length;
    
    if (bodyHeaderCount > garmentHeaderCount) {
        return 'body';
    } else if (garmentHeaderCount > bodyHeaderCount) {
        return 'garment';
    } else if (bodyHeaderCount > 0 && garmentHeaderCount > 0) {
        return 'mixed';
    }
    
    return 'unknown';
}

/**
 * Classify individual measurement type based on header and context
 */
function classifyMeasurementType(header, contextType) {
    const headerLower = header.toLowerCase();
    
    // Body measurement indicators
    const bodyMeasurements = [
        'bust', 'waist', 'hip', 'hips', 'body', 'person'
    ];
    
    // Garment measurement indicators
    const garmentMeasurements = [
        'chest', 'length', 'inseam', 'shoulder', 'sleeve', 'width', 'rise',
        'garment', 'item', 'product', 'clothing'
    ];
    
    // Check for body measurements
    if (bodyMeasurements.some(measurement => headerLower.includes(measurement))) {
        return 'body';
    }
    
    // Check for garment measurements
    if (garmentMeasurements.some(measurement => headerLower.includes(measurement))) {
        return 'garment';
    }
    
    // Use context type as fallback
    if (contextType === 'body' || contextType === 'garment') {
        return contextType;
    }
    
    return 'unknown';
}

/**
 * Extract brand from page
 */
function extractBrandFromPage() {
    // Try to extract brand from common locations
    const brandSelectors = [
        'h1',
        '.brand',
        '.product-brand',
        '[data-testid="brand"]',
        '.product-title',
        '.product-name'
    ];
    
    for (const selector of brandSelectors) {
        const element = document.querySelector(selector);
        if (element) {
            const text = element.textContent.trim();
            if (text && text.length < 50) { // Reasonable brand name length
                return text;
            }
        }
    }
    
    return 'Unknown';
}
