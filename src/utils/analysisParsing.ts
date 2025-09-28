import { AnalysisResult, ParsedAnalysisData } from "../types/analysis";

export const parseAnalysisData = (analysisResult: AnalysisResult): ParsedAnalysisData => {
  // Extract brand name from the query
  const brandName = analysisResult.query || "Unknown Brand";
  
  // Check if we have limited data (no database data and no external data)
  const brandNotFound = !analysisResult.hasDatabaseData;
  const hasExternalData = analysisResult.hasExternalData || false;
  
  return {
    brandName,
    isLimitedData: brandNotFound && !hasExternalData,
    dataSource: analysisResult.dataSource || "no_data",
    hasExternalData,
  };
};

export const getSearchTypeLabel = (searchType?: string) => {
  const searchTypeLabels = {
    hybrid: "🔍 Hybrid: Database + Web Search",
    external: "🌐 External: Web Search Only",
    database: "📊 Database: Database Only",
    fallback: "⚠️ Fallback: No Data Available",
  };

  return searchTypeLabels[searchType as keyof typeof searchTypeLabels] || searchType;
};

export const getConfidenceColor = (confidence: "high" | "medium" | "low") => {
  const colors = {
    high: "#10B981", // green
    medium: "#F59E0B", // yellow
    low: "#EF4444", // red
  };
  return colors[confidence];
};

export const getConfidenceLabel = (confidence: "high" | "medium" | "low") => {
  const labels = {
    high: "High Confidence",
    medium: "Medium Confidence", 
    low: "Low Confidence",
  };
  return labels[confidence];
};
