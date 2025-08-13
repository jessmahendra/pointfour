// Brand Categorization Utility
// Centralized system for classifying fashion brands and websites

export interface BrandCategory {
  id: string;
  name: string;
  description: string;
  subcategories: string[];
  keywords: string[];
  fitAdviceApplicable: boolean;
  priority: number;
}

export interface BrandInfo {
  name: string;
  domain: string;
  category: string;
  subcategory?: string;
  confidence: 'high' | 'medium' | 'low';
  source: 'domain' | 'content' | 'database' | 'inferred';
}

// Main brand categories with comprehensive definitions
export const BRAND_CATEGORIES: Record<string, BrandCategory> = {
  'fashion-clothing': {
    id: 'fashion-clothing',
    name: 'Fashion & Clothing',
    description: 'General fashion and clothing brands',
    subcategories: ['fast-fashion', 'contemporary', 'luxury', 'designer', 'sustainable', 'vintage'],
    keywords: ['clothing', 'apparel', 'fashion', 'style', 'outfit', 'dress', 'shirt', 'pants', 'jeans'],
    fitAdviceApplicable: true,
    priority: 1
  },
  'footwear': {
    id: 'footwear',
    name: 'Footwear & Shoes',
    description: 'Shoes, boots, sneakers, and other footwear',
    subcategories: ['sneakers', 'boots', 'formal', 'casual', 'athletic', 'luxury'],
    keywords: ['shoes', 'footwear', 'boots', 'sneakers', 'heels', 'flats', 'sandals', 'loafers'],
    fitAdviceApplicable: true,
    priority: 2
  },
  'jewelry-accessories': {
    id: 'jewelry-accessories',
    name: 'Jewelry & Accessories',
    description: 'Jewelry, watches, and fashion accessories',
    subcategories: ['fine-jewelry', 'costume-jewelry', 'watches', 'accessories', 'luxury'],
    keywords: ['jewelry', 'accessories', 'necklace', 'earrings', 'bracelet', 'ring', 'watch', 'handbag'],
    fitAdviceApplicable: false,
    priority: 3
  },
  'handbags-bags': {
    id: 'handbags-bags',
    name: 'Handbags & Bags',
    description: 'Handbags, purses, and luggage',
    subcategories: ['luxury', 'contemporary', 'fast-fashion', 'vintage', 'sustainable'],
    keywords: ['handbag', 'purse', 'bag', 'tote', 'clutch', 'crossbody', 'backpack'],
    fitAdviceApplicable: false,
    priority: 4
  },
  'lingerie-intimates': {
    id: 'lingerie-intimates',
    name: 'Lingerie & Intimates',
    description: 'Underwear, lingerie, and intimate apparel',
    subcategories: ['everyday', 'luxury', 'bridal', 'sport', 'plus-size'],
    keywords: ['lingerie', 'intimates', 'underwear', 'bra', 'panties', 'sleepwear'],
    fitAdviceApplicable: true,
    priority: 5
  },
  'sportswear-activewear': {
    id: 'sportswear-activewear',
    name: 'Sportswear & Activewear',
    description: 'Athletic clothing and workout gear',
    subcategories: ['athletic', 'yoga', 'running', 'gym', 'outdoor', 'swim'],
    keywords: ['sportswear', 'activewear', 'athletic', 'workout', 'gym', 'fitness', 'yoga'],
    fitAdviceApplicable: true,
    priority: 6
  },
  'department-store': {
    id: 'department-store',
    name: 'Department Store',
    description: 'Multi-brand department stores',
    subcategories: ['luxury', 'mid-range', 'budget', 'specialty'],
    keywords: ['department store', 'multi-brand', 'retailer', 'shopping'],
    fitAdviceApplicable: true,
    priority: 7
  },
  'marketplace': {
    id: 'marketplace',
    name: 'Fashion Marketplace',
    description: 'Online marketplaces for fashion',
    subcategories: ['luxury', 'vintage', 'designer', 'fast-fashion'],
    keywords: ['marketplace', 'multi-seller', 'platform', 'resale'],
    fitAdviceApplicable: true,
    priority: 8
  }
};

// Subcategory definitions for more granular classification
export const SUBCATEGORIES: Record<string, string[]> = {
  'fast-fashion': ['trendy', 'affordable', 'budget', 'mass-produced', 'quick-turnover'],
  'contemporary': ['modern', 'mid-range', 'quality', 'timeless', 'sophisticated'],
  'luxury': ['premium', 'exclusive', 'high-end', 'designer', 'expensive'],
  'sustainable': ['eco-friendly', 'ethical', 'organic', 'fair-trade', 'recycled'],
  'vintage': ['second-hand', 'pre-owned', 'retro', 'classic', 'thrift'],
  'sneakers': ['casual', 'athletic', 'streetwear', 'comfortable', 'versatile'],
  'boots': ['winter', 'fall', 'casual', 'formal', 'work'],
  'fine-jewelry': ['precious metals', 'gemstones', 'investment', 'heirloom', 'luxury'],
  'costume-jewelry': ['fashion', 'trendy', 'affordable', 'statement', 'fun']
};

// Domain-based brand mappings for quick identification
export const DOMAIN_BRAND_MAPPINGS: Record<string, BrandInfo> = {
  // Fast Fashion
  'zara.com': { name: 'Zara', domain: 'zara.com', category: 'fashion-clothing', subcategory: 'fast-fashion', confidence: 'high', source: 'domain' },
  'hm.com': { name: 'H&M', domain: 'hm.com', category: 'fashion-clothing', subcategory: 'fast-fashion', confidence: 'high', source: 'domain' },
  'asos.com': { name: 'ASOS', domain: 'asos.com', category: 'marketplace', subcategory: 'fast-fashion', confidence: 'high', source: 'domain' },
  'uniqlo.com': { name: 'Uniqlo', domain: 'uniqlo.com', category: 'fashion-clothing', subcategory: 'contemporary', confidence: 'high', source: 'domain' },
  'mango.com': { name: 'Mango', domain: 'mango.com', category: 'fashion-clothing', subcategory: 'fast-fashion', confidence: 'high', source: 'domain' },
  
  // Contemporary & Premium
  'reformation.com': { name: 'Reformation', domain: 'reformation.com', category: 'fashion-clothing', subcategory: 'contemporary', confidence: 'high', source: 'domain' },
  'everlane.com': { name: 'Everlane', domain: 'everlane.com', category: 'fashion-clothing', subcategory: 'contemporary', confidence: 'high', source: 'domain' },
  'cos.com': { name: 'COS', domain: 'cos.com', category: 'fashion-clothing', subcategory: 'contemporary', confidence: 'high', source: 'domain' },
  
  // Luxury & Designer
  'farfetch.com': { name: 'Farfetch', domain: 'farfetch.com', category: 'marketplace', subcategory: 'luxury', confidence: 'high', source: 'domain' },
  'net-a-porter.com': { name: 'Net-a-Porter', domain: 'net-a-porter.com', category: 'marketplace', subcategory: 'luxury', confidence: 'high', source: 'domain' },
  'ssense.com': { name: 'SSENSE', domain: 'ssense.com', category: 'marketplace', subcategory: 'luxury', confidence: 'high', source: 'domain' },
  
  // Footwear
  'nike.com': { name: 'Nike', domain: 'nike.com', category: 'footwear', subcategory: 'athletic', confidence: 'high', source: 'domain' },
  'adidas.com': { name: 'Adidas', domain: 'adidas.com', category: 'footwear', subcategory: 'athletic', confidence: 'high', source: 'domain' },
  'converse.com': { name: 'Converse', domain: 'converse.com', category: 'footwear', subcategory: 'casual', confidence: 'high', source: 'domain' },
  'vans.com': { name: 'Vans', domain: 'vans.com', category: 'footwear', subcategory: 'casual', confidence: 'high', source: 'domain' },
  
  // Jewelry & Accessories
  'mejuri.com': { name: 'Mejuri', domain: 'mejuri.com', category: 'jewelry-accessories', subcategory: 'fine-jewelry', confidence: 'high', source: 'domain' },
  'gorjana.com': { name: 'Gorjana', domain: 'gorjana.com', category: 'jewelry-accessories', subcategory: 'fine-jewelry', confidence: 'high', source: 'domain' },
  'pandora.net': { name: 'Pandora', domain: 'pandora.net', category: 'jewelry-accessories', subcategory: 'costume-jewelry', confidence: 'high', source: 'domain' },
  
  // Handbags & Bags
  'coach.com': { name: 'Coach', domain: 'coach.com', category: 'handbags-bags', subcategory: 'luxury', confidence: 'high', source: 'domain' },
  'katespade.com': { name: 'Kate Spade', domain: 'katespade.com', category: 'handbags-bags', subcategory: 'luxury', confidence: 'high', source: 'domain' },
  'michaelkors.com': { name: 'Michael Kors', domain: 'michaelkors.com', category: 'handbags-bags', subcategory: 'luxury', confidence: 'high', source: 'domain' },
  
  // Watches
  'rolex.com': { name: 'Rolex', domain: 'rolex.com', category: 'jewelry-accessories', subcategory: 'watches', confidence: 'high', source: 'domain' },
  'omega.com': { name: 'Omega', domain: 'omega.com', category: 'jewelry-accessories', subcategory: 'watches', confidence: 'high', source: 'domain' },
  'cartier.com': { name: 'Cartier', domain: 'cartier.com', category: 'jewelry-accessories', subcategory: 'watches', confidence: 'high', source: 'domain' }
};

// Content-based classification keywords
export const CONTENT_CLASSIFICATION_KEYWORDS: Record<string, string[]> = {
  'fashion-clothing': [
    'clothing', 'apparel', 'fashion', 'style', 'outfit', 'dress', 'shirt', 'pants', 'jeans',
    'blouse', 'skirt', 'jacket', 'coat', 'sweater', 'cardigan', 't-shirt', 'top'
  ],
  'footwear': [
    'shoes', 'footwear', 'boots', 'sneakers', 'heels', 'flats', 'sandals', 'loafers',
    'pumps', 'oxfords', 'mules', 'espadrilles', 'ankle boots', 'knee-high boots'
  ],
  'jewelry-accessories': [
    'jewelry', 'accessories', 'necklace', 'earrings', 'bracelet', 'ring', 'watch',
    'pendant', 'charm', 'cuff', 'anklet', 'brooch', 'tiara'
  ],
  'handbags-bags': [
    'handbag', 'purse', 'bag', 'tote', 'clutch', 'crossbody', 'backpack', 'satchel',
    'hobo', 'bucket bag', 'duffle', 'weekender', 'travel bag'
  ],
  'lingerie-intimates': [
    'lingerie', 'intimates', 'underwear', 'bra', 'panties', 'sleepwear', 'nightgown',
    'chemise', 'teddy', 'bustier', 'corset', 'shapewear'
  ],
  'sportswear-activewear': [
    'sportswear', 'activewear', 'athletic', 'workout', 'gym', 'fitness', 'yoga',
    'running', 'training', 'performance', 'moisture-wicking', 'compression'
  ]
};

// Main categorization functions
export class BrandCategorizer {
  
  /**
   * Categorize a brand based on domain
   */
  static categorizeByDomain(domain: string): BrandInfo | null {
    const normalizedDomain = domain.toLowerCase().replace('www.', '');
    
    // Check exact domain matches first
    if (DOMAIN_BRAND_MAPPINGS[normalizedDomain]) {
      return DOMAIN_BRAND_MAPPINGS[normalizedDomain];
    }
    
    // Check partial domain matches
    for (const [brandDomain, brandInfo] of Object.entries(DOMAIN_BRAND_MAPPINGS)) {
      if (normalizedDomain.includes(brandDomain) || brandDomain.includes(normalizedDomain)) {
        return {
          ...brandInfo,
          confidence: 'medium' as const,
          source: 'domain' as const
        };
      }
    }
    
    return null;
  }
  
  /**
   * Categorize a brand based on page content
   */
  static categorizeByContent(text: string, url: string): BrandInfo | null {
    const lowerText = text.toLowerCase();
    const lowerUrl = url.toLowerCase();
    
    // Score each category based on keyword matches
    const categoryScores: Record<string, number> = {};
    
    for (const [category, keywords] of Object.entries(CONTENT_CLASSIFICATION_KEYWORDS)) {
      let score = 0;
      
      // Check for keyword matches in text
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          score += 2; // Higher weight for text content
        }
      }
      
      // Check for keyword matches in URL
      for (const keyword of keywords) {
        if (lowerUrl.includes(keyword)) {
          score += 1; // Lower weight for URL matches
        }
      }
      
      // Check for category-specific terms in URL paths
      if (lowerUrl.includes('/shoes') || lowerUrl.includes('/footwear')) {
        if (category === 'footwear') score += 3;
      }
      if (lowerUrl.includes('/jewelry') || lowerUrl.includes('/accessories')) {
        if (category === 'jewelry-accessories') score += 3;
      }
      if (lowerUrl.includes('/handbags') || lowerUrl.includes('/bags')) {
        if (category === 'handbags-bags') score += 3;
      }
      if (lowerUrl.includes('/lingerie') || lowerUrl.includes('/intimates')) {
        if (category === 'lingerie-intimates') score += 3;
      }
      
      if (score > 0) {
        categoryScores[category] = score;
      }
    }
    
    // Find the category with the highest score
    const bestCategory = Object.entries(categoryScores)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (bestCategory && bestCategory[1] >= 2) {
      return {
        name: 'Unknown Brand',
        domain: new URL(url).hostname,
        category: bestCategory[0],
        confidence: bestCategory[1] >= 4 ? 'high' : bestCategory[1] >= 2 ? 'medium' : 'low',
        source: 'content'
      };
    }
    
    return null;
  }
  
  /**
   * Get comprehensive brand information combining multiple sources
   */
  static categorizeBrand(domain: string, content?: string, url?: string): BrandInfo | null {
    // Try domain-based categorization first (highest confidence)
    const domainResult = this.categorizeByDomain(domain);
    if (domainResult) {
      return domainResult;
    }
    
    // Fall back to content-based categorization if content is provided
    if (content && url) {
      const contentResult = this.categorizeByContent(content, url);
      if (contentResult) {
        return contentResult;
      }
    }
    
    return null;
  }
  
  /**
   * Check if a brand category should show fit advice
   */
  static shouldShowFitAdvice(category: string): boolean {
    const brandCategory = BRAND_CATEGORIES[category];
    return brandCategory ? brandCategory.fitAdviceApplicable : false;
  }
  
  /**
   * Get all categories that support fit advice
   */
  static getFitAdviceCategories(): string[] {
    return Object.values(BRAND_CATEGORIES)
      .filter(category => category.fitAdviceApplicable)
      .map(category => category.id);
  }
  
  /**
   * Get category information by ID
   */
  static getCategoryInfo(categoryId: string): BrandCategory | null {
    return BRAND_CATEGORIES[categoryId] || null;
  }
  
  /**
   * Get all available categories
   */
  static getAllCategories(): BrandCategory[] {
    return Object.values(BRAND_CATEGORIES)
      .sort((a, b) => a.priority - b.priority);
  }
  
  /**
   * Get subcategories for a specific category
   */
  static getSubcategories(categoryId: string): string[] {
    const category = BRAND_CATEGORIES[categoryId];
    return category ? category.subcategories : [];
  }
  
  /**
   * Validate if a category exists
   */
  static isValidCategory(categoryId: string): boolean {
    return categoryId in BRAND_CATEGORIES;
  }
}

// Export default instance for easy use
export default BrandCategorizer;
