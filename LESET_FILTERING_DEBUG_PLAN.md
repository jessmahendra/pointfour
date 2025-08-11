# LESET Review Filtering Debug & Fix Plan

## 🚨 **Current Issue**
The extension is returning ALL 433 reviews instead of just LESET-specific reviews, indicating a brand name matching failure.

## 🔍 **Root Cause Hypothesis**
The brand name field mapping between the Brands and Reviews tables is inconsistent, causing the filter to fail and return all reviews.

## 📋 **Debug Plan**

### **Phase 1: Immediate Debugging (Current)**
1. **Enhanced Logging Added**:
   - Log all unique brand names in reviews table
   - Log raw Airtable field values
   - Log each review's brand name matching attempt
   - Temporarily restrict filtering to exact matches only

2. **Debug Scripts Created**:
   - `debug-leset-filtering.js` - Test LESET specifically
   - Enhanced logging throughout the data flow

### **Phase 2: Data Structure Analysis**
1. **Check Server Console** for:
   ```
   📊 API: All brand names found in reviews table: [list of brands]
   📋 First 3 review records (raw): [field details]
   🔍 Review brand matching: "leset" vs "leset"
   ```

2. **Identify Field Name Mismatches**:
   - Brands table: What field contains "LESET"?
   - Reviews table: What field contains brand names?
   - Are they using the same field names?

### **Phase 3: Fix Implementation**
1. **Correct Field Mapping**:
   - Update the `safeGet` calls to use correct field names
   - Ensure consistent field access between tables

2. **Implement Smart Filtering**:
   - Exact brand name matching
   - Case-insensitive comparison
   - Handle common formatting variations

### **Phase 4: Enhanced Filtering**
1. **Item-Specific Filtering**:
   - Filter by item name (e.g., "Margo Tee")
   - Filter by garment type (e.g., "T-shirt")

2. **Size/Fit Filtering**:
   - Filter by user body type
   - Filter by size bought vs usual size

## 🧪 **Testing Steps**

### **Step 1: Restart Server & Test**
```bash
# Restart your Next.js server
cd fashion-recommendations
npm run dev
```

### **Step 2: Run Debug Script**
```bash
node debug-leset-filtering.js
```

### **Step 3: Check Server Console**
Look for these key log messages:
- `📊 API: All brand names found in reviews table:`
- `🔍 Review brand matching:`
- `📋 First 3 review records (raw):`

### **Step 4: Test Extension**
1. Navigate to LESET Margo t-shirt page
2. Open extension popup
3. Check console for debug output
4. Verify review count is now correct

## 🎯 **Expected Results After Fix**

### **Before Fix**
- `reviewCount: 433` (all reviews)
- UI shows "433 reviews found"
- No filtering working

### **After Fix**
- `reviewCount: X` (only LESET reviews)
- UI shows "X reviews found for LESET"
- Proper filtering working

## 🔧 **Potential Issues to Check**

### **1. Environment Variables**
```bash
# Check if these are set correctly
AIRTABLE_REVIEWS_TABLE=Reviews
AIRTABLE_BRANDS_TABLE=Brands
```

### **2. Field Names in Airtable**
- **Brands table**: Check field name for brand names
- **Reviews table**: Check field name for brand names
- **Common variations**: "Brand Name", "brand name", "Brand", "brand"

### **3. Data Format Consistency**
- **Brands table**: "LESET" vs "Leset" vs "leset"
- **Reviews table**: Same format as brands table?

## 📊 **Debug Output Analysis**

### **If All Reviews Returned (Current Issue)**
```
📊 API: All brand names found in reviews table: [many brands]
🔍 Review brand matching: "leset" vs "leset"
❌ Brand name does not match - excluding review
```
**Problem**: Field mapping issue or data format mismatch

### **If No Reviews Found**
```
📊 API: All brand names found in reviews table: [LESET not in list]
```
**Problem**: Brand name not in reviews table or different field

### **If Correct Number Found**
```
📊 API: Found X reviews for brand "LESET"
✅ Exact brand name match in review
```
**Success**: Filtering working correctly

## 🚀 **Next Steps**

1. **Run the debug script** to see current state
2. **Check server console** for detailed logging
3. **Identify the field mapping issue** from the logs
4. **Fix the field names** in the Airtable service
5. **Test the filtering** with the extension
6. **Implement enhanced filtering** for item-specific results

## 📝 **Quick Commands**

```bash
# Test LESET filtering
node debug-leset-filtering.js

# Test general brand matching
node debug-brand-matching.js

# Check server logs
# Look for "📊 API: All brand names found in reviews table:"
```

The enhanced logging should now show exactly what's happening with the brand name matching, making it easy to identify and fix the filtering issue.
