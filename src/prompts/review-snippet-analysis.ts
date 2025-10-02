/**
 * Review Snippet Analysis Prompt
 * Used for extracting key points from review titles and snippets
 */

export interface ReviewSnippetVariables {
  brand: string;
  title: string;
  snippet: string;
}

export const REVIEW_SNIPPET_ANALYSIS_SYSTEM_PROMPT = 
  "You are an expert at extracting specific pros/cons from product reviews. Provide concrete bullet points about user experiences.";

export function buildReviewSnippetAnalysisPrompt(variables: ReviewSnippetVariables): string {
  const { brand, title, snippet } = variables;

  return `Based on this review title and snippet, extract 2-3 key points about the reviewer's actual experience with the ${brand} product. Focus on specific pros/cons, not just restating that it's a review.

Title: ${title}
Snippet: ${snippet}

Format as bullet points like:
• Runs small, ordered size up and fit perfectly
• Fabric is stretchy and comfortable for all-day wear
• Quality construction, no issues after multiple washes

OR for negative experiences:
• Heavy for travel, shoulder straps uncomfortable
• Great organization but too many pockets

Focus on concrete experiences like comfort, durability, functionality, value, etc. If insufficient information, return just the title without "Review of" prefix.`;
}
