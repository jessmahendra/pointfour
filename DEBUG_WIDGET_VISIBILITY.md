# 🐛 Debug Widget Visibility Issues

## 🚨 **Problem**: Widget not appearing on expected fashion websites

## 🔍 **Debugging Checklist**

### 1. **Check Browser Console**
- Open Developer Tools (F12)
- Go to Console tab
- Look for messages starting with `🎯 FashionWidget:`
- Check for any error messages

### 2. **Verify Extension is Loaded**
- Check if extension icon is visible in browser toolbar
- Click extension icon to see if popup opens
- Check extension is enabled in browser settings

### 3. **Check Current Detection Status**
Look for these console messages:
```
🎯 FashionWidget: Starting detection process...
🎯 FashionWidget: Current URL: [website URL]
🎯 FashionWidget: Current hostname: [hostname]
🎯 FashionWidget: Page title: [page title]
```

### 4. **Check Detection Results**
Look for one of these outcomes:
```
✅ SUCCESS: Widget should appear
🎯 FashionWidget: Confirmed fashion domain detected: [hostname]
🎯 FashionWidget: Site looks like a fashion retailer, showing widget

❌ BLOCKED: Widget hidden
🎯 FashionWidget: Non-fashion site detected, skipping completely
🎯 FashionWidget: Publishing platform detected, skipping widget
🎯 FashionWidget: General e-commerce platform detected, skipping widget
🎯 FashionWidget: Site does not appear to be a fashion retailer, skipping widget
```

## 🧪 **Test Cases**

### **Should Show Widget** ✅
- `zara.com` / `zara.co.uk`
- `hm.com` / `hm.co.uk`
- `mango.com` / `mango.co.uk`
- `reformation.com`
- `everlane.com`
- `nike.com` / `nike.co.uk`
- `lululemon.com`

### **Should NOT Show Widget** ❌
- `substack.com` (publishing platform)
- `medium.com` (publishing platform)
- `amazon.com` (general e-commerce)
- `ebay.com` (general e-commerce)
- `google.com` (search engine)
- `youtube.com` (social media)

## 🛠️ **Manual Testing Steps**

### **Step 1: Test on Known Fashion Site**
1. Go to `zara.com` or `hm.com`
2. Open Developer Tools (F12)
3. Check Console for detection messages
4. Look for widget on page

### **Step 2: Check Extension Status**
1. Click extension icon in toolbar
2. Verify extension is active
3. Check if any error messages appear

### **Step 3: Test Console Commands**
In Console, try:
```javascript
// Check if widget exists
document.getElementById('fashion-fit-widget')

// Check if FashionWidget class exists
window.FashionWidget

// Check current detection status
console.log('Current URL:', window.location.href)
console.log('Current hostname:', window.location.hostname)
```

## 🚨 **Common Issues & Solutions**

### **Issue 1: No Console Messages**
**Problem**: Extension not running
**Solution**: 
- Reload extension in browser
- Check extension permissions
- Verify manifest.json is correct

### **Issue 2: "Non-fashion site detected"**
**Problem**: Site blocked by detection system
**Solution**: 
- Check if site is in non-fashion domains list
- Verify site isn't detected as publishing platform
- Check URL patterns

### **Issue 3: "Site does not appear to be a fashion retailer"**
**Problem**: Smart detection failed
**Solution**:
- Check fashion retailer detection scoring
- Verify e-commerce patterns are present
- Check for fashion-specific elements

### **Issue 4: Widget created but not visible**
**Problem**: CSS/styling issues
**Solution**:
- Check if widget HTML exists in DOM
- Verify CSS is loaded correctly
- Check for z-index conflicts

## 📋 **Debug Information to Collect**

When reporting issues, include:
1. **Website URL** where widget should appear
2. **Browser** and version
3. **Console messages** (copy all `🎯 FashionWidget:` messages)
4. **Extension version** (from manifest.json)
5. **Any error messages** in console
6. **Screenshot** of the page (if helpful)

## 🔧 **Quick Fixes to Try**

### **Fix 1: Reload Extension**
1. Go to `chrome://extensions/`
2. Find "Pointfour Fashion Assistant"
3. Click reload button
4. Refresh test page

### **Fix 2: Clear Browser Cache**
1. Hard refresh page (Ctrl+Shift+R)
2. Clear browser cache and cookies
3. Restart browser

### **Fix 3: Check Permissions**
1. Verify extension has `<all_urls>` permission
2. Check if site is blocked by browser
3. Verify no ad blockers are interfering

## 📞 **Next Steps**

If issues persist:
1. **Collect debug information** above
2. **Test on multiple fashion sites** to identify pattern
3. **Check if issue is site-specific** or global
4. **Report specific error messages** and console output

---

**Remember**: The widget should appear on fashion retail websites where users can shop, not on publishing platforms or general e-commerce sites.
