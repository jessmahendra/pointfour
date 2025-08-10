# Fashion Item Detector Browser Extension

This browser extension detects fashion items while shopping online and provides personalized recommendations.

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `browser-extension` folder

## Development

After making changes to the extension files:

1. Go to `chrome://extensions/`
2. Find "Fashion Item Detector" in your extensions list
3. Click the refresh/reload button (🔄) to reload the extension
4. Test the extension by clicking the extension icon

## Troubleshooting

If you encounter CORS errors:

1. Make sure your Next.js development server is running (`npm run dev` in the `fashion-recommendations` folder)
2. Verify the server is running on `http://localhost:3000`
3. Check the browser console for any error messages
4. Use the "Test CORS Connection" button in the popup to verify connectivity

## API Endpoints

The extension communicates with the following API endpoints:

- `POST /api/extension/check-brand` - Check if a brand has review data
- `GET /api/extension/test` - Test CORS connection

## Files

- `manifest.json` - Extension configuration
- `popup.html` - Extension popup interface
- `popup.js` - Extension logic and API communication
