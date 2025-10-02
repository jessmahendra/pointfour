/**
 * Centralized Prompt Management
 * All LLM prompts are organized here for easy access and modification
 */

// Fashion Expert Review Analysis
export {
  FASHION_EXPERT_REVIEW_ANALYSIS_SYSTEM_PROMPT,
  buildFashionExpertReviewAnalysisPrompt,
  buildItemContext,
  buildCategoryContext,
  buildDirectFitContext,
  type ReviewAnalysisVariables
} from './fashion-expert-review-analysis';

// Fashion Recommendations
export {
  FASHION_RECOMMENDATIONS_SYSTEM_PROMPT,
  buildFashionRecommendationsPrompt,
  buildUserContext,
  type FashionRecommendationVariables
} from './fashion-recommendations';

// Product Parsing
export {
  PRODUCT_PARSING_SYSTEM_PROMPT,
  buildProductParsingPrompt,
  extractProductQuery,
  type ProductParsingVariables
} from './product-parsing';

// Review Snippet Analysis
export {
  REVIEW_SNIPPET_ANALYSIS_SYSTEM_PROMPT,
  buildReviewSnippetAnalysisPrompt,
  type ReviewSnippetVariables
} from './review-snippet-analysis';

// Fashion Expert Test Prompts
export {
  FASHION_EXPERT_STRUCTURED_SYSTEM_PROMPT,
  FASHION_EXPERT_GENERAL_SYSTEM_PROMPT,
  buildFashionExpertTestPrompt
} from './fashion-expert-test';

// Default System Prompts
export {
  DEFAULT_ASSISTANT_SYSTEM_PROMPT,
  DEFAULT_STRUCTURED_DATA_SYSTEM_PROMPT
} from './default-system-prompts';
