"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { CollageItem } from "@/lib/layout";

export type Item = {
  id: string;
  src: string;
  category: string;
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
  z?: number;
};

interface LookCanvasProps {
  width?: number;
  height?: number;
  bg?: string;
  items: Item[];
  onItemsChange?: (next: Item[]) => void;
}

interface ImageItem {
  id: string;
  image: HTMLImageElement;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  z: number;
}

export default function LookCanvas({
  width = 900,
  height = 900,
  bg = "#F7F5F2",
  items,
  onItemsChange,
}: LookCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    draggedId: string | null;
    startX: number;
    startY: number;
  }>({
    isDragging: false,
    draggedId: null,
    startX: 0,
    startY: 0,
  });

  // Load images
  useEffect(() => {
    const loadImages = async () => {
      setIsLoading(true);
      const loadedItems: ImageItem[] = [];

      for (const item of items) {
        try {
          const image = new window.Image();
          image.crossOrigin = "anonymous";

          await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = reject;
            image.src = item.src;
          });

          loadedItems.push({
            id: item.id,
            image,
            x: item.x || 0,
            y: item.y || 0,
            scale: item.scale || 1,
            rotation: item.rotation || 0,
            z: item.z || 0,
          });
        } catch (error) {
          console.error(`Failed to load image for item ${item.id}:`, error);
        }
      }

      // Sort by z-index
      loadedItems.sort((a, b) => a.z - b.z);
      setImageItems(loadedItems);
      setIsLoading(false);
    };

    if (items.length > 0) {
      loadImages();
    }
  }, [items]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || imageItems.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Draw images
    imageItems.forEach((item) => {
      ctx.save();

      // Move to image center
      ctx.translate(
        item.x + (item.image.width * item.scale) / 2,
        item.y + (item.image.height * item.scale) / 2
      );

      // Apply rotation
      ctx.rotate((item.rotation * Math.PI) / 180);

      // Apply scale
      ctx.scale(item.scale, item.scale);

      // Draw image centered
      ctx.drawImage(item.image, -item.image.width / 2, -item.image.height / 2);

      // Draw selection border
      if (selectedId === item.id) {
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2;
        ctx.strokeRect(
          -item.image.width / 2,
          -item.image.height / 2,
          item.image.width,
          item.image.height
        );
      }

      ctx.restore();
    });
  }, [imageItems, selectedId, width, height, bg]);

  // Mouse event handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check if clicked on an image
      for (let i = imageItems.length - 1; i >= 0; i--) {
        const item = imageItems[i];
        const itemWidth = item.image.width * item.scale;
        const itemHeight = item.image.height * item.scale;

        if (
          x >= item.x &&
          x <= item.x + itemWidth &&
          y >= item.y &&
          y <= item.y + itemHeight
        ) {
          setSelectedId(item.id);
          setDragState({
            isDragging: true,
            draggedId: item.id,
            startX: x - item.x,
            startY: y - item.y,
          });
          break;
        }
      }
    },
    [imageItems]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!dragState.isDragging || !dragState.draggedId) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newX = x - dragState.startX;
      const newY = y - dragState.startY;

      // Update item position
      setImageItems((prev) =>
        prev.map((item) =>
          item.id === dragState.draggedId ? { ...item, x: newX, y: newY } : item
        )
      );

      // Update parent state if callback provided
      if (onItemsChange) {
        const updatedItems = items.map((item) =>
          item.id === dragState.draggedId ? { ...item, x: newX, y: newY } : item
        );
        onItemsChange(updatedItems);
      }
    },
    [dragState, items, onItemsChange]
  );

  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedId: null,
      startX: 0,
      startY: 0,
    });
  }, []);

  // Export function
  const exportPNG = useCallback(
    (pixelRatio = 2) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      // Create a temporary canvas with higher resolution
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = width * pixelRatio;
      exportCanvas.height = height * pixelRatio;
      const exportCtx = exportCanvas.getContext("2d");

      if (!exportCtx) return null;

      // Scale the context
      exportCtx.scale(pixelRatio, pixelRatio);

      // Draw the main canvas content
      exportCtx.drawImage(canvas, 0, 0);

      return exportCanvas.toDataURL("image/png");
    },
    [width, height]
  );

  // Expose export function to parent
  useEffect(() => {
    if (canvasRef.current) {
      (
        canvasRef.current as HTMLCanvasElement & {
          exportPNG: (pixelRatio?: number) => string | null;
        }
      ).exportPNG = exportPNG;
    }
  }, [exportPNG]);

  if (isLoading) {
    return (
      <div
        style={{
          width,
          height,
          backgroundColor: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
      >
        <div>Loading images...</div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        cursor: dragState.isDragging ? "grabbing" : "grab",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
}

// Export helper function
export function exportPNG(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  pixelRatio = 2
): string | null {
  const canvas = canvasRef.current;
  if (!canvas) return null;

  // Create a temporary canvas with higher resolution
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = canvas.width * pixelRatio;
  exportCanvas.height = canvas.height * pixelRatio;
  const exportCtx = exportCanvas.getContext("2d");

  if (!exportCtx) return null;

  // Scale the context
  exportCtx.scale(pixelRatio, pixelRatio);

  // Draw the main canvas content
  exportCtx.drawImage(canvas, 0, 0);

  return exportCanvas.toDataURL("image/png");
}
