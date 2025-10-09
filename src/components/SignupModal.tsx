"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignupSuccess: () => void;
}

export function SignupModal({ isOpen, onClose, onSignupSuccess }: SignupModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const supabase = createClient();

  if (!isOpen) return null;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) throw signUpError;

      setEmailSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-stone-300 shadow-lg max-w-md w-full p-8">
        {!emailSent ? (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-2" style={{ color: "#4E4B4B" }}>
                Save your size, skip the typing
              </h2>
              <p className="text-base" style={{ color: "#6C6A68" }}>
                Create an account to save your measurements and skip filling them out next time
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: "#4E4B4B" }}>
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-3 text-sm bg-stone-50 border border-stone-300 rounded-lg outline-none focus:ring-1 focus:ring-stone-400 focus:border-stone-400"
                  placeholder="your@email.com"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 p-3 text-sm font-medium border border-stone-300 rounded-lg transition-colors"
                  style={{ color: "#6C6A68" }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#F5F5F4"}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  Skip for now
                </button>
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="flex-1 p-3 text-sm font-semibold text-white bg-black rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800"
                >
                  {loading ? "Creating account..." : "Start searching"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
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
              <h2 className="text-2xl font-semibold mb-2" style={{ color: "#4E4B4B" }}>
                Check your email
              </h2>
              <p className="text-sm mb-4" style={{ color: "#6C6A68" }}>
                We&apos;ve sent a verification link to <strong>{email}</strong>
              </p>
              <p className="text-xs" style={{ color: "#9CA3AF" }}>
                Click the link in the email to verify your account and save your measurements
              </p>
            </div>

            <button
              onClick={() => {
                onSignupSuccess();
                onClose();
              }}
              className="w-full p-3 text-sm font-semibold text-white bg-black rounded-lg hover:bg-gray-800 transition-all"
            >
              Continue
            </button>
          </>
        )}
      </div>
    </div>
  );
}
