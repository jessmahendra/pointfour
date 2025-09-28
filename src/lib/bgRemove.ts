/**
 * Background removal provider abstraction
 * Default implementation is no-op (returns original image)
 * TODO: Plug in real service (self-hosted rembg, third-party API, etc.)
 */

export interface BgRemoveProvider {
  removeBackground(buffer: Buffer): Promise<Buffer>;
}

export class NoOpBgRemoveProvider implements BgRemoveProvider {
  async removeBackground(buffer: Buffer): Promise<Buffer> {
    // No-op: return original image
    return buffer;
  }
}

export class RealBgRemoveProvider implements BgRemoveProvider {
  constructor() {}

  async removeBackground(buffer: Buffer): Promise<Buffer> {
    // TODO: Implement real background removal
    // Example with rembg API:
    // const formData = new FormData();
    // formData.append('image', new Blob([buffer]));
    // const response = await fetch(this._endpoint || 'https://api.rembg.io/v1.0/remove', {
    //   method: 'POST',
    //   headers: { 'X-API-Key': this._apiKey || '' },
    //   body: formData
    // });
    // return Buffer.from(await response.arrayBuffer());
    
    // For now, return original
    return buffer;
  }
}

// Default provider (no-op)
export const defaultBgRemoveProvider = new NoOpBgRemoveProvider();

// Factory function to get provider based on environment
export function createBgRemoveProvider(): BgRemoveProvider {
  const apiKey = process.env.BG_REMOVE_API_KEY;
  const endpoint = process.env.BG_REMOVE_ENDPOINT;
  
  if (apiKey && endpoint) {
    return new RealBgRemoveProvider();
  }
  
  return defaultBgRemoveProvider;
}

