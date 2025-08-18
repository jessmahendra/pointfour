"use client";

import { useState } from "react";

export default function TestImageExtractionSimple() {
  const [testUrl, setTestUrl] = useState(
    "https://www.reformation.com/en-us/product/oversized-soft-merino-t-shirt-mid-grey-melange/REFRM0001.html"
  );
  const [result, setResult] = useState<{
    pageUrl: string;
    bestImage?: { src: string; alt: string; selector: string };
    images?: Array<{
      src: string;
      alt: string;
      selector: string;
      score: number;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testExtraction = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/extension/extract-product-images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pageUrl: testUrl }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      setResult(data);
      console.log("✅ Extraction result:", data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("❌ Extraction failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Simple Image Extraction Test</h1>

      <div style={{ marginBottom: "20px" }}>
        <label
          htmlFor="testUrl"
          style={{ display: "block", marginBottom: "8px" }}
        >
          Test URL:
        </label>
        <input
          id="testUrl"
          type="url"
          value={testUrl}
          onChange={(e) => setTestUrl(e.target.value)}
          style={{
            width: "100%",
            padding: "12px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "16px",
          }}
        />
      </div>

      <button
        onClick={testExtraction}
        disabled={loading}
        style={{
          padding: "12px 24px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: "16px",
          marginBottom: "20px",
        }}
      >
        {loading ? "Testing..." : "Test Extraction"}
      </button>

      {error && (
        <div
          style={{
            padding: "12px",
            backgroundColor: "#f8d7da",
            color: "#721c24",
            border: "1px solid #f5c6cb",
            borderRadius: "4px",
            marginBottom: "20px",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{ marginBottom: "20px" }}>
          <h2>Extraction Result:</h2>
          <pre
            style={{
              backgroundColor: "#f8f9fa",
              padding: "16px",
              borderRadius: "4px",
              overflow: "auto",
              fontSize: "14px",
            }}
          >
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div
        style={{
          marginTop: "40px",
          padding: "20px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
        }}
      >
        <h3>Debug Information:</h3>
        <p>
          This test will help identify if the image extraction API is working
          correctly.
        </p>
        <p>
          Check the browser console and server logs for detailed information.
        </p>
      </div>
    </div>
  );
}
