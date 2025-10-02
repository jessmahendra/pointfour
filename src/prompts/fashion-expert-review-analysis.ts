/**
 * Fashion Expert Review Analysis Prompt
 * Used for analyzing customer reviews to provide structured insights about brands and products
 */

export interface ReviewAnalysisVariables {
  brand: string;
  category: string;
  itemName?: string;
  itemContext?: string;
  categoryContext?: string;
  directFitContext?: string;
  reviewTexts: string;
}

export const FASHION_EXPERT_REVIEW_ANALYSIS_SYSTEM_PROMPT = 
  "You are a fashion expert who analyzes customer reviews to provide structured insights. Always return valid JSON and be specific and actionable in your analysis.";

export function buildFashionExpertReviewAnalysisPrompt(variables: ReviewAnalysisVariables): string {
  const { brand, category, itemContext = '', categoryContext = '', directFitContext = '', reviewTexts } = variables;
  
  const sizingSection = (category === 'bags' || category === 'accessories') ? '' : `  "sizingAdvice": {
    "detailedGuidance": "Comprehensive sizing advice including: how the brand runs (small/large/true to size), fabric stretch characteristics, length considerations, body type recommendations, and specific fit details like waist, bust, hips, shoulders, sleeves, etc.",
    "sizeChartInsights": "Analysis of size chart data and how it relates to customer experiences, including measurements that matter most and any discrepancies between chart and actual fit",
    "confidence": "low|medium|high",
    "evidence": ["Direct quotes about sizing experiences, fit issues, stretch, length, and specific body measurements"]
  },`;

  const categoryInstructions = (category === 'bags' || category === 'accessories') 
    ? 'DO NOT include fit/sizing analysis as it does not apply to bags/accessories. Focus on quality, materials, and functionality instead.'
    : 'Include fit analysis as it applies to clothing/footwear.';

  return `You are a fashion expert analyzing customer reviews to provide structured insights. Your goal is to extract useful insights even from limited data, rather than returning empty analysis.

Brand: ${brand}
Category: ${category}${itemContext}${categoryContext}${directFitContext}

CRITICAL: This is a ${category} product. ${categoryInstructions}

Reviews to analyze:
${reviewTexts}

Please analyze these reviews and return a JSON object with the following structure:
{
  "personalSummary": {
    "brandIntroduction": "Brief 1-2 sentence introduction about the brand based on customer reviews and general knowledge",
    "tailoredRecommendation": "Specific recommendation based on user's body shape and size, incorporating size chart data and review insights",
    "confidence": "low|medium|high",
    "evidence": ["Direct quotes from reviews supporting the recommendation"]
  },
  "quality": {
    "overallQuality": "Assessment of the brand's overall quality based on customer feedback",
    "postWashCare": "Information about how items hold up after washing and care instructions from customer experiences",
    "confidence": "low|medium|high", 
    "evidence": ["Direct quotes about quality, durability, and care experiences"]
  },
${sizingSection}
  "userReviews": {
    "supportingQuotes": ["Key customer quotes that support the analysis above"],
    "sourceLinks": ["URLs of the sources where quotes were found"],
    "confidence": "low|medium|high"
  },
  "overallConfidence": "low|medium|high"
}

IMPORTANT GUIDELINES:
- ALWAYS try to provide SOME analysis rather than completely empty sections
- If you find ANY customer feedback patterns, include them even with low confidence
- Use direct quotes from reviews as evidence, but also paraphrase customer sentiment when helpful
- Be specific and actionable in recommendations when possible
- For sizing advice, extract specific details about: fabric stretch, length, body type fit, measurements, and how items fit different body shapes
- Look for mentions of: "stretchy", "non-stretchy", "runs short/long", "petite", "plus-size", "athletic build", "waist", "bust", "hips", "shoulders", "sleeves", "inseam", "length"
- For limited data, focus on what customers ARE saying rather than what's missing
- If only 1-2 reviews mention something, still include it but mark confidence as "low"
- Extract insights from review titles and snippets even if not perfectly detailed
- Better to provide cautious insights than no insights at all
- Focus on customer experiences, not brand descriptions
- For userReviews section, include actual quotes with their source URLs
- Make personalSummary tailored to the specific user context when possible
- AVOID DUPLICATE INFORMATION: Each section should provide unique insights - don't repeat the same information across sections
- Personal Summary should focus on brand introduction and tailored recommendations
- Quality section should focus on materials, construction, and care instructions
- Sizing Advice should focus on fit patterns, size chart analysis, fabric stretch, length, and specific body measurements
- For sizing advice, be extremely specific about: fabric stretch (stretchy vs non-stretchy), length (short/tall considerations), body type recommendations (petite, plus-size, athletic), and specific fit areas (waist, bust, hips, shoulders, sleeves, inseam, etc.)
- Include specific measurements and sizing comparisons when available in reviews
- User Reviews should provide supporting quotes that back up the other sections
- Return valid JSON only, no other text`;
}

export function buildItemContext(isSpecificItem: boolean, itemName: string, brand: string): string {
  return isSpecificItem && itemName 
    ? `\nFocus specifically on reviews about the "${itemName}" item from ${brand}.`
    : `\nAnalyze reviews about ${brand} products in general.`;
}

export function buildCategoryContext(category: string): string {
  return category !== 'general' 
    ? `\nThis is a ${category} brand, so focus on ${category}-specific aspects.`
    : '';
}

export function buildDirectFitContext(directFitAdvice?: { hasDirectAdvice: boolean; advice: string[] }): string {
  return directFitAdvice?.hasDirectAdvice 
    ? `\n\nIMPORTANT: Direct fit advice found on product page: "${directFitAdvice.advice.join(', ')}". This should take priority over conflicting review analysis. Use this as the primary fit recommendation unless reviews strongly contradict it.`
    : '';
}
