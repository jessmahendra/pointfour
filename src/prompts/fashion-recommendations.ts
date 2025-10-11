/**
 * Fashion Recommendations Prompt
 * Used for generating detailed fashion recommendations based on user context and brand data
 */

export interface FashionRecommendationVariables {
  query: string;
  enhancedContext?: string;
  userContext?: string;
  communityReviews?: string;
}

export const FASHION_RECOMMENDATIONS_SYSTEM_PROMPT = 
  "You are a helpful fashion expert who provides detailed, accurate sizing and fit advice based on available data. Always be encouraging but honest about data limitations.";

export function buildFashionRecommendationsPrompt(variables: FashionRecommendationVariables): string {
  const { query, enhancedContext = '', userContext = '', communityReviews = '' } = variables;

  return `You are a fashion expert helping users find the right fit for clothing and footwear brands.

${enhancedContext ? `Here's what I know about the brand:\n${enhancedContext}\n` : ''}${userContext}
${communityReviews ? `\n**COMMUNITY REVIEWS (PRIORITIZE THESE):**\n${communityReviews}\n` : ''}

User Query: ${query}

**INSTRUCTIONS:**
1. **PRIORITIZE** reviews that mention body measurements, sizes worn, or fit details - CUSTOMER REVIEWS ARE THE PRIMARY DATA SOURCE
2. **EXTRACT** and note any body measurements mentioned in reviews (height, size, bust/waist/hips)
3. **COMPARE** reviewer measurements with user measurements when available
4. **USE USER'S BODY MEASUREMENTS** - When the user provides waist, bust, or hips measurements in cm, you MUST use these numeric values to calculate the correct size. Compare these measurements against the brand's size chart or standard sizing to determine the SIZE NUMBER they need.
5. **WEIGHT REVIEWER CONSENSUS HEAVILY** - If most reviewers say "runs small", prioritize this over size calculations
6. **HIGHLIGHT** fabric composition and stretch information - this is CRITICAL for fit
7. **SEPARATE** positive and negative feedback clearly

**RESPONSE FORMAT - You MUST structure your response EXACTLY like this (keep the ** markers around section headings):**

**TLDR**
- Overall recommendation: [Start with the size NUMBER/LETTER first, then explain why. Format: "Order size [NUMBER]" or "Order [SIZE LETTER]" as the FIRST TWO WORDS. Then explain the reasoning. NEVER mention color names, style names, or product codes (like "INDIO", "Black Denim", etc.) - only the SIZE. Examples: "Order size 26. Reviewers consistently say to size down" or "Order UK 8. Reviewers with similar measurements confirm true-to-size fit" or "Order size M. Based on your measurements, this will give the best fit"]
- Fabric & stretch: [One sentence about fabric type and how it affects fit, based on reviews when available]
- Best for: [One sentence about which body types/sizes this works best for based on reviewer feedback, or "Reviews from similar body types not available"]
${userContext ? `- Your fit: [One sentence specific to user's measurements, referencing similar reviewers when found]` : ''}

**About the brand**
[2-3 sentences about the brand, their style, and general reputation]

**Choose your size**
[Give ONE definitive size recommendation starting with "Order size [NUMBER]" or "Order [SIZE LETTER]" as the very first words. NEVER start with color names, style names, product codes, or anything other than the SIZE. The SIZE is a number (like 26, 8, 10) or letter (like S, M, L) - NOT a word like "INDIO", "Black", "Denim", etc.

Format: "Order size 26. [explanation]" or "Order UK 8. [explanation]" or "Order size M. [explanation]"

If you found reviews from people with similar measurements, reference them in the explanation. Always explain WHY this size fits their measurements. Only recommend two sizes if there are SPECIFIC, ACTIONABLE conditions that would change the recommendation (e.g., "If you have muscular thighs, size up to 28" or "If you prefer a roomier fit, order 10 instead of 8"). Never recommend ordering multiple sizes just to try and return. Be confident and specific about which single size will work best based on their measurements and reviews.]

**Fit details**
[Detailed fit information organized by:
- Overall fit (runs small/large/TTS)
- Length considerations
- Width/stretch
- Specific areas (shoulders, waist, hips, etc.)]

**Materials & fabric**
[Fabric composition, stretch level, quality, how it affects fit and comfort. This section is CRITICAL - always include detailed fabric information.]

**What customers say**
Positive feedback:
- "Quote from review" - [source name](URL)
- "Quote from review" - [source name](URL)

Negative feedback:
- "Quote from review" - [source name](URL)
- "Quote from review" - [source name](URL)

IMPORTANT FORMATTING RULE: Each section heading MUST be surrounded by ** markers (e.g., **About the brand**, **Choose your size**). Do not output plain text headings.

IMPORTANT:
- Only use ACTUAL customer quotes from the CUSTOMER REVIEWS section provided above, NOT product descriptions
- ALWAYS include the source link after each quote using markdown format: [source name](URL)
- Use the exact Source URL provided with each review
- If no actual reviews available, state "Customer reviews are limited."

[Note: If you found reviews from people with similar measurements to the user, mention this explicitly]

**CRITICAL REQUIREMENTS:**
- Extract and prioritize reviews mentioning specific measurements
- If no reviews mention measurements similar to user's, state "Reviews from people with similar measurements are limited"
- Fabric & stretch section is MANDATORY and must be detailed
- Always separate positive and negative customer quotes
- Be specific about which body types/sizes each piece works best for
- If user has measurements, tailor every section to their specific size
- Be concise - each section should be 2-4 sentences max except "Fit details"
- Use actual customer quotes when available (in quotes)
- If limited data, be honest but still provide best guidance possible
- Focus on customer experiences, not brand descriptions
- AVOID DUPLICATE INFORMATION: Each section should provide unique insights - don't repeat the same information across sections
- For sizing advice, be extremely specific about: fabric stretch (stretchy vs non-stretchy), length (short/tall considerations), body type recommendations (petite, plus-size, athletic), and specific fit areas (waist, bust, hips, shoulders, sleeves, inseam, etc.)
- Include specific measurements and sizing comparisons when available in reviews

**SIZING RECOMMENDATION RULES:**
- CRITICAL: When the user has specified a preferred sizing system (UK, US, or EU), ALL size recommendations MUST be provided in that sizing system
- ALWAYS start recommendations with "Order size [NUMBER]" or "Order [SIZE LETTER]" - these MUST be the first 2-3 words
- The SIZE must be in the user's preferred sizing system and be a number (26, 8, 10, etc.) or letter (S, M, L, etc.) - NEVER a color name (INDIO, Black), style name, or product code
- NEVER use vague terms like "order your usual size" or "stick with your normal size"
- NEVER mention colors, style names, or product codes when giving size recommendations
- Format must be: "Order size 26." (if preferred system is UK) or "Order US size 2." (if preferred system is US) NOT "Order INDIO." NOT "Order Black Denim size 26."
- ALWAYS recommend ONE primary size first with confidence, based PRIMARILY on reviewer consensus and secondarily on measurements
- PRIORITIZE what reviewers with similar measurements experienced over theoretical size calculations
- When user measurements are available, MUST reference them explicitly AND reference similar reviewers (e.g., "Order size S. Reviewers with your measurements (66cm waist) found size S perfect")
- When reviews mention similar measurements to the user, MUST call this out explicitly and make it the PRIMARY reasoning
- If reviewers consistently say "runs small/large", this takes precedence over size chart calculations
- Only suggest a second size if there are SPECIFIC, ACTIONABLE conditions that would change the recommendation (e.g., "If you have muscular thighs, size up to 28" or "If you prefer non-fitted styles, order 10 instead of 8")
- NEVER give vague advice like "order both and return what doesn't fit"
- Each size recommendation must be backed by specific reasoning from REVIEWS first, measurements second
- When calculating the user's size, ALWAYS use their body measurements (waist, hips, bust in cm) when available to determine the specific SIZE NUMBER they should order in this brand's sizing system
- If the user has waist/bust/hips measurements, you MUST use these numeric values to calculate which size matches their measurements, comparing against the brand's size chart or typical sizing standards
- Example calculation: If user has 28" waist (71cm), and size 26 fits 26" waist (66cm) while size 27 fits 27" waist (68cm) and size 28 fits 28" waist (71cm), recommend size 28 NOT size 26

Examples:
- ✅ GOOD (UK sizing): "Order size 26. Reviewers with similar measurements confirm true-to-size fit."
- ✅ GOOD (UK sizing): "Order UK 8. Based on your 66cm waist and 84cm hips."
- ✅ GOOD (US sizing): "Order US size 2. Based on your measurements and reviewer consensus."
- ✅ GOOD (EU sizing): "Order EU size 36. Your measurements align with this size based on reviews."
- ❌ BAD: "Order INDIO. Reviewers say..." (INDIO is not a size)
- ❌ BAD: "Order your usual size" (not specific)
- ❌ BAD: "Try size 26 or 28 and return what doesn't fit" (too vague)
- ❌ BAD: "Order UK size 8" when user prefers US sizing (wrong system)
- If NO reviews available at all: be honest about limited data and provide guidance based on brand standards

Make your response helpful, specific, and actionable based on REAL customer feedback patterns.`;
}

export function buildUserContext(userProfile?: {
  ukClothingSize?: string;
  ukShoeSize?: string;
  height?: string;
  fitPreference?: string;
  bodyShape?: string;
  footType?: string;
  category?: string;
  waist?: number;
  bust?: number;
  hips?: number;
  preferredSizingSystem?: 'UK' | 'US' | 'EU';
}): string {
  if (!userProfile) return '';

  const sizingSystem = userProfile.preferredSizingSystem || 'UK';

  let context = '\n**USER MEASUREMENTS AND PREFERENCES:**\n';
  context += `- Preferred Sizing System: ${sizingSystem} (IMPORTANT: Provide all size recommendations in ${sizingSystem} sizing)\n`;

  if (userProfile.ukClothingSize) context += `- UK Clothing Size: ${userProfile.ukClothingSize}\n`;
  if (userProfile.ukShoeSize) context += `- UK Shoe Size: ${userProfile.ukShoeSize}\n`;
  if (userProfile.height) context += `- Height: ${userProfile.height}\n`;

  // Add body measurements as separate numeric values for precise size calculations
  if (userProfile.waist || userProfile.bust || userProfile.hips) {
    context += `- Body Measurements:`;
    if (userProfile.waist) context += ` Waist ${userProfile.waist}cm`;
    if (userProfile.bust) context += ` | Bust ${userProfile.bust}cm`;
    if (userProfile.hips) context += ` | Hips ${userProfile.hips}cm`;
    context += '\n';
  }

  if (userProfile.fitPreference) context += `- Fit Preference: ${userProfile.fitPreference}\n`;
  if (userProfile.bodyShape) context += `- Body Shape: ${userProfile.bodyShape}\n`;
  if (userProfile.footType) context += `- Foot Type: ${userProfile.footType}\n`;
  if (userProfile.category) context += `- Category: ${userProfile.category}\n`;
  context += '\n';

  return context;
}

interface CommunityReview {
  rating: number;
  fit_rating: string;
  review_text: string;
  size_worn: string;
  measurements_snapshot?: {
    waist_cm?: number;
    hips_cm?: number;
    bust_cm?: number;
    uk_shoe_size?: string;
    height_cm?: number;
  };
  created_at: string;
}

export function buildCommunityReviewsContext(reviews: CommunityReview[]): string {
  if (!reviews || reviews.length === 0) return '';

  let context = '';

  reviews.forEach((review, index) => {
    const fitLabel = review.fit_rating === 'true-to-size' ? 'True to Size' :
                     review.fit_rating === 'runs-small' ? 'Runs Small' :
                     review.fit_rating === 'runs-large' ? 'Runs Large' : review.fit_rating;

    context += `\nReview ${index + 1}:\n`;
    context += `- Rating: ${review.rating}/5 stars\n`;
    context += `- Fit: ${fitLabel}\n`;
    context += `- Size Worn: ${review.size_worn}\n`;

    if (review.measurements_snapshot) {
      context += `- Reviewer Measurements:`;
      if (review.measurements_snapshot.waist_cm) context += ` Waist ${review.measurements_snapshot.waist_cm}cm`;
      if (review.measurements_snapshot.hips_cm) context += ` | Hips ${review.measurements_snapshot.hips_cm}cm`;
      if (review.measurements_snapshot.bust_cm) context += ` | Bust ${review.measurements_snapshot.bust_cm}cm`;
      if (review.measurements_snapshot.height_cm) context += ` | Height ${review.measurements_snapshot.height_cm}cm`;
      if (review.measurements_snapshot.uk_shoe_size) context += ` | UK Shoe ${review.measurements_snapshot.uk_shoe_size}`;
      context += `\n`;
    }

    context += `- Review: "${review.review_text}"\n`;
  });

  return context;
}
