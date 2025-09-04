// ========================================
// POINTFOUR - API SECURITY MODULE
// ========================================

import { ALLOWED_API_ENDPOINTS } from './config.js';

// Initialize API security by overriding fetch and XMLHttpRequest
export function initializeAPISecurity() {
  // Override fetch to block unauthorized API calls
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    const urlString = typeof url === 'string' ? url : url.toString();
    
    // Check if this is a Scarab API call and block it
    if (urlString.includes('scarabresearch.com')) {
      console.warn('🚫 [PointFour] Blocked Scarab API call:', urlString);
      return Promise.reject(new Error('Scarab API calls are not allowed. Use PointFour API endpoints only.'));
    }
    
    // Check if this is an allowed endpoint
    const isAllowed = ALLOWED_API_ENDPOINTS.some(endpoint => urlString.startsWith(endpoint));
    if (!isAllowed && urlString.startsWith('http')) {
      console.warn('🚫 [PointFour] Blocked unauthorized API call:', urlString);
      return Promise.reject(new Error('Unauthorized API endpoint. Use PointFour API endpoints only.'));
    }
    
    return originalFetch.apply(this, arguments);
  };

  // Override XMLHttpRequest to block unauthorized API calls
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    const urlString = url.toString();
    
    // Check if this is a Scarab API call and block it
    if (urlString.includes('scarabresearch.com')) {
      console.warn('🚫 [PointFour] Blocked Scarab XMLHttpRequest:', urlString);
      this.abort();
      return;
    }
    
    // Check if this is an allowed endpoint
    const isAllowed = ALLOWED_API_ENDPOINTS.some(endpoint => urlString.startsWith(endpoint));
    if (!isAllowed && urlString.startsWith('http')) {
      console.warn('🚫 [PointFour] Blocked unauthorized XMLHttpRequest:', urlString);
      this.abort();
      return;
    }
    
    return originalXHROpen.apply(this, [method, url, ...args]);
  };
}

export default {
  initializeAPISecurity
};