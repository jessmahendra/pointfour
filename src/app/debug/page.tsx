"use client";

import { useState } from "react";

interface ApiTestResult {
  endpoint: string;
  status: "loading" | "success" | "error";
  data?: Record<string, string>;
  error?: string;
  timestamp: string;
}

export default function DebugPage() {
  const [results, setResults] = useState<ApiTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const endpoints = [
    "/api/garment-types",
    "/api/body-types",
    "/api/price-ranges",
    "/api/brands",
    "/api/reviews",
  ];

  const testEndpoint = async (endpoint: string): Promise<ApiTestResult> => {
    try {
      console.log(`🔍 Testing ${endpoint}...`);
      const response = await fetch(endpoint);
      const data = await response.json();

      if (response.ok) {
        return {
          endpoint,
          status: "success",
          data,
          timestamp: new Date().toISOString(),
        };
      } else {
        return {
          endpoint,
          status: "error",
          error: data.error || data.details || `HTTP ${response.status}`,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        endpoint,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);

    for (const endpoint of endpoints) {
      const result = await testEndpoint(endpoint);
      setResults((prev) => [...prev, result]);

      // Add a small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setIsRunning(false);
  };

  const testRecommendations = async () => {
    const testPreferences = {
      style: "Casual",
      bodyType: "Petite",
      budget: 500,
      occasion: "Everyday",
      colors: ["Black"],
      size: "M",
    };

    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testPreferences),
      });

      const data = await response.json();

      const result: ApiTestResult = {
        endpoint: "/api/recommendations (POST)",
        status: response.ok ? "success" : "error",
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : data.error || data.details,
        timestamp: new Date().toISOString(),
      };

      setResults((prev) => [...prev, result]);
    } catch (error) {
      const result: ApiTestResult = {
        endpoint: "/api/recommendations (POST)",
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      };
      setResults((prev) => [...prev, result]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Airtable Debug Page
        </h1>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Environment Check</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="font-medium">API Key:</span>
              <span className="ml-2 text-sm text-gray-600">
                {process.env.NEXT_PUBLIC_AIRTABLE_API_KEY
                  ? "✅ Set (Public)"
                  : "❌ Not set (Public)"}
              </span>
            </div>
            <div>
              <span className="font-medium">Base ID:</span>
              <span className="ml-2 text-sm text-gray-600">
                {process.env.NEXT_PUBLIC_AIRTABLE_BASE_ID
                  ? "✅ Set (Public)"
                  : "❌ Not set (Public)"}
              </span>
            </div>
            <div>
              <span className="font-medium">Brands Table:</span>
              <span className="ml-2 text-sm text-gray-600">
                {process.env.NEXT_PUBLIC_AIRTABLE_BRANDS_TABLE || "Not set"}
              </span>
            </div>
            <div>
              <span className="font-medium">Reviews Table:</span>
              <span className="ml-2 text-sm text-gray-600">
                {process.env.NEXT_PUBLIC_AIRTABLE_REVIEWS_TABLE || "Not set"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">API Tests</h2>

          <div className="flex gap-4 mb-6">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isRunning ? "Running Tests..." : "Run All Tests"}
            </button>

            <button
              onClick={testRecommendations}
              disabled={isRunning}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Test Recommendations
            </button>
          </div>

          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.status === "success"
                    ? "bg-green-50 border-green-200"
                    : result.status === "error"
                    ? "bg-red-50 border-red-200"
                    : "bg-yellow-50 border-yellow-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{result.endpoint}</h3>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      result.status === "success"
                        ? "bg-green-100 text-green-800"
                        : result.status === "error"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {result.status.toUpperCase()}
                  </span>
                </div>

                <div className="text-sm text-gray-600 mb-2">
                  {result.timestamp}
                </div>

                {result.status === "success" && result.data && (
                  <div className="bg-white p-3 rounded border">
                    <h4 className="font-medium mb-2">Response Data:</h4>
                    <pre className="text-xs overflow-auto max-h-40">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}

                {result.status === "error" && result.error && (
                  <div className="bg-red-100 p-3 rounded border border-red-300">
                    <h4 className="font-medium text-red-800 mb-2">Error:</h4>
                    <p className="text-red-700 text-sm">{result.error}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Troubleshooting</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              • Check that your .env.local file contains the correct Airtable
              credentials
            </p>
            <p>
              • Verify that your Airtable base is accessible and contains the
              expected tables
            </p>
            <p>• Ensure the table names match exactly (case-sensitive)</p>
            <p>
              • Check the browser console and server logs for detailed error
              messages
            </p>
            <p>
              • Restart the development server after making changes to
              .env.local
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
