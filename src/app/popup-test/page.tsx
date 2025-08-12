"use client";
import { useState } from "react";

export default function PopupTestPage() {
  const [brandCheckResult, setBrandCheckResult] = useState<string>("");
  const [reviewsResult, setReviewsResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [testBrand, setTestBrand] = useState("GANNI");
  const [testItem, setTestItem] = useState("Margo T-shirt");

  const testBrandCheck = async () => {
    setLoading(true);
    setBrandCheckResult("Testing...");

    try {
      const response = await fetch("/api/extension/check-brand", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ brand: testBrand }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setBrandCheckResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setBrandCheckResult(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const testReviewsFetch = async () => {
    setLoading(true);
    setReviewsResult("Testing...");

    try {
      const response = await fetch("/api/extension/get-reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brand: testBrand,
          itemName: testItem,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setReviewsResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setReviewsResult(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const testCORSConnection = async () => {
    setLoading(true);
    setBrandCheckResult("Testing CORS...");

    try {
      const response = await fetch("/api/extension/test", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setBrandCheckResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setBrandCheckResult(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Popup Test Page
        </h1>

        {/* Test Configuration */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Test Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Brand
              </label>
              <input
                type="text"
                value={testBrand}
                onChange={(e) => setTestBrand(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., GANNI, Reformation"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Item
              </label>
              <input
                type="text"
                value={testItem}
                onChange={(e) => setTestItem(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Margo T-shirt, Val Jeans"
              />
            </div>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Test Brand Detection
          </h2>
          <p className="text-gray-600 mb-4">
            This page simulates a {testBrand} product page
          </p>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={testCORSConnection}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Testing..." : "Test CORS Connection"}
            </button>

            <button
              onClick={testBrandCheck}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Testing..." : "Test Brand Check"}
            </button>

            <button
              onClick={testReviewsFetch}
              disabled={loading}
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Testing..." : "Test Reviews Fetch"}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Brand Check Results */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Brand Check Results
            </h3>
            <div className="bg-gray-100 rounded-md p-4 h-64 overflow-y-auto">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                {brandCheckResult ||
                  "No results yet. Click 'Test Brand Check' to start."}
              </pre>
            </div>
          </div>

          {/* Reviews Fetch Results */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Reviews Fetch Results
            </h3>
            <div className="bg-gray-100 rounded-md p-4 h-64 overflow-y-auto">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                {reviewsResult ||
                  "No results yet. Click 'Test Reviews Fetch' to start."}
              </pre>
            </div>
          </div>
        </div>

        {/* Debug Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Debug Information
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>Server URL:</strong> http://localhost:3000
            </p>
            <p>
              <strong>API Endpoints:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>/api/extension/test - CORS test endpoint</li>
              <li>/api/extension/check-brand - Brand data endpoint</li>
              <li>/api/extension/get-reviews - Reviews endpoint</li>
            </ul>
            <p>
              <strong>Expected Behavior:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Brand Check: Should return brand data and review count</li>
              <li>
                Reviews Fetch: Should return reviews for specific brand/item
                combination
              </li>
              <li>
                Fuzzy Matching: Should handle item name variations (e.g.,
                &quot;Val Jeans&quot; vs &quot;Val 90s Mid Rise Straight
                Jeans&quot;)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
