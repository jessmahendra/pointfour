# ⚡ Pointfour Fashion Assistant

A proactive browser extension that automatically displays brand fit information when users visit fashion websites, with an expandable interface for detailed item reviews.

## 🎯 Features

### Core Functionality
- **Auto-Detection**: Automatically detect when user visits a fashion website
- **Ambient Display**: Show subtle notification/widget with brand fit summary
- **Progressive Disclosure**: Expandable interface for detailed information
- **Smart Positioning**: Non-intrusive placement that doesn't block content
- **Memory**: Remember user preferences and collapsed/expanded state per site

### Enhanced User Experience
- **Glassmorphism Design**: Modern, elegant widget with backdrop blur effects
- **Smooth Animations**: Fluid transitions and micro-interactions
- **Responsive Layout**: Adapts to different screen sizes and orientations
- **Keyboard Navigation**: Full keyboard support with escape key to close
- **Touch Optimized**: Optimized for mobile and touch devices

### Smart Positioning System
- **6 Position Options**: Top-right, top-left, top-center, bottom-right, bottom-left, bottom-center
- **Intersection Observer**: Automatically repositions if blocking content
- **Responsive Behavior**: Adapts positioning based on viewport size
- **Non-Intrusive**: Ensures widget never interferes with page content

## 🏗️ Architecture

### 1. Content Script (Always Active)
- Injects on all fashion domains
- Monitors URL changes (for SPAs)
- Creates and manages the floating widget
- Handles expand/collapse animations
- Manages widget positioning and state

### 2. Background Service Worker
- Maintains brand detection logic
- Caches brand data for performance
- Manages API calls to Pointfour
- Handles cross-tab state management
- Periodic cache cleanup

### 3. Floating Widget Component
- **Minimal Mode**: Single line summary with brand name and fit info
- **Expanded Mode**: Full analysis with detailed information
- **Smooth Animations**: RequestAnimationFrame-based transitions
- **Responsive Design**: Adapts to content and screen size

## 🎨 User Experience Flow

```
User visits Zara.com
    ↓
Extension detects brand automatically
    ↓
Slides in minimal widget: "Zara typically runs small • Click for details"
    ↓
User can:
- Ignore (auto-minimize after configurable delay)
- Click to expand for full analysis
- Dismiss permanently for this session
- Configure preferences
```

## 🔧 Configuration Options

### General Settings
- **Enable Extension**: Toggle extension on/off
- **Auto-expand Widget**: Automatically expand widget when brand detected
- **Show Notifications**: Enable/disable notification system

### Appearance
- **Widget Position**: Choose from 6 positioning options
- **Theme**: Light, dark, or auto (follows system preference)
- **Widget Opacity**: Adjust transparency from 50% to 100%

### Behavior
- **Auto-hide Delay**: Configure when widget auto-hides (3s to 30s)
- **Brand Detection Sensitivity**: Low, medium, or high sensitivity

### Data & Privacy
- **Cache Duration**: 15 minutes to 2 hours
- **Clear Cache**: Manual cache clearing option

### Integration
- **API Endpoint**: Production or development API
- **Test Connection**: Verify API connectivity

## 🌐 Supported Fashion Websites

### Fast Fashion
- Zara, H&M, ASOS, Uniqlo, Mango, Topshop
- River Island, New Look, Boohoo, PrettyLittleThing
- Missguided, Nasty Gal

### Contemporary & Premium
- Reformation, Everlane, COS, Whistles
- Reiss, Ted Baker, Karen Millen

### Luxury & Designer
- Farfetch, Net-a-Porter, SSENSE, Matches Fashion
- Selfridges, Harrods, Liberty London

### Department Stores
- John Lewis, Debenhams, House of Fraser
- Marks & Spencer, Next

### Specialty & Accessories
- Warehouse, Oasis, Coast, Monsoon
- Accessorize, Dorothy Perkins, Evans, Wallis, Burton, Topman

## 🚀 Installation

### Chrome Web Store (Recommended)
1. Visit the Chrome Web Store
2. Search for "Pointfour Fashion Assistant"
3. Click "Add to Chrome"
4. Confirm installation

### Manual Installation (Development)
1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `browser-extension` folder
5. The extension will be installed and ready to use

## 📱 Usage

### Basic Usage
1. Install the extension
2. Visit any supported fashion website
3. Widget automatically appears with brand fit information
4. Click widget to expand for detailed analysis
5. Use settings to customize behavior

### Advanced Features
- **Position Customization**: Choose from 6 widget positions
- **Theme Switching**: Light, dark, or auto themes
- **Opacity Control**: Adjust widget transparency
- **Auto-hide Timing**: Configure when widget disappears
- **Brand Detection**: Adjust sensitivity for better recognition

### Keyboard Shortcuts
- **Escape**: Close expanded widget
- **Tab**: Navigate through widget elements
- **Enter/Space**: Activate buttons and links

## 🛠️ Development

### Project Structure
```
browser-extension/
├── manifest.json          # Extension manifest
├── background.js          # Service worker
├── content-script.js      # Content script
├── content-styles.css     # Widget styles
├── popup.html/js          # Extension popup
├── settings.html/js       # Settings page
└── demo.html             # Demo page
```

### Key Technologies
- **Manifest V3**: Latest Chrome extension manifest
- **Service Workers**: Background processing and caching
- **Intersection Observer**: Smart positioning detection
- **Chrome Storage API**: Persistent preferences and state
- **Modern CSS**: Grid, flexbox, custom properties, animations

### Building & Testing
1. Make changes to source files
2. Reload extension in `chrome://extensions/`
3. Test on supported fashion websites
4. Use demo.html for isolated testing

### API Integration
The extension integrates with the Pointfour API for:
- Brand fit recommendations
- External search results
- Fit tips and sizing advice
- Size guides and measurements

## 🔍 Troubleshooting

### Common Issues
- **Widget not appearing**: Check if extension is enabled and has permissions
- **Brand not detected**: Verify website is in supported list
- **API errors**: Test connection in settings
- **Performance issues**: Clear cache and adjust sensitivity

### Debug Mode
1. Open browser console
2. Look for Pointfour extension logs
3. Check for error messages
4. Verify API responses

### Support
- Check settings page for configuration issues
- Review console logs for error details
- Test on different fashion websites
- Verify extension permissions

## 📊 Performance Features

### Caching System
- **Brand Data Cache**: 30-minute cache duration
- **API Response Cache**: Reduces redundant requests
- **Automatic Cleanup**: Periodic cache maintenance
- **Memory Management**: Efficient storage usage

### Optimization
- **RequestAnimationFrame**: Smooth animations
- **Intersection Observer**: Efficient positioning detection
- **Debounced Events**: Prevents excessive API calls
- **Lazy Loading**: Load data only when needed

## 🔒 Privacy & Security

### Data Handling
- **Local Storage**: Preferences stored locally
- **Minimal Data**: Only essential information cached
- **No Tracking**: No user behavior tracking
- **Secure API**: HTTPS-only API communication

### Permissions
- **Active Tab**: Access to current tab content
- **Storage**: Save user preferences
- **Scripting**: Inject content scripts
- **Host Permissions**: Access to fashion websites

## 🎯 Future Enhancements

### Planned Features
- **Machine Learning**: Improved brand detection accuracy
- **Social Features**: Share fit recommendations
- **Mobile App**: Companion mobile application
- **Analytics Dashboard**: Usage insights and trends
- **API Extensions**: More fashion data sources

### Roadmap
- **Q1**: Enhanced brand detection algorithms
- **Q2**: Mobile app development
- **Q3**: Social features and sharing
- **Q4**: Advanced analytics and insights

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for more information.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Standards
- Follow existing code style
- Add appropriate comments
- Include error handling
- Test on multiple websites
- Update documentation

## 📞 Support & Contact

- **Website**: [pointfour.app](https://pointfour.app)
- **Documentation**: [docs.pointfour.app](https://docs.pointfour.app)
- **Issues**: GitHub Issues page
- **Email**: support@pointfour.app

---

**Made with ❤️ by the Pointfour team**
