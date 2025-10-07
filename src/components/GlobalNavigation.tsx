"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";

export default function GlobalNavigation() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [email, setEmail] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (event === "SIGNED_IN") {
        setShowAuthModal(false);
        setMessage("");
        setEmail("");
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setMessage("");

    try {
      // Determine the correct base URL for magic link redirects
      let baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

      // If NEXT_PUBLIC_BASE_URL is not set, determine it based on environment
      if (!baseUrl) {
        if (process.env.NODE_ENV === "development") {
          // Development: use localhost:3001
          baseUrl = "http://localhost:3001";
        } else {
          // Production: use the actual domain from window.location
          const currentOrigin = window.location.origin;
          if (currentOrigin.includes("localhost")) {
            // Fallback if somehow still localhost in production
            baseUrl = "https://pointfour.in";
          } else {
            baseUrl = currentOrigin;
          }
        }
      }

      const redirectUrl = `${baseUrl}/auth/callback`;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });
      if (error) throw error;
      setMessage("Check your email for the magic link!");
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setAuthLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserDropdown) {
        const target = event.target as Element;
        if (!target.closest(".user-dropdown")) {
          setShowUserDropdown(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserDropdown]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
    }
  };

  // Don't show GlobalNavigation on landing page
  if (pathname === "/") {
    return null;
  }

  return (
    <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-normal text-black" style={{ fontFamily: 'Crimson Pro, serif', fontWeight: 300 }}>
              woven
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/analyze"
              className="text-stone-600 hover:text-stone-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Review a Brand
            </Link>
            <Link
              href="/directory"
              className="text-stone-600 hover:text-stone-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Directory
            </Link>
          </div>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="w-20 h-8 bg-stone-200 animate-pulse rounded"></div>
            ) : user ? (
              <div className="relative user-dropdown">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-2 text-sm text-stone-600 hover:text-stone-900 transition-colors"
                >
                  <div className="w-8 h-8 bg-stone-200 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-stone-600">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span>{user.email}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      showUserDropdown ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-stone-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-stone-100">
                      <p className="text-sm font-medium text-stone-900">
                        {user.email}
                      </p>
                    </div>
                    <Link
                      href="/measurements"
                      className="block px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                      onClick={() => setShowUserDropdown(false)}
                    >
                      Measurements
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setShowUserDropdown(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-black hover:bg-stone-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-stone-900">
                Sign in to Pointfour
              </h2>
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  setMessage("");
                  setEmail("");
                }}
                className="text-stone-400 hover:text-stone-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <p className="text-stone-600 text-sm">
                Enter your email address and we&apos;ll send you a magic link to
                sign in. No password required!
              </p>
            </div>

            <form onSubmit={handleMagicLink} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-stone-700 mb-1"
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>

              {message && (
                <div
                  className={`text-sm p-3 rounded-md ${
                    message.includes("Check your email") ||
                    message.includes("success")
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading || !email}
                className="w-full bg-black hover:bg-stone-800 disabled:bg-stone-400 text-white py-2 px-4 rounded-md font-medium transition-colors"
              >
                {authLoading ? "Sending magic link..." : "Send magic link"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-stone-500">
                We&apos;ll create an account for you if you don&apos;t have one
                yet.
              </p>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
