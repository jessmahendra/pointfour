import { Suspense } from "react";
import StylePageContent from "./StylePageContent";

interface StylePageProps {
  searchParams: Promise<{
    brand?: string;
    itemName?: string;
    imageUrl?: string;
    pageUrl?: string;
  }>;
}

export default async function StylePage({ searchParams }: StylePageProps) {
  const params = await searchParams;
  return (
    <Suspense fallback={
      <div style={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        backgroundColor: "#F8F7F4" 
      }}>
        <div>Loading...</div>
      </div>
    }>
      <StylePageContent searchParams={params} />
    </Suspense>
  );
}