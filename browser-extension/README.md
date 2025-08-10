# Fashion Item Detector Chrome Extension

A Chrome browser extension that detects fashion items while shopping online, designed to work with your Pointfour fashion recommendations app.

## Features

- **Website Detection**: Automatically detects the current website you're browsing
- **Item Detection**: Identifies fashion items on product pages using smart selectors
- **Clean UI**: Professional, modern popup design with gradient background
- **Cross-Site Compatibility**: Works on major fashion retailers like ASOS, Zara, H&M, and more

## Installation

1. **Download/Clone** this repository to your local machine
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer Mode** by toggling the switch in the top right
4. **Click "Load unpacked"** and select the `browser-extension` folder
5. **Pin the extension** to your toolbar for easy access

## Usage

1. **Navigate** to any fashion product page (e.g., ASOS, Zara, H&M)
2. **Click the extension icon** in your Chrome toolbar
3. **View detected information**:
   - Website name (e.g., "asos.com")
   - Fashion item name (e.g., "Women's Black Dress")

## How It Works

The extension uses intelligent selectors to detect product information:
- Searches for common product title selectors
- Falls back to meta tags if needed
- Filters out generic or very short text
- Shows "Unable to detect" if no item is found

## Testing

Test the extension on these fashion sites:
- **ASOS**: `https://www.asos.com/`
- **Zara**: `https://www.zara.com/`
- **H&M**: `https://www2.hm.com/`
- **Uniqlo**: `https://www.uniqlo.com/`

## File Structure

```
browser-extension/
├── manifest.json      # Extension configuration
├── popup.html        # Popup UI
├── popup.js          # Detection logic
└── README.md         # This file
```

## Permissions

- **activeTab**: Access to the currently active tab
- **scripting**: Execute scripts to detect page content

## Future Enhancements

- Integration with Pointfour API for recommendations
- Product image detection
- Price extraction
- Size and color detection
- Direct link to Pointfour recommendations

## Troubleshooting

- **"Unable to detect item"**: The page might not have a clear product title
- **Extension not working**: Make sure you're on a regular website (not chrome:// pages)
- **Permission errors**: Check that the extension has the required permissions

## Development

To modify the extension:
1. Edit the files in the `browser-extension` folder
2. Go to `chrome://extensions/`
3. Click the refresh icon on your extension
4. Test the changes

## Support

For issues or questions, check the main Pointfour project documentation or create an issue in the repository.
