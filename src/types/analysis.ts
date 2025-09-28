export interface UserProfile {
  ukClothingSize: string;
  ukShoeSize: string;
  bodyShape: string;
  height: string;
  fitPreference: string;
  footType: string;
  category: string;
}

export interface Review {
  sizeBought: string;
  usualSize: string;
  fitRating: number;
  fitComments: string;
  wouldRecommend: string;
  userBodyType: string;
}

export interface ExternalSearchReview {
  title: string;
  snippet: string;
  url: string;
  source: string;
  tags: string[];
  confidence: "high" | "medium" | "low";
  brandLevel: boolean;
  fullContent: string;
  isFallback?: boolean;
}

export interface GroupedReviews {
  primary: ExternalSearchReview[];
  community: ExternalSearchReview[];
  blogs: ExternalSearchReview[];
  videos: ExternalSearchReview[];
  social: ExternalSearchReview[];
  publications: ExternalSearchReview[];
  other: ExternalSearchReview[];
}

export interface BrandFitSummary {
  summary: string | null;
  confidence: "high" | "medium" | "low";
  sources: string[];
  totalResults: number;
  sections?: {
    personalSummary?: {
      brandIntroduction: string;
      tailoredRecommendation: string;
      confidence: "high" | "medium" | "low";
      evidence: string[];
    };
    quality?: {
      overallQuality: string;
      postWashCare: string;
      confidence: "high" | "medium" | "low";
      evidence: string[];
    };
    sizingAdvice?: {
      detailedGuidance: string;
      sizeChartInsights: string;
      confidence: "high" | "medium" | "low";
      evidence: string[];
    };
    userReviews?: {
      supportingQuotes: string[];
      sourceLinks: string[];
      confidence: "high" | "medium" | "low";
    };
    // Legacy sections for backward compatibility
    [key: string]: unknown;
  };
}

export interface ExternalSearchResults {
  brandFitSummary: BrandFitSummary | null;
  reviews: ExternalSearchReview[];
  groupedReviews: GroupedReviews;
  totalResults: number;
  isDynamic?: boolean;
  isFallback?: boolean;
}

export interface AnalysisResult {
  recommendation: string;
  query: string;
  totalBrands: number;
  hasDatabaseData?: boolean;
  hasExternalData?: boolean;
  searchType?: "database" | "hybrid" | "external" | "fallback" | "llm";
  dataSource?: "database" | "web_search" | "hybrid_data" | "no_data" | "llm_service";
  externalSearchResults?: ExternalSearchResults | null;
  llmInteraction?: {
    id: string;
    model: string;
    duration: number;
    tokens?: {
      prompt: number;
      completion: number;
      total: number;
    };
    timestamp: string;
  };
}

export interface ParsedAnalysisData {
  brandName: string;
  isLimitedData: boolean;
  dataSource: string;
  hasExternalData: boolean;
}
