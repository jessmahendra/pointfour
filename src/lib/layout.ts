/**
 * Layout engine for collage positioning
 * Handles z-order and automatic positioning of items
 */

export type CollageItem = {
  id: string;
  category: string;
  src: string;
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
  z?: number;
};

export type LayoutResult = CollageItem[];

// Z-order from lowest to highest (background to foreground)
const Z_ORDER: Record<string, number> = {
  accessory: 1,
  shoes: 2,
  skirts: 3,
  shorts: 3,
  trousers: 4,
  jeans: 4,
  top: 5,
  knit: 6,
  blazer: 7,
  jacket: 7,
  coat: 8,
  bag: 9,
  jewellery: 9,
  product: 10, // Hero item gets highest z-index
};

export function zIndexFor(category: string): number {
  // Normalize category to lowercase and find best match
  const normalizedCategory = category.toLowerCase();
  
  for (const [key, value] of Object.entries(Z_ORDER)) {
    if (normalizedCategory.includes(key)) {
      return value;
    }
  }
  
  // Default for unknown categories
  return 5;
}

export function heroPlusThree(
  items: CollageItem[],
  width: number,
  height: number
): LayoutResult {
  const result: CollageItem[] = [];
  
  // Find the product item (hero)
  const productItem = items.find(item => item.category === 'product');
  const wardrobeItems = items.filter(item => item.category !== 'product');
  
  if (productItem) {
    // Position hero product (left/upper area, larger scale)
    const heroItem: CollageItem = {
      ...productItem,
      x: width * 0.2,
      y: height * 0.15,
      scale: 0.9,
      rotation: 0,
      z: zIndexFor('product')
    };
    result.push(heroItem);
    
    // Position wardrobe items in three slots
    const slots = [
      { x: width * 0.7, y: height * 0.1 },   // Right-top
      { x: width * 0.7, y: height * 0.6 },   // Right-bottom
      { x: width * 0.1, y: height * 0.7 }    // Left-bottom
    ];
    
    wardrobeItems.forEach((item, index) => {
      if (index < 3) {
        const slot = slots[index];
        const jitter = (Math.random() - 0.5) * 6; // ±3 degrees
        
        const positionedItem: CollageItem = {
          ...item,
          x: slot.x,
          y: slot.y,
          scale: 0.6 + (Math.random() * 0.2), // 0.6-0.8 scale
          rotation: jitter,
          z: zIndexFor(item.category)
        };
        result.push(positionedItem);
      }
    });
  } else {
    // No product item, distribute all items evenly
    items.forEach((item, index) => {
      const angle = (index / items.length) * 2 * Math.PI;
      const radius = Math.min(width, height) * 0.3;
      const centerX = width / 2;
      const centerY = height / 2;
      
      const positionedItem: CollageItem = {
        ...item,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        scale: 0.7,
        rotation: (Math.random() - 0.5) * 10,
        z: zIndexFor(item.category)
      };
      result.push(positionedItem);
    });
  }
  
  return result;
}

// Utility function to ensure items are within canvas bounds
export function constrainToBounds(
  items: CollageItem[],
  width: number,
  height: number
): LayoutResult {
  return items.map(item => {
    const constrained = { ...item };
    
    // Ensure x and y are within bounds (with some padding)
    if (constrained.x !== undefined) {
      constrained.x = Math.max(50, Math.min(width - 50, constrained.x));
    }
    if (constrained.y !== undefined) {
      constrained.y = Math.max(50, Math.min(height - 50, constrained.y));
    }
    
    // Ensure scale is reasonable
    if (constrained.scale !== undefined) {
      constrained.scale = Math.max(0.1, Math.min(2.0, constrained.scale));
    }
    
    return constrained;
  });
}
