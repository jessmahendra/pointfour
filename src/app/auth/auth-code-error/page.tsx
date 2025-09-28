"use client";

import Link from "next/link";

export default function AuthCodeError() {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 mb-2">
            Authentication Error
          </h1>
          <p className="text-stone-600">
            There was an error signing you in. This could be due to an invalid or expired authentication code.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-stone-800 transition-colors"
          >
            Return Home
          </Link>
          <div>
            <button
              onClick={() => window.location.reload()}
              className="text-stone-600 hover:text-stone-800 underline"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
