# Refocused Search Strategy - Prioritizing Written Content

## Overview
This implementation refocuses the search strategy to prioritize **Reddit** and **Substack** as primary sources for detailed, written fashion reviews. These platforms provide the most reliable, comprehensive, and parseable content compared to social media platforms like Instagram and TikTok.

## Why Reddit & Substack?

### **Reddit Advantages**
- **Detailed Reviews**: Users write comprehensive posts with measurements, body types, and specific experiences
- **Community Validation**: Upvotes and comments help identify quality content
- **Structured Content**: Consistent formatting makes content easier to parse
- **Rich Context**: Users often include height, weight, body type, and sizing details
- **Active Communities**: r/femalefashionadvice, r/malefashionadvice, r/fashion, r/outfits

### **Substack Advantages**
- **Professional Content**: Fashion newsletters and blogs with detailed analysis
- **Long-form Reviews**: Comprehensive articles with multiple photos and detailed insights
- **Expert Opinions**: Fashion professionals and influencers sharing detailed experiences
- **Consistent Quality**: Curated content with better writing and structure
- **Fashion Focus**: Dedicated fashion content creators and publications

## Refocused Search Configuration

### **Primary Sources (Highest Priority)**
```typescript
primary: [
  'reddit.com', 'substack.com'  // Main focus for detailed written reviews
]
```

### **Enhanced Reddit-Specific Queries**
```typescript
redditSpecific: '"{brand} {itemName}" (review OR "fit review" OR sizing OR "how does it fit") site:reddit.com/r/femalefashionadvice OR site:reddit.com/r/malefashionadvice OR site:reddit.com/r/fashion OR site:reddit.com/r/outfits'
```

### **Enhanced Substack-Specific Queries**
```typescript
substackSpecific: '"{brand} {itemName}" (review OR "fit review" OR sizing OR "fashion review" OR "style review") site:substack.com'
```

## Enhanced Content Processing

### **Better Reddit Content Extraction**
- **Comment Selectors**: `[data-testid="comment-top-level"]`, `.RichTextJSON-root`
- **User Text**: `.comment`, `.usertext-body`
- **Increased Content**: From 1200 to 1500 characters for better context
- **Final Output**: From 2000 to 2500 characters for comprehensive reviews

### **Better Substack Content Extraction**
- **Post Content**: `.post-content`, `.body markup`, `.entry-content`
- **Enhanced Parsing**: Better handling of newsletter formatting
- **Rich Content**: Longer articles with detailed fashion insights

## Refocused Search Queries

### **1. Brand Fit Summary (Primary Focus)**
```
"Reformation" ("runs small" OR "fits large" OR "true to size" OR "size up" OR "size down" OR "sizing" OR "fit review" OR "measurements") (site:reddit.com OR site:substack.com)
```

### **2. Item-Specific Reviews (Primary Focus)**
```
"Reformation Micah pants" (review OR "fit review" OR sizing OR "how does it fit" OR "fit check" OR "size up" OR "size down" OR "runs small" OR "runs large" OR measurements OR "body type" OR "height" OR "weight") (site:reddit.com OR site:substack.com OR site:medium.com OR site:styleforum.net)
```

### **3. Enhanced Reddit Search**
```
"Reformation Micah pants" (review OR "fit review" OR sizing OR "how does it fit") site:reddit.com/r/femalefashionadvice OR site:reddit.com/r/malefashionadvice OR site:reddit.com/r/fashion OR site:reddit.com/r/outfits
```

### **4. Enhanced Substack Search**
```
"Reformation Micah pants" (review OR "fit review" OR sizing OR "fashion review" OR "style review") site:substack.com
```

## Improved Content Classification

### **Enhanced Fit Keywords**
- **Basic**: runs small, runs large, true to size, size up, size down
- **Advanced**: measurements, bust, waist, hips, length, inseam, shoulder width
- **Body Context**: body type, height, weight, petite, tall, curvy
- **Detailed**: fit review, how does it fit, fit check, size recommendation

### **Enhanced Quality Keywords**
- **Fabric**: pilled, shrunk, faded, after wash, fabric feel, material
- **Construction**: stitching, durability, construction, comfort
- **Care**: care instructions, washing, dry clean, iron, maintenance
- **Performance**: wrinkle-resistant, breathable, stretchy, rigid, longevity

### **Enhanced Style Keywords**
- **Styling**: styling, outfit, lookbook, street style, fashion inspiration
- **Versatility**: how to wear, versatile, dress up, dress down
- **Occasions**: casual, formal, work appropriate, weekend, special occasion
- **Details**: layering, accessories, shoes, jewelry

## Result Organization & Priority

### **Display Priority Order**
1. **Item-Specific Reviews** - Most relevant content first
2. **Primary Sources (Reddit & Substack)** - Highest quality written content
3. **Community Reviews** - Style Forum, Fashion Spot, etc.
4. **Blog Reviews** - Medium, WordPress, fashion blogs
5. **Video Reviews** - YouTube (detailed video content)
6. **Fashion Publications** - Vogue, Elle, magazines
7. **Social Media** - Instagram, Pinterest (reduced priority)
8. **Other Sources** - Shopping platforms, miscellaneous

### **Visual Emphasis**
- **Primary Sources**: Red color (#dc2626), bold font, prominent display
- **Item-Specific**: Green borders and highlighting
- **Other Categories**: Standard styling with color coding

## Expected Results for "Reformation Micah pants"

### **Primary Sources (Reddit & Substack)**
- **Reddit**: Detailed posts with measurements, body types, fit photos
- **Substack**: Comprehensive fashion newsletters with styling tips

### **Enhanced Content Quality**
- **Longer Reviews**: More detailed content (1500-2500 characters)
- **Better Context**: Height, weight, body type, sizing details
- **Rich Information**: Care instructions, durability, styling advice
- **Community Validation**: Upvoted content and helpful comments

### **Specific Examples**
- **Reddit**: "I'm 5'4", 130lbs, usually size 6. The Micah pants run small, I sized up to 8 and they fit perfectly through the waist but are a bit long. I had them hemmed 2 inches."
- **Substack**: "The Reformation Micah pants are a wardrobe staple that I've worn for 2+ years. They run small in the waist but stretch slightly with wear. I'm 5'7" and the regular length works well with heels."

## Benefits of Refocused Strategy

### **For Users**
- **Better Quality**: More detailed and reliable reviews
- **Rich Context**: Specific measurements and body type information
- **Comprehensive Coverage**: Detailed fit, quality, and styling insights
- **Trusted Sources**: Community-validated content from Reddit

### **For Content Quality**
- **Parseable Content**: Text-based content is easier to process
- **Structured Information**: Consistent formatting across platforms
- **Rich Details**: Longer reviews with comprehensive information
- **Community Input**: Multiple perspectives and experiences

### **For Technical Performance**
- **Better Parsing**: Text content is more reliable than social media
- **Consistent Format**: Reddit and Substack have stable structures
- **Rich Metadata**: Better classification and relevance scoring
- **Easier Maintenance**: More predictable content sources

## Future Enhancements

### **Reddit-Specific Improvements**
- **Subreddit Targeting**: Focus on most relevant fashion communities
- **Comment Threading**: Include helpful comment discussions
- **User Flair**: Consider user expertise and reputation
- **Post Age**: Prioritize recent but established content

### **Substack-Specific Improvements**
- **Newsletter Discovery**: Better identification of fashion-focused newsletters
- **Author Credibility**: Consider author expertise and following
- **Content Categories**: Classify by review type and depth
- **Publication Quality**: Identify high-quality fashion publications

### **Content Enhancement**
- **Measurement Extraction**: Automatically identify sizing information
- **Body Type Classification**: Categorize by body type and fit
- **Sentiment Analysis**: Identify positive/negative experiences
- **Trend Detection**: Spot emerging fashion trends and discussions

## Conclusion

This refocused strategy transforms the search from a broad, multi-platform approach to a targeted, quality-focused system that prioritizes the most reliable sources of detailed fashion information. By focusing on Reddit and Substack, users get:

- **Higher Quality Content**: Detailed, community-validated reviews
- **Better Context**: Specific measurements, body types, and experiences
- **Rich Information**: Comprehensive fit, quality, and styling insights
- **Reliable Sources**: Text-based content that's easier to parse and classify

The result is a more focused, higher-quality fashion review system that provides users with the detailed, reliable information they need to make informed fashion decisions.
