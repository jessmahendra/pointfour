/**
 * Utility for saving and sharing looks
 * TODO: Integrate with your existing backend/models
 */

export interface LookData {
  items: Array<{
    id: string;
    category: string;
    src: string;
    x?: number;
    y?: number;
    scale?: number;
    rotation?: number;
    z?: number;
  }>;
  layout: string;
  brand: string;
  itemName: string;
  productImage: string;
  pageUrl: string;
  exportedImage?: string; // Base64 data URL
}

export interface SaveLookResponse {
  success: boolean;
  lookId?: string;
  shareUrl?: string;
  error?: string;
}

/**
 * Save a look to the backend
 * TODO: Implement actual backend integration
 */
export async function saveLook(lookData: LookData): Promise<SaveLookResponse> {
  try {
    // TODO: Replace with your actual API endpoint
    const response = await fetch('/api/looks/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lookData),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      lookId: result.lookId,
      shareUrl: result.shareUrl,
    };
  } catch (error) {
    console.error('Failed to save look:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Share a look (generate shareable URL)
 * TODO: Implement actual sharing logic
 */
export async function shareLook(lookId: string): Promise<SaveLookResponse> {
  try {
    // TODO: Replace with your actual sharing API
    const response = await fetch(`/api/looks/${lookId}/share`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      success: true,
      shareUrl: result.shareUrl,
    };
  } catch (error) {
    console.error('Failed to share look:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Download the exported image
 */
export function downloadImage(dataUrl: string, filename: string = 'look.png') {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Copy share URL to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}
