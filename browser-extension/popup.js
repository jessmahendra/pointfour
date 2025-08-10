// Function to extract domain from URL
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch (error) {
    return 'Unknown';
  }
}

// Function to detect fashion item from page content
function detectFashionItem() {
  // Common selectors for product titles on fashion websites
  const selectors = [
    // Generic product selectors
    'h1[class*="product"]',
    'h1[class*="title"]',
    'h1[class*="name"]',
    '[data-testid*="title"]',
    '[data-testid*="product"]',
    '[class*="product-title"]',
    '[class*="product-name"]',
    '[class*="item-title"]',
    '[class*="item-name"]',
    
    // Specific to common fashion sites
    'h1[class*="product-title"]', // ASOS
    '[data-testid="product-title"]', // Common pattern
    '[class*="product-details"] h1', // Product detail pages
    '[class*="product-info"] h1', // Product info sections
    
    // Fallback to main h1 if no specific product selectors found
    'h1',
    
    // Meta tags as fallback
    'meta[property="og:title"]',
    'meta[name="twitter:title"]'
  ];

  // Try to find product title using selectors
  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        let text = element.textContent || element.getAttribute('content') || '';
        text = text.trim();
        
        // Filter out very short or generic text
        if (text.length > 3 && text.length < 200) {
          // Clean up the text
          text = text.replace(/\s+/g, ' ').trim();
          return text;
        }
      }
    } catch (error) {
      continue;
    }
  }

  return null;
}

// Function to update the popup with detected information
function updatePopup(website, item) {
  const websiteElement = document.getElementById('website');
  const itemElement = document.getElementById('item');
  
  websiteElement.textContent = website;
  
  if (item) {
    itemElement.textContent = item;
  } else {
    itemElement.innerHTML = '<span class="no-item">Unable to detect item</span>';
  }
}

// Main function to get current tab info
async function getCurrentTabInfo() {
  try {
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      updatePopup('Error', 'Unable to access tab');
      return;
    }

    const website = extractDomain(tab.url);
    
    // Execute script in the active tab to detect fashion item
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: detectFashionItem
      });
      
      const item = results[0]?.result;
      updatePopup(website, item);
      
    } catch (error) {
      // If we can't execute script (e.g., on chrome:// pages), show website only
      updatePopup(website, null);
    }
    
  } catch (error) {
    updatePopup('Error', 'Unable to access tab information');
  }
}

// Initialize popup when it opens
document.addEventListener('DOMContentLoaded', getCurrentTabInfo);

// Update when popup is focused (in case user switches tabs)
window.addEventListener('focus', getCurrentTabInfo);
