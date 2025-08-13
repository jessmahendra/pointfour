# 🎯 Brand Categorization System

## Overview

The Pointfour Fashion Assistant now includes a comprehensive brand categorization system that automatically detects and classifies fashion websites into appropriate categories. This system ensures that users only see relevant fit advice and information based on the type of fashion site they're visiting.

## 🚀 What This Solves

**Issue #1: Brand Categorization** ✅ **RESOLVED**

The system now automatically knows whether a site is:
- A **fashion site** (clothing, apparel)
- A **jewelry site** (jewelry, accessories, watches)
- A **footwear site** (shoes, boots, sneakers)
- A **handbags/bags site** (purses, luggage)
- A **lingerie/intimates site** (underwear, sleepwear)
- A **sportswear/activewear site** (athletic clothing)
- A **department store** (multi-brand retailers)
- A **fashion marketplace** (online platforms)

## 🏗️ System Architecture

### 1. Core Components

- **`BrandCategorizer`** - Main utility class for categorization
- **`BRAND_CATEGORIES`** - Comprehensive category definitions
- **`DOMAIN_BRAND_MAPPINGS`** - Pre-defined brand-to-category mappings
- **`CONTENT_CLASSIFICATION_KEYWORDS`** - Content-based detection keywords

### 2. API Endpoints

- **`/api/brands/categorize`** - POST endpoint for brand categorization
- **`/api/brands/categorize`** - GET endpoint for available categories

### 3. Browser Extension Integration

- **`background.js`** - Updated with new categorization system
- **`content-script.js`** - Enhanced with content-based classification

## 📊 Category Definitions

### Fashion & Clothing
- **Description**: General fashion and clothing brands
- **Subcategories**: Fast Fashion, Contemporary, Luxury, Designer, Sustainable, Vintage
- **Fit Advice**: ✅ Available
- **Examples**: Zara, H&M, Reformation, Everlane

### Footwear & Shoes
- **Description**: Shoes, boots, sneakers, and other footwear
- **Subcategories**: Sneakers, Boots, Formal, Casual, Athletic, Luxury
- **Fit Advice**: ✅ Available
- **Examples**: Nike, Adidas, Converse, Vans

### Jewelry & Accessories
- **Description**: Jewelry, watches, and fashion accessories
- **Subcategories**: Fine Jewelry, Costume Jewelry, Watches, Accessories, Luxury
- **Fit Advice**: ❌ Not Applicable
- **Examples**: Mejuri, Pandora, Rolex, Cartier

### Handbags & Bags
- **Description**: Handbags, purses, and luggage
- **Subcategories**: Luxury, Contemporary, Fast Fashion, Vintage, Sustainable
- **Fit Advice**: ❌ Not Applicable
- **Examples**: Coach, Kate Spade, Michael Kors

### Lingerie & Intimates
- **Description**: Underwear, lingerie, and intimate apparel
- **Subcategories**: Everyday, Luxury, Bridal, Sport, Plus-Size
- **Fit Advice**: ✅ Available
- **Examples**: Victoria's Secret, Agent Provocateur

### Sportswear & Activewear
- **Description**: Athletic clothing and workout gear
- **Subcategories**: Athletic, Yoga, Running, Gym, Outdoor, Swim
- **Fit Advice**: ✅ Available
- **Examples**: Lululemon, Athleta, Under Armour

### Department Store
- **Description**: Multi-brand department stores
- **Subcategories**: Luxury, Mid-Range, Budget, Specialty
- **Fit Advice**: ✅ Available
- **Examples**: Harrods, Selfridges, John Lewis

### Fashion Marketplace
- **Description**: Online marketplaces for fashion
- **Subcategories**: Luxury, Vintage, Designer, Fast Fashion
- **Fit Advice**: ✅ Available
- **Examples**: Farfetch, Net-a-Porter, SSENSE

## 🔍 Detection Methods

### 1. Domain-Based Detection (Highest Priority)
```typescript
// Direct domain matches
'zara.com' => { category: 'fashion-clothing', subcategory: 'fast-fashion' }
'nike.com' => { category: 'footwear', subcategory: 'athletic' }
'mejuri.com' => { category: 'jewelry-accessories', subcategory: 'fine-jewelry' }
```

### 2. Content-Based Detection (Fallback)
```typescript
// Analyzes page content for keywords
const keywords = {
  'fashion-clothing': ['clothing', 'apparel', 'fashion', 'style', 'outfit'],
  'footwear': ['shoes', 'footwear', 'boots', 'sneakers', 'heels'],
  'jewelry-accessories': ['jewelry', 'accessories', 'necklace', 'earrings', 'watch']
}
```

### 3. URL Pattern Analysis
```typescript
// Checks URL paths for category indicators
'/shoes' => footwear category
'/jewelry' => jewelry-accessories category
'/handbags' => handbags-bags category
```

## 🎯 Smart Fit Advice Logic

The system automatically determines whether fit advice is applicable:

```typescript
function shouldShowFitAdvice(category: string): boolean {
  const fitAdviceCategories = [
    'fashion-clothing',      // ✅ Clothing needs fit advice
    'footwear',             // ✅ Shoes need fit advice
    'lingerie-intimates',   // ✅ Lingerie needs fit advice
    'sportswear-activewear' // ✅ Athletic wear needs fit advice
  ];
  
  return fitAdviceCategories.includes(category);
}
```

**Categories WITH Fit Advice:**
- Fashion & Clothing
- Footwear & Shoes
- Lingerie & Intimates
- Sportswear & Activewear
- Department Stores
- Fashion Marketplaces

**Categories WITHOUT Fit Advice:**
- Jewelry & Accessories
- Handbags & Bags

## 🚀 Usage Examples

### 1. Basic Categorization
```typescript
import { BrandCategorizer } from '@/lib/brand-categorization';

// Categorize by domain
const brandInfo = BrandCategorizer.categorizeByDomain('nike.com');
// Returns: { category: 'footwear', fitAdviceApplicable: true }

// Categorize by content
const brandInfo = BrandCategorizer.categorizeByContent(pageText, pageUrl);
// Returns: { category: 'fashion-clothing', confidence: 'high' }
```

### 2. API Usage
```typescript
// POST to /api/brands/categorize
const response = await fetch('/api/brands/categorize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    domain: 'zara.com',
    content: 'page content...',
    url: 'https://zara.com/women'
  })
});

// Response includes category, subcategory, and fit advice availability
```

### 3. Extension Integration
```javascript
// In background.js
const brandData = await fetchBrandData(brandName, category);
if (!shouldShowFitAdvice(category)) {
  return {
    brandName,
    category,
    recommendation: `This is a ${category} brand. Fit advice is not applicable.`,
    noFitAdvice: true
  };
}
```

## 📈 Benefits

### 1. **User Experience**
- Users only see relevant fit advice
- No confusion about jewelry sizing
- Appropriate messaging for each category

### 2. **Performance**
- Faster brand detection
- Reduced unnecessary API calls
- Better caching strategies

### 3. **Accuracy**
- Multi-layered detection
- Confidence scoring
- Fallback mechanisms

### 4. **Maintainability**
- Centralized categorization logic
- Easy to add new brands
- Consistent category structure

## 🧪 Testing

### Test Page
Open `test-brand-categorization.html` in your browser to:
- View all available categories
- Test domain categorization
- See brand examples
- Understand the system

### API Testing
```bash
# Test categorization endpoint
curl -X POST http://localhost:3000/api/brands/categorize \
  -H "Content-Type: application/json" \
  -d '{"domain": "nike.com"}'

# Get available categories
curl http://localhost:3000/api/brands/categorize
```

## 🔧 Configuration

### Adding New Brands
```typescript
// In DOMAIN_BRAND_MAPPINGS
'newbrand.com': { 
  name: 'New Brand', 
  category: 'fashion-clothing', 
  subcategory: 'contemporary' 
}
```

### Adding New Categories
```typescript
// In BRAND_CATEGORIES
'new-category': {
  id: 'new-category',
  name: 'New Category',
  description: 'Description of new category',
  subcategories: ['sub1', 'sub2'],
  keywords: ['keyword1', 'keyword2'],
  fitAdviceApplicable: true,
  priority: 9
}
```

## 📝 Future Enhancements

### 1. **Machine Learning Integration**
- Train models on brand data
- Improve content classification accuracy
- Dynamic category learning

### 2. **International Support**
- Multi-language keyword detection
- Regional brand categorization
- Cultural fashion differences

### 3. **Real-time Updates**
- Dynamic category updates
- User feedback integration
- A/B testing for categories

## 🎉 Summary

The brand categorization system successfully addresses the first issue by:

✅ **Automatically detecting** whether a site is fashion, jewelry, footwear, etc.
✅ **Providing appropriate** fit advice based on category
✅ **Ensuring users** only see relevant information
✅ **Maintaining consistency** across all fashion-related sites
✅ **Supporting extensibility** for new brands and categories

This system forms the foundation for intelligent fashion assistance and ensures that users get the most relevant experience based on the type of fashion website they're visiting.
