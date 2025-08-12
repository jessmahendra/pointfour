# 🚀 Pointfour Fashion Assistant - Proactive Browser Extension

A proactive browser extension that automatically displays brand fit information when users visit fashion websites, with an expandable interface for detailed item reviews.

## ✨ Features

### 🎯 Core Functionality
- **Auto-Detection**: Automatically detects when users visit fashion websites
- **Ambient Display**: Shows subtle notification widget with brand fit summary
- **Progressive Disclosure**: Expandable interface for detailed information
- **Smart Positioning**: Non-intrusive placement that doesn't block content
- **Memory**: Remembers user preferences and collapsed/expanded state per site

### 🎨 User Experience Flow
1. **User visits Zara.com** → Extension detects brand automatically
2. **Slides in minimal widget** → "Zara typically runs small • Click for details"
3. **User can**:
   - Ignore (auto-minimize after 5 seconds)
   - Click to expand for full analysis
   - Dismiss permanently for this session
   - Configure preferences

## 🏗️ Architecture

### 1. Content Script (`content-script.js`)
- **Always Active**: Injects on all fashion domains
- **URL Monitoring**: Monitors URL changes (for SPAs)
- **Widget Management**: Creates and manages the floating widget
- **Animations**: Handles expand/collapse animations
- **User Interactions**: Manages clicks, hovers, and dismissals

### 2. Background Service Worker (`background.js`)
- **Brand Detection**: Maintains brand detection logic
- **Data Caching**: Caches brand data for performance
- **API Management**: Handles API calls to Pointfour backend
- **Cross-tab State**: Manages state across multiple tabs
- **Tab Lifecycle**: Handles tab updates and activations

### 3. Floating Widget Component
- **Minimal Mode**: Single line summary with brand name and fit info
- **Expanded Mode**: Full analysis with detailed recommendations
- **Smooth Animations**: CSS transitions and keyframe animations
- **Responsive Design**: Adapts to different screen sizes
- **Theme Support**: Light/dark mode and auto theme detection

### 4. Settings Management (`settings.html` + `settings.js`)
- **User Preferences**: Enable/disable, auto-expand, notifications
- **Appearance**: Widget position, theme selection
- **Data & Privacy**: Cache duration, clear cache
- **Integration**: API endpoint configuration, connection testing

## 🛠️ Installation & Setup

### Prerequisites
- Chrome/Edge browser (Manifest V3 compatible)
- Pointfour backend running (default: `http://localhost:3000`)

### Installation Steps
1. **Clone/Download** the extension files
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer Mode** (toggle in top right)
4. **Load Unpacked** and select the extension folder
5. **Pin the extension** to your toolbar for easy access

### Configuration
1. **Click the extension icon** to open settings
2. **Configure API endpoint** (local development vs production)
3. **Customize widget position** and theme preferences
4. **Test connection** to ensure backend is accessible

## 🎯 Supported Fashion Websites

The extension automatically detects and provides fit information for:

### High Street & Fast Fashion
- **Zara** (`zara.com`)
- **H&M** (`hm.com`)
- **ASOS** (`asos.com`)
- **Uniqlo** (`uniqlo.com`)
- **COS** (`cos.com`)
- **Mango** (`mango.com`)

### Premium & Designer
- **Reformation** (`reformation.com`)
- **Everlane** (`everlane.com`)
- **Farfetch** (`farfetch.com`)
- **Net-a-Porter** (`net-a-porter.com`)
- **SSENSE** (`ssense.com`)
- **Matches Fashion** (`matchesfashion.com`)

### UK Retailers
- **Selfridges** (`selfridges.com`)
- **Harrods** (`harrods.com`)
- **Liberty London** (`libertylondon.com`)
- **John Lewis** (`johnlewis.com`)
- **Next** (`next.co.uk`)
- **River Island** (`riverisland.com`)

## 🔧 Technical Details

### Message Passing
- **Background ↔ Content Script**: Brand detection and data updates
- **Content Script ↔ Widget**: User interactions and state changes
- **Settings ↔ Background**: Preference updates and cache management

### Data Flow
1. **URL Detection** → Background script identifies fashion website
2. **Brand Recognition** → Maps domain to brand name
3. **API Call** → Fetches fit data from Pointfour backend
4. **Data Processing** → Formats and caches results
5. **Widget Update** → Content script displays information
6. **User Interaction** → Expand, dismiss, or configure

### Caching Strategy
- **Brand Data**: 30-minute cache duration (configurable)
- **User Preferences**: Synced across devices via Chrome storage
- **Tab State**: Per-tab widget visibility and expansion state

### Performance Optimizations
- **Lazy Loading**: Widget only loads when needed
- **Debounced Updates**: Prevents excessive API calls
- **Memory Management**: Automatic cleanup of expired cache entries
- **Efficient DOM**: Minimal DOM manipulation and reflows

## 🎨 Customization

### Widget Positioning
- **Top Right** (default): Non-intrusive, follows reading pattern
- **Top Left**: Alternative for left-to-right languages
- **Bottom Right/Left**: Less prominent placement

### Theme Options
- **Light**: Clean, modern appearance
- **Dark**: Reduced eye strain in low-light
- **Auto**: Follows system preference

### Behavior Settings
- **Auto-expand**: Widget opens automatically
- **Notifications**: Show/hide browser notifications
- **Cache Duration**: Balance between freshness and performance

## 🚀 Development

### File Structure
```
browser-extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker
├── content-script.js      # Content script
├── content-styles.css     # Widget styles
├── settings.html          # Settings page
├── settings.js            # Settings logic
├── popup.html            # Main popup (legacy)
├── popup.js              # Popup logic (legacy)
└── README.md             # This file
```

### Adding New Fashion Websites
1. **Update `BRAND_PATTERNS`** in `background.js`
2. **Add domain patterns** to `host_permissions` in `manifest.json`
3. **Test detection** on the target website
4. **Verify API integration** works correctly

### Debugging
- **Console Logs**: Check background script and content script logs
- **Network Tab**: Monitor API calls to Pointfour backend
- **Extension Storage**: Inspect cached data and preferences
- **Content Script**: Use browser dev tools on fashion websites

## 🔒 Privacy & Security

### Data Handling
- **Local Storage**: User preferences stored locally
- **API Calls**: Only brand names sent to backend (no personal data)
- **Cache**: Temporary storage, automatically cleared
- **No Tracking**: Extension doesn't track user behavior

### Permissions
- **Active Tab**: Required for brand detection
- **Storage**: Saves user preferences
- **Host Permissions**: Only for fashion websites
- **Scripting**: Injects widget into pages

## 🎯 Future Enhancements

### Planned Features
- **Item-Specific Detection**: Recognize individual products
- **Size Recommendation Engine**: AI-powered fit suggestions
- **Social Integration**: Share fit experiences
- **Mobile Support**: Responsive design for mobile browsers

### Integration Opportunities
- **E-commerce Platforms**: Shopify, WooCommerce
- **Fashion Apps**: Instagram, TikTok shopping
- **Size Guides**: Direct links to brand size charts
- **Review Aggregation**: Combine multiple review sources

## 🤝 Contributing

### Development Setup
1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/proactive-widget`
3. **Make changes** and test thoroughly
4. **Submit pull request** with detailed description

### Testing Checklist
- [ ] Widget appears on fashion websites
- [ ] Brand detection works correctly
- [ ] Expand/collapse animations smooth
- [ ] Settings save and apply properly
- [ ] API integration functional
- [ ] Cross-tab state management works

## 📞 Support

### Issues & Questions
- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Check this README and inline code comments
- **Community**: Join Pointfour Discord/community channels

### Troubleshooting
1. **Check console logs** for error messages
2. **Verify backend** is running and accessible
3. **Clear extension cache** in settings
4. **Reinstall extension** if persistent issues
5. **Check permissions** are granted correctly

---

**Built with ❤️ by the Pointfour team**

*Empowering fashion shoppers with intelligent fit recommendations*
