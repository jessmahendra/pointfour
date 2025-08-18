"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";

interface UserItem {
  id: string;
  text: string;
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

function StylePageContent({ searchParams }: StylePageContentProps) {
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
  const [collageDataUrl, setCollageDataUrl] = useState<string | null>(null);

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
      };
      setUserItems([...userItems, newItem]);
      setInputValue("");
    }
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
      // Create canvas
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas size
      canvas.width = 800;
      canvas.height = 600;

      // Set background
      ctx.fillStyle = "#F8F7F4";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add title
      ctx.fillStyle = "#2D2D2D";
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Your Style Collage", canvas.width / 2, 40);

      // Add product section
      ctx.font = "18px Arial";
      ctx.fillText(`${productInfo.brand} - ${productInfo.itemName}`, canvas.width / 2, 80);

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
        } catch (error) {
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
        
        // Draw user items on the right
        ctx.fillStyle = "#2D2D2D";
        ctx.font = "16px Arial";
        ctx.textAlign = "left";
        
        let yPosition = 150;
        const xPosition = 300;
        
        ctx.fillText("Your pieces:", xPosition, yPosition);
        yPosition += 30;
        
        userItems.forEach((item, index) => {
          // Draw item box
          const itemHeight = 40;
          const itemWidth = 400;
          
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(xPosition, yPosition, itemWidth, itemHeight);
          
          ctx.strokeStyle = "#E5E5E5";
          ctx.lineWidth = 1;
          ctx.strokeRect(xPosition, yPosition, itemWidth, itemHeight);
          
          // Draw item text
          ctx.fillStyle = "#2D2D2D";
          ctx.font = "14px Arial";
          ctx.fillText(item.text, xPosition + 10, yPosition + 25);
          
          yPosition += 50;
        });
        
        // Draw connecting lines/arrows
        ctx.strokeStyle = "#999";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        // Draw arrow from product to items
        ctx.beginPath();
        ctx.moveTo(250, 220); // From product
        ctx.lineTo(290, 220); // To items area
        ctx.stroke();
        
        // Arrow head
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(290, 215);
        ctx.lineTo(300, 220);
        ctx.lineTo(290, 225);
        ctx.stroke();
        
        // Convert to data URL and set
        const dataUrl = canvas.toDataURL();
        setCollageDataUrl(dataUrl);
      }
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
            
            <div style={{ marginBottom: "16px" }}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., Me+Em wide legged denim"
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
                Add item
              </button>
            </div>

            {/* User items list */}
            <div style={{ marginBottom: "24px" }}>
              {userItems.map((item) => (
                <div 
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    backgroundColor: "#F8F7F4",
                    border: "1px solid #E5E5E5",
                    borderRadius: "8px",
                    marginBottom: "8px"
                  }}
                >
                  <span style={{ color: "#2D2D2D" }}>{item.text}</span>
                  <button
                    onClick={() => removeUserItem(item.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#666",
                      cursor: "pointer",
                      fontSize: "18px"
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
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

interface StylePageProps {
  searchParams: {
    brand?: string;
    itemName?: string;
    imageUrl?: string;
    pageUrl?: string;
  };
}

export default function StylePage({ searchParams }: StylePageProps) {
  return (
    <Suspense fallback={
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        backgroundColor: "#F8F7F4" 
      }}>
        <div>Loading...</div>
      </div>
    }>
      <StylePageContent searchParams={searchParams} />
    </Suspense>
  );
}