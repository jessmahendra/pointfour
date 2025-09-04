// ========================================
// POINTFOUR - STATE MANAGEMENT MODULE
// ========================================

// Global state management for the content script
export const state = {
  widgetInjected: false,
  widgetContainer: null,
  currentBrand: null,
  initTimeout: null,
  isProcessing: false,
  detectionScore: 0,
  analysisTimeoutId: null,
  
  // Loading state tracking
  currentLoadingPhase: 'initial',
  hasShownFinalData: false,
  loadingStartTime: Date.now(),
  lastDataQuality: 0, // Track the quality of data received
  dataUpdateCount: 0  // Count how many times we've received data
};

// State getters and setters
export function getState(key) {
  return state[key];
}

export function setState(key, value) {
  state[key] = value;
}

export function updateState(updates) {
  Object.assign(state, updates);
}

export function resetState() {
  Object.assign(state, {
    widgetInjected: false,
    widgetContainer: null,
    currentBrand: null,
    initTimeout: null,
    isProcessing: false,
    detectionScore: 0,
    analysisTimeoutId: null,
    currentLoadingPhase: 'initial',
    hasShownFinalData: false,
    loadingStartTime: Date.now(),
    lastDataQuality: 0,
    dataUpdateCount: 0
  });
}

export default state;