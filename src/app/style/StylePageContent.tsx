"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface UserItem {
  id: string;
  text: string;
  category: string;
  color?: string;
}

interface ProductInfo {
  brand: string;
  itemName: string;
  imageUrl: string;
  pageUrl: string;
}

interface StylePageContentProps {
  searchParams: {
    brand?: string;
    itemName?: string;
    imageUrl?: string;
    pageUrl?: string;
  };
}

export default function StylePageContent({ searchParams }: StylePageContentProps) {
  // Initialize productInfo directly from searchParams if available
  const initialProductInfo = searchParams.brand ? {
    brand: searchParams.brand,
    itemName: searchParams.itemName || "",
    imageUrl: searchParams.imageUrl || "",
    pageUrl: searchParams.pageUrl || ""
  } : null;
  
  const [productInfo, setProductInfo] = useState<ProductInfo | null>(initialProductInfo);
  const [userItems, setUserItems] = useState<UserItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("tops");
  const [collageDataUrl, setCollageDataUrl] = useState<string | null>(null);
  const [currentOutfitIndex, setCurrentOutfitIndex] = useState(0);
  
  // Clothing categories
  const categories = [
    { id: "tops", name: "Tops", emoji: "👔" },
    { id: "bottoms", name: "Bottoms", emoji: "👖" },
    { id: "shoes", name: "Shoes", emoji: "👟" },
    { id: "accessories", name: "Accessories", emoji: "👜" },
    { id: "outerwear", name: "Outerwear", emoji: "🧥" }
  ];

  useEffect(() => {
    // Update productInfo if searchParams change (for client-side navigation)
    const brand = searchParams.brand || "";
    const itemName = searchParams.itemName || "";
    const imageUrl = searchParams.imageUrl || "";
    const pageUrl = searchParams.pageUrl || "";

    if (brand && (!productInfo || productInfo.brand !== brand)) {
      setProductInfo({ brand, itemName, imageUrl, pageUrl });
    }
  }, [searchParams, productInfo]);

  const addUserItem = () => {
    if (inputValue.trim()) {
      const newItem: UserItem = {
        id: Date.now().toString(),
        text: inputValue.trim(),
        category: selectedCategory,
        color: extractColorFromText(inputValue)
      };
      setUserItems([...userItems, newItem]);
      setInputValue("");
    }
  };
  
  // Helper function to extract color information from text
  const extractColorFromText = (text: string): string | undefined => {
    const colors = ['black', 'white', 'blue', 'red', 'green', 'yellow', 'pink', 'purple', 'orange', 'brown', 'gray', 'grey', 'beige', 'navy', 'cream'];
    const lowerText = text.toLowerCase();
    return colors.find(color => lowerText.includes(color));
  };
  
  // Group items by category
  const groupedItems = categories.reduce((acc, category) => {
    acc[category.id] = userItems.filter(item => item.category === category.id);
    return acc;
  }, {} as Record<string, UserItem[]>);
  
  // Generate outfit combinations
  const generateOutfitCombinations = () => {
    const combinations = [];
    const tops = groupedItems.tops;
    const bottoms = groupedItems.bottoms;
    const shoes = groupedItems.shoes;
    
    if (tops.length === 0 && bottoms.length === 0) return [];
    
    // Create combinations with the new product
    for (let t = 0; t < Math.max(1, tops.length); t++) {
      for (let b = 0; b < Math.max(1, bottoms.length); b++) {
        const outfit = {
          id: combinations.length,
          pieces: [
            productInfo,
            tops[t],
            bottoms[b],
            ...(shoes.length > 0 ? [shoes[0]] : []),
            ...(groupedItems.accessories.length > 0 ? [groupedItems.accessories[0]] : [])
          ].filter(Boolean)
        };
        combinations.push(outfit);
      }
    }
    
    return combinations.slice(0, 6); // Limit to 6 combinations
  };

  const removeUserItem = (id: string) => {
    setUserItems(userItems.filter(item => item.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addUserItem();
    }
  };

  const generateOutfitVisualization = async () => {
    if (!productInfo || userItems.length === 0) return;

    try {
      // Create canvas with higher resolution for better quality
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas size (larger for better detail)
      canvas.width = 1000;
      canvas.height = 800;

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#F8F7F4");
      gradient.addColorStop(1, "#F0EFE8");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add decorative header with better typography
      ctx.fillStyle = "#2D2D2D";
      ctx.font = "bold 32px Inter, Arial";
      ctx.textAlign = "center";
      ctx.fillText("✨ Your Style Combination", canvas.width / 2, 50);

      // Add subtitle
      ctx.font = "18px Inter, Arial";
      ctx.fillStyle = "#666";
      ctx.fillText(`Featuring ${productInfo.brand} - ${productInfo.itemName}`, canvas.width / 2, 85);

      // Draw product image placeholder or actual image
      if (productInfo.imageUrl) {
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            // Draw product image on the left
            const imgSize = 200;
            const imgX = 50;
            const imgY = 120;
            
            ctx.drawImage(img, imgX, imgY, imgSize, imgSize);
            
            // Continue with drawing user items
            drawUserItems();
          };
          img.onerror = () => {
            // If image fails to load, draw placeholder
            drawProductPlaceholder();
            drawUserItems();
          };
          img.src = productInfo.imageUrl;
        } catch {
          drawProductPlaceholder();
          drawUserItems();
        }
      } else {
        drawProductPlaceholder();
        drawUserItems();
      }

      function drawProductPlaceholder() {
        if (!ctx) return;
        
        // Draw product placeholder
        const imgSize = 200;
        const imgX = 50;
        const imgY = 120;
        
        ctx.fillStyle = "#E5E5E5";
        ctx.fillRect(imgX, imgY, imgSize, imgSize);
        
        ctx.fillStyle = "#666";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Product Image", imgX + imgSize / 2, imgY + imgSize / 2);
      }

      function drawUserItems() {
        if (!ctx) return;
        
        // Draw outfit layout in a more sophisticated manner
        let currentY = 130;
        const leftColumn = 80;
        const rightColumn = 520;
        const centerX = canvas.width / 2;
        
        // Draw the featured product prominently in the center
        ctx.fillStyle = "#2D2D2D";
        ctx.font = "bold 20px Inter, Arial";
        ctx.textAlign = "center";
        ctx.fillText("✨ NEW PIECE", centerX, currentY);
        
        // Draw product card
        const productCardY = currentY + 20;
        const cardWidth = 200;
        const cardHeight = 280;
        
        // Product card background with subtle shadow
        ctx.fillStyle = "rgba(0,0,0,0.1)";
        ctx.fillRect(centerX - cardWidth/2 + 3, productCardY + 3, cardWidth, cardHeight);
        
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(centerX - cardWidth/2, productCardY, cardWidth, cardHeight);
        
        ctx.strokeStyle = "#E5E5E5";
        ctx.lineWidth = 2;
        ctx.strokeRect(centerX - cardWidth/2, productCardY, cardWidth, cardHeight);
        
        // Draw categories around the main product
        const categoryPositions = [\n          { category: 'tops', x: leftColumn, y: currentY + 50, label: 'TOPS' },\n          { category: 'bottoms', x: leftColumn, y: currentY + 200, label: 'BOTTOMS' },\n          { category: 'shoes', x: rightColumn, y: currentY + 200, label: 'SHOES' },\n          { category: 'accessories', x: rightColumn, y: currentY + 50, label: 'ACCESSORIES' },\n          { category: 'outerwear', x: centerX - 100, y: currentY + 350, label: 'OUTERWEAR' }\n        ];\n        \n        categoryPositions.forEach(pos => {\n          const categoryItems = groupedItems[pos.category] || [];\n          if (categoryItems.length === 0) return;\n          \n          // Category header\n          ctx.fillStyle = "#9F513A";\n          ctx.font = "bold 14px Inter, Arial";\n          ctx.textAlign = "center";\n          ctx.fillText(pos.label, pos.x + 75, pos.y);\n          \n          // Draw items in this category\n          categoryItems.slice(0, 2).forEach((item, index) => {\n            const itemY = pos.y + 15 + (index * 50);\n            const itemWidth = 150;\n            const itemHeight = 40;\n            \n            // Item background with category color\n            const categoryColors = {\n              tops: '#F4E8D7',\n              bottoms: '#E8F0E8',\n              shoes: '#E8E8F0',\n              accessories: '#F0E8F0',\n              outerwear: '#E8F0F0'\n            };\n            \n            ctx.fillStyle = categoryColors[pos.category as keyof typeof categoryColors] || '#F0F0F0';\n            ctx.fillRect(pos.x, itemY, itemWidth, itemHeight);\n            \n            ctx.strokeStyle = "#D0D0D0";\n            ctx.lineWidth = 1;\n            ctx.strokeRect(pos.x, itemY, itemWidth, itemHeight);\n            \n            // Item text\n            ctx.fillStyle = "#2D2D2D";\n            ctx.font = "12px Inter, Arial";\n            ctx.textAlign = "left";\n            \n            // Truncate long text\n            let displayText = item.text;\n            if (displayText.length > 18) {\n              displayText = displayText.substring(0, 15) + "...";\n            }\n            \n            ctx.fillText(displayText, pos.x + 8, itemY + 25);\n            \n            // Add color indicator if available\n            if (item.color) {\n              const colorMap: Record<string, string> = {\n                'black': '#000000', 'white': '#FFFFFF', 'blue': '#4A90E2',\n                'red': '#E24A4A', 'green': '#4AE24A', 'yellow': '#E2E24A',\n                'pink': '#E24AA4', 'purple': '#A44AE2', 'orange': '#E2A44A',\n                'brown': '#8B4513', 'gray': '#808080', 'grey': '#808080',\n                'beige': '#F5F5DC', 'navy': '#000080', 'cream': '#FFFDD0'\n              };\n              \n              const colorHex = colorMap[item.color] || '#CCCCCC';\n              ctx.fillStyle = colorHex;\n              ctx.beginPath();\n              ctx.arc(pos.x + itemWidth - 15, itemY + 12, 6, 0, 2 * Math.PI);\n              ctx.fill();\n              \n              if (item.color === 'white' || item.color === 'cream') {\n                ctx.strokeStyle = '#CCCCCC';\n                ctx.lineWidth = 1;\n                ctx.stroke();\n              }\n            }\n          });\n          \n          // Draw connection line to center product\n          ctx.strokeStyle = "#B8A898";\n          ctx.lineWidth = 2;\n          ctx.setLineDash([5, 5]);\n          ctx.beginPath();\n          \n          if (pos.x < centerX) {\n            ctx.moveTo(pos.x + 150, pos.y + 25);\n            ctx.lineTo(centerX - cardWidth/2 - 10, productCardY + cardHeight/2);\n          } else {\n            ctx.moveTo(pos.x, pos.y + 25);\n            ctx.lineTo(centerX + cardWidth/2 + 10, productCardY + cardHeight/2);\n          }\n          ctx.stroke();\n        });\n        \n        // Add styling tip at the bottom\n        ctx.fillStyle = "#666";\n        ctx.font = "italic 16px Inter, Arial";\n        ctx.textAlign = "center";\n        ctx.fillText("💡 Mix and match these pieces for different looks!", centerX, currentY + 450);\n        \n        // Convert to data URL and set\n        const dataUrl = canvas.toDataURL();\n        setCollageDataUrl(dataUrl);\n      }
    } catch (error) {
      console.error("Error generating collage:", error);
    }
  };

  if (!productInfo) {
    return (
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        backgroundColor: "#F8F7F4" 
      }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ color: "#2D2D2D", marginBottom: "16px" }}>Style with your pieces</h1>
          <p style={{ color: "#666" }}>No product information found. Please use the extension to access this page.</p>
          <Link href="/" style={{ color: "#2D2D2D", textDecoration: "underline" }}>
            Go back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: "#F8F7F4", 
      padding: "24px" 
    }}>
      <div style={{ 
        maxWidth: "1200px", 
        margin: "0 auto",
        backgroundColor: "#FFFFFF",
        borderRadius: "12px",
        padding: "32px"
      }}>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <Link href="/" style={{ color: "#666", textDecoration: "none", fontSize: "14px" }}>
            ← Back to PointFour
          </Link>
          <h1 style={{ 
            color: "#2D2D2D", 
            fontSize: "32px", 
            fontWeight: "600",
            margin: "16px 0 8px 0" 
          }}>
            Style with your pieces
          </h1>
          <p style={{ color: "#666", fontSize: "16px" }}>
            Create an outfit visualization with {productInfo.brand} and your existing wardrobe
          </p>
        </div>

        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "1fr 1fr", 
          gap: "32px",
          marginBottom: "32px"
        }}>
          {/* Left side - Product */}
          <div>
            <h2 style={{ 
              color: "#2D2D2D", 
              fontSize: "20px", 
              fontWeight: "600",
              marginBottom: "16px" 
            }}>
              Product
            </h2>
            
            {productInfo.imageUrl ? (
              <img 
                src={productInfo.imageUrl} 
                alt={`${productInfo.brand} ${productInfo.itemName}`}
                style={{
                  width: "100%",
                  maxWidth: "300px",
                  height: "auto",
                  borderRadius: "8px",
                  border: "1px solid #E5E5E5"
                }}
              />
            ) : (
              <div style={{
                width: "300px",
                height: "300px",
                backgroundColor: "#E5E5E5",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#666"
              }}>
                No image available
              </div>
            )}
            
            <div style={{ marginTop: "16px" }}>
              <h3 style={{ color: "#2D2D2D", fontSize: "18px", fontWeight: "600" }}>
                {productInfo.brand}
              </h3>
              {productInfo.itemName && (
                <p style={{ color: "#666", fontSize: "16px" }}>
                  {productInfo.itemName}
                </p>
              )}
            </div>
          </div>

          {/* Right side - User items input */}
          <div>
            <h2 style={{ 
              color: "#2D2D2D", 
              fontSize: "20px", 
              fontWeight: "600",
              marginBottom: "16px" 
            }}>
              Your pieces
            </h2>
            
            {/* Category Selection */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "8px", 
                fontSize: "14px", 
                fontWeight: "600", 
                color: "#2D2D2D" 
              }}>
                What type of item?
              </label>
              <div style={{ 
                display: "flex", 
                flexWrap: "wrap", 
                gap: "8px", 
                marginBottom: "16px" 
              }}>
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    style={{
                      padding: "8px 12px",
                      border: selectedCategory === category.id 
                        ? "2px solid #9F513A" 
                        : "1px solid #E5E5E5",
                      backgroundColor: selectedCategory === category.id 
                        ? "#F4E8D7" 
                        : "#FFFFFF",
                      color: selectedCategory === category.id 
                        ? "#9F513A" 
                        : "#666",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <span>{category.emoji}</span>
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div style={{ marginBottom: "16px" }}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`e.g., ${selectedCategory === 'tops' ? 'White cotton t-shirt' : 
                  selectedCategory === 'bottoms' ? 'Black skinny jeans' :
                  selectedCategory === 'shoes' ? 'White leather sneakers' :
                  selectedCategory === 'accessories' ? 'Gold chain necklace' :
                  'Navy wool coat'}`}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "1px solid #E5E5E5",
                  borderRadius: "8px",
                  fontSize: "16px",
                  outline: "none"
                }}
              />
              <button
                onClick={addUserItem}
                style={{
                  marginTop: "8px",
                  padding: "8px 16px",
                  backgroundColor: "#2D2D2D",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  cursor: "pointer"
                }}
              >
                Add to {categories.find(c => c.id === selectedCategory)?.name}
              </button>
            </div>

            {/* User items list organized by category */}
            <div style={{ marginBottom: "24px" }}>
              {categories.map(category => {
                const categoryItems = groupedItems[category.id] || [];
                if (categoryItems.length === 0) return null;
                
                return (
                  <div key={category.id} style={{ marginBottom: "16px" }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "8px",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#9F513A"
                    }}>
                      <span>{category.emoji}</span>
                      {category.name} ({categoryItems.length})
                    </div>
                    {categoryItems.map((item) => (
                      <div 
                        key={item.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 12px",
                          backgroundColor: "#F8F7F4",
                          border: "1px solid #E5E5E5",
                          borderRadius: "6px",
                          marginBottom: "6px",
                          marginLeft: "20px"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ color: "#2D2D2D", fontSize: "14px" }}>{item.text}</span>
                          {item.color && (
                            <div 
                              style={{
                                width: "12px",
                                height: "12px",
                                borderRadius: "50%",
                                backgroundColor: {
                                  'black': '#000000', 'white': '#FFFFFF', 'blue': '#4A90E2',
                                  'red': '#E24A4A', 'green': '#4AE24A', 'yellow': '#E2E24A',
                                  'pink': '#E24AA4', 'purple': '#A44AE2', 'orange': '#E2A44A',
                                  'brown': '#8B4513', 'gray': '#808080', 'grey': '#808080',
                                  'beige': '#F5F5DC', 'navy': '#000080', 'cream': '#FFFDD0'
                                }[item.color] || '#CCCCCC',
                                border: item.color === 'white' || item.color === 'cream' ? '1px solid #CCC' : 'none'
                              }}
                              title={`Color: ${item.color}`}
                            />
                          )}
                        </div>
                        <button
                          onClick={() => removeUserItem(item.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#666",
                            cursor: "pointer",
                            fontSize: "16px",
                            padding: "2px 6px"
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })}
              
              {userItems.length === 0 && (
                <div style={{
                  textAlign: "center",
                  padding: "24px",
                  color: "#666",
                  fontStyle: "italic"
                }}>
                  Add your wardrobe pieces to see styling combinations with this {productInfo?.brand} item
                </div>
              )}
            </div>

            {/* Generate button */}
            {userItems.length > 0 && (
              <button
                onClick={generateOutfitVisualization}
                style={{
                  width: "100%",
                  padding: "16px 24px",
                  backgroundColor: "#2D2D2D",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Generate Outfit Visualization
              </button>
            )}
          </div>
        </div>

        {/* Collage display */}
        {collageDataUrl && (
          <div style={{
            marginTop: "32px",
            padding: "24px",
            backgroundColor: "#F8F7F4",
            borderRadius: "12px",
            textAlign: "center"
          }}>
            <h2 style={{ 
              color: "#2D2D2D", 
              fontSize: "24px", 
              fontWeight: "600",
              marginBottom: "16px" 
            }}>
              Your Outfit Visualization
            </h2>
            <img 
              src={collageDataUrl} 
              alt="Outfit collage"
              style={{
                maxWidth: "100%",
                height: "auto",
                border: "1px solid #E5E5E5",
                borderRadius: "8px"
              }}
            />
            <div style={{ marginTop: "16px" }}>
              <a
                href={collageDataUrl}
                download="my-outfit-collage.png"
                style={{
                  display: "inline-block",
                  padding: "12px 24px",
                  backgroundColor: "#2D2D2D",
                  color: "#FFFFFF",
                  textDecoration: "none",
                  borderRadius: "6px",
                  fontSize: "14px"
                }}
              >
                Download Image
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}