"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";

interface SaveProfileButtonProps {
  className?: string;
}

export function SaveProfileButton({ className = "" }: SaveProfileButtonProps) {
  const [user, setUser] = useState<User | null>(null);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [signupMessage, setSignupMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(true);

  const supabase = createClient();

  // Check authentication state and listen for changes
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setAuthLoading(false);
    };

    checkAuth();

    // Listen for auth state changes (including magic link sign-ins)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("SaveProfileButton: Auth state changed", {
        event,
        user: session?.user?.email,
      });
      setUser(session?.user ?? null);
      setAuthLoading(false);

      // Close modal if user successfully signs in
      if (session?.user) {
        setShowSignupModal(false);
        setSignupMessage("");
        setSignupEmail("");
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // Don't show button if user is authenticated or still loading
  if (authLoading || user) {
    return null;
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail.trim()) return;

    setSignupLoading(true);
    setSignupMessage("");

    try {
      // Use environment variable for base URL, fallback to current origin
      let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;

      // Only fix localhost port in development
      if (
        process.env.NODE_ENV === "development" &&
        baseUrl.includes("localhost:3000")
      ) {
        baseUrl = baseUrl.replace("localhost:3000", "localhost:3001");
      }

      const redirectUrl = `${baseUrl}/auth/callback?next=${window.location.pathname}`;

      console.log("SaveProfileButton: Sending magic link", {
        email: signupEmail.trim(),
        redirectUrl,
      });

      const { error } = await supabase.auth.signInWithOtp({
        email: signupEmail.trim(),
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        throw error;
      }

      setSignupMessage("Check your email for the sign-in link!");
    } catch (error) {
      console.error("Error sending magic link:", error);
      setSignupMessage("Something went wrong. Please try again.");
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowSignupModal(true)}
        className={`inline-flex items-center px-3 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-900 transition-colors border border-gray-700 ${className}`}
        title="Save your measurements for faster searches"
      >
        <svg
          className="mr-1.5 w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
          />
          <polyline points="17,21 17,13 7,13 7,21" />
          <polyline points="7,3 7,8 15,8" />
        </svg>
        Save Profile
      </button>

      {/* Signup Modal */}
      {showSignupModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              padding: "32px",
              maxWidth: "400px",
              width: "100%",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: "600",
                  color: "#333",
                  margin: 0,
                }}
              >
                Save Your Measurements
              </h2>
              <button
                onClick={() => setShowSignupModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "4px",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <p
                style={{
                  fontSize: "14px",
                  color: "#666",
                  lineHeight: "1.5",
                  margin: "0 0 16px 0",
                }}
              >
                Create an account to save your measurements. This is the
                quickest way to do another search with your measurements already
                filled in, giving you the most tailored results every time.
              </p>

              <div
                style={{
                  backgroundColor: "#F8F7F4",
                  padding: "16px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                }}
              >
                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: "500",
                    color: "#333",
                    margin: "0 0 8px 0",
                  }}
                >
                  Benefits of saving your profile:
                </p>
                <ul
                  style={{
                    fontSize: "12px",
                    color: "#666",
                    lineHeight: "1.4",
                    margin: 0,
                    paddingLeft: "16px",
                  }}
                >
                  <li>Skip measurement forms on future searches</li>
                  <li>Get instant personalized recommendations</li>
                  <li>Save time on every new search</li>
                  <li>Most accurate sizing advice</li>
                </ul>
              </div>
            </div>

            <form onSubmit={handleSignup}>
              <div style={{ marginBottom: "20px" }}>
                <label
                  htmlFor="email"
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#333",
                    marginBottom: "8px",
                  }}
                >
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: "14px",
                    border: "1px solid #D8D6D5",
                    borderRadius: "8px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {signupMessage && (
                <div
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    marginBottom: "20px",
                    fontSize: "13px",
                    backgroundColor: signupMessage.includes("Check your email")
                      ? "#D1FAE5"
                      : "#FEE2E2",
                    color: signupMessage.includes("Check your email")
                      ? "#065F46"
                      : "#DC2626",
                  }}
                >
                  {signupMessage}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowSignupModal(false)}
                  style={{
                    padding: "10px 16px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#666",
                    backgroundColor: "transparent",
                    border: "1px solid #D8D6D5",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }}
                >
                  Maybe later
                </button>
                <button
                  type="submit"
                  disabled={signupLoading || !signupEmail.trim()}
                  style={{
                    padding: "10px 20px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#FFFFFF",
                    backgroundColor:
                      signupLoading || !signupEmail.trim() ? "#D8D6D5" : "#333",
                    border: "none",
                    borderRadius: "8px",
                    cursor:
                      signupLoading || !signupEmail.trim()
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {signupLoading ? "Sending..." : "Send sign-in link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
