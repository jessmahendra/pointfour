"use client";
import React from "react";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

interface UserProfileFormProps {
  simpleQuery: string;
  setSimpleQuery: React.Dispatch<React.SetStateAction<string>>;
  parsedData: string | null;
  parsingLoading: boolean;
  navigating: boolean;
  handleSimpleFormSubmit: () => void;
  router: AppRouterInstance;
  setNavigating: React.Dispatch<React.SetStateAction<boolean>>;
}

export const UserProfileForm: React.FC<UserProfileFormProps> = ({
  simpleQuery,
  setSimpleQuery,
  parsedData,
  parsingLoading,
  navigating,
  handleSimpleFormSubmit,
  router,
  setNavigating,
}) => {
  return (
    <div className="max-w-md mx-auto">
      <div className="mb-8 text-center">
        <p className="text-base text-gray-600 m-0 leading-snug">
          Get personalized sizing and fit advice
        </p>
      </div>

      {/* Simple Product Parser Form */}
      <div className="mb-8">
        <div className="bg-white p-8 rounded-2xl border border-stone-300 shadow-lg">
          <h2 className="text-base font-medium text-gray-800 mb-2">
            What are you thinking about buying?
          </h2>
          <p className="text-gray-600 mb-6 text-sm">
            Enter a product name you&apos;re interested in. Don&apos;t worry
            about typos!
          </p>
          <div className="space-y-4">
            <input
              type="text"
              value={simpleQuery}
              onChange={(e) => setSimpleQuery(e.target.value)}
              placeholder="e.g., khaite danielle jeans, frame le slim palazzo"
              className="w-full p-3 text-sm bg-stone-50 border border-stone-300 rounded-lg outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-400"
              onKeyPress={(e) => e.key === "Enter" && handleSimpleFormSubmit()}
            />
            <button
              onClick={handleSimpleFormSubmit}
              disabled={parsingLoading || navigating || !simpleQuery.trim()}
              className={`w-full p-4 text-base font-semibold border-none rounded-lg transition-all duration-200 ${
                !parsingLoading && !navigating && simpleQuery.trim()
                  ? "text-white bg-black hover:bg-gray-800 cursor-pointer"
                  : "text-gray-400 bg-gray-200 cursor-not-allowed"
              }`}
            >
              {parsingLoading
                ? "Parsing..."
                : navigating
                ? "Navigating..."
                : "Parse"}
            </button>
          </div>
        </div>
        {/* Loading State */}
        {parsingLoading && (
          <div className="mt-6 flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-600 mx-auto mb-4"></div>
              <p className="text-stone-600 text-sm">Finding your product...</p>
            </div>
          </div>
        )}

        {/* Navigation State for Signed-in Users */}
        {navigating && !parsedData && (
          <div className="mt-6 flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-blue-600 text-sm">
                Taking you to the product page...
              </p>
            </div>
          </div>
        )}

        {/* Success State - Simple and Clean */}
        {parsedData && !parsingLoading && (
          <div className="mt-6">
            {(() => {
              try {
                const result = JSON.parse(parsedData);
                return (
                  <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-sm">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-6 h-6 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-stone-800 mb-2">
                        Found your product!
                      </h3>
                      <p className="text-stone-600 mb-4">
                        <span className="font-medium">
                          {result.parsedData?.brandName}
                        </span>{" "}
                        - {result.parsedData?.productName}
                      </p>
                      {navigating ? (
                        <div className="flex items-center justify-center gap-2 text-blue-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm">
                            Taking you to the product page...
                          </span>
                        </div>
                      ) : result.product?.id ? (
                        <button
                          onClick={() => {
                            setNavigating(true);
                            router.push(`/products/${result.product.id}`);
                          }}
                          className="px-6 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors text-sm font-medium"
                        >
                          View Product Details →
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              } catch {
                return (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 text-sm">
                      Sorry, we couldn&apos;t find that product. Please try
                      again.
                    </p>
                  </div>
                );
              }
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
