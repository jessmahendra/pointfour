# 🎯 Debugging Widget Visibility Issues

## Quick Fix Commands

If the widget isn't showing up, try these console commands:

### 1. Force Show Widget (Bypass All Checks)
```javascript
forceShowWidget()
```

### 2. Check Extension Status
```javascript
testFashionExtension()
```

### 3. Check Widget Instance
```javascript
console.log(window.fashionWidget)
```

## Step-by-Step Debugging

### Step 1: Check Extension is Loaded
1. Go to `chrome://extensions/`
2. Find "Pointfour Fashion Assistant"
3. Make sure it's **enabled** and **reloaded**
4. Check for any error messages

### Step 2: Check Console for Errors
1. Open F12 → Console
2. Look for messages starting with `🎯 FashionWidget:`
3. Check for any red error messages
4. Look for these key messages:
   - `🎯 FashionWidget: Content script loaded!`
   - `🎯 FashionWidget: Initializing...`
   - `🎯 FashionWidget: Widget creation complete`

### Step 3: Test Manual Trigger
1. In console, type: `forceShowWidget()`
2. Press Enter
3. Widget should appear immediately
4. If it works, the issue is with detection logic

### Step 4: Check Detection Results
1. Look for detection messages in console:
   - `🎯 FashionWidget: Running universal detection...`
   - `🎯 FashionWidget: Detection results:`
   - `🎯 FashionWidget: Fashion website detected with confidence:`

## Common Issues & Solutions

### Issue: Widget Never Shows Up
**Solution**: Use `forceShowWidget()` to test if widget works at all

### Issue: Widget Shows Briefly Then Disappears
**Solution**: Check for CSS conflicts or positioning issues

### Issue: Detection Failing
**Solution**: Check if site is being blocked by `isNonFashionSite()` function

### Issue: Confidence Too Low
**Solution**: Detection threshold lowered to 30% (was 60%)

## Testing on Different Sites

### Should Show Widget:
- ✅ Fashion websites (Zara, H&M, Reformation, etc.)
- ✅ E-commerce sites with clothing
- ✅ Fashion blogs and magazines

### Should NOT Show Widget:
- ❌ Search engines (Google, Bing)
- ❌ Developer sites (GitHub, Stack Overflow)
- ❌ Clearly non-fashion sites

## Manual Override

If detection still fails, you can always force the widget:

```javascript
// Force show widget
forceShowWidget()

// Check what's happening
console.log('Current URL:', window.location.href)
console.log('Page title:', document.title)
console.log('Hostname:', window.location.hostname)
```

## Still Not Working?

1. **Refresh the extension** in `chrome://extensions/`
2. **Clear browser cache** for the site
3. **Check for ad blockers** or content blockers
4. **Try on a different fashion website**
5. **Use the test page**: `test-fixes.html`

## Expected Console Output

```
🎯 FashionWidget: Content script loaded!
🎯 FashionWidget: Current URL: [website URL]
🎯 FashionWidget: Page title: [page title]
🎯 FashionWidget: Hostname: [hostname]
🎯 FashionWidget: Initializing...
🎯 FashionWidget: DOM already ready, creating widget...
🎯 FashionWidget: Creating widget...
🎯 FashionWidget: Starting detection process...
🎯 FashionWidget: Running universal detection...
🎯 FashionWidget: Detection results: [results]
🎯 FashionWidget: Fashion website detected with confidence: [confidence]%
🎯 FashionWidget: Widget creation complete
```
