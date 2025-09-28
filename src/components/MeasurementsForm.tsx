"use client";

import { useState, useEffect } from "react";
import { UserMeasurements } from "@/types/user";

interface MeasurementsFormProps {
  onSave?: (measurements: UserMeasurements) => void;
  skipLoading?: boolean; // New prop to skip loading existing measurements
  skipSaving?: boolean; // New prop to skip saving to database
}

// Size options for UK women's sizing
const UK_TOPS_SIZES = [
  "4",
  "6",
  "8",
  "10",
  "12",
  "14",
  "16",
  "18",
  "20",
  "22",
  "24",
  "26",
  "28",
  "30",
  "32",
];
const UK_BOTTOMS_SIZES = [
  "4",
  "6",
  "8",
  "10",
  "12",
  "14",
  "16",
  "18",
  "20",
  "22",
  "24",
  "26",
  "28",
  "30",
  "32",
];
const EU_SHOE_SIZES = [
  "35",
  "36",
  "37",
  "38",
  "39",
  "40",
  "41",
  "42",
  "43",
  "44",
  "45",
  "46",
  "47",
  "48",
];

const FIT_PREFERENCES = [
  { value: "true-to-size", label: "True to size" },
  { value: "loose-relaxed", label: "Loose/Relaxed" },
  { value: "tight-fitting", label: "Tight-fitting" },
] as const;

type Step = "basic" | "sizes" | "preferences" | "body" | "complete";

export default function MeasurementsForm({
  onSave,
  skipLoading = false,
  skipSaving = false,
}: MeasurementsFormProps) {
  const [measurements, setMeasurements] = useState<UserMeasurements>({
    DOB: "",
    height: undefined,
    usualSize: {
      tops: [],
      bottoms: [],
      shoes: [],
    },
    fitPreference: {
      tops: undefined,
      bottoms: undefined,
    },
    bodyMeasurements: {
      bust: undefined,
      waist: undefined,
      hips: undefined,
      unit: "cm",
    },
  });
  const [currentStep, setCurrentStep] = useState<Step>("basic");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load existing measurements on component mount
  useEffect(() => {
    if (!skipLoading) {
      loadMeasurements();
    } else {
      setLoading(false);
    }
  }, [skipLoading]);

  const loadMeasurements = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const { profile } = await response.json();
        if (profile?.measurements) {
          setMeasurements({
            DOB: profile.measurements.DOB || "",
            height: profile.measurements.height || undefined,
            usualSize: {
              tops: profile.measurements.usualSize?.tops || [],
              bottoms: profile.measurements.usualSize?.bottoms || [],
              shoes: profile.measurements.usualSize?.shoes || [],
            },
            fitPreference: {
              tops: profile.measurements.fitPreference?.tops,
              bottoms: profile.measurements.fitPreference?.bottoms,
            },
            bodyMeasurements: {
              bust: profile.measurements.bodyMeasurements?.bust,
              waist: profile.measurements.bodyMeasurements?.waist,
              hips: profile.measurements.bodyMeasurements?.hips,
              unit: profile.measurements.bodyMeasurements?.unit || "cm",
            },
          });
        }
      } else if (response.status === 401) {
        setError("Please sign in to view your measurements");
      } else {
        setError("Failed to load measurements");
      }
    } catch {
      setError("Failed to load measurements");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (skipSaving) {
        // Skip database saving, just call onSave and complete
        setSuccess("Measurements completed!");
        onSave?.(measurements);
        setCurrentStep("complete");
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        // Normal flow - save to database
        const response = await fetch("/api/user/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ measurements }),
        });

        const data = await response.json();

        if (response.ok) {
          setSuccess("Measurements saved successfully!");
          onSave?.(measurements);
          setCurrentStep("complete");
          // Clear success message after 3 seconds
          setTimeout(() => setSuccess(null), 3000);
        } else {
          setError(data.error || "Failed to save measurements");
          if (data.details) {
            setError(data.details.join(", "));
          }
        }
      }
    } catch {
      setError("Failed to save measurements");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (
    field: keyof UserMeasurements,
    value: string | number
  ) => {
    setMeasurements((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear messages when user starts typing
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleMultiSelectChange = (
    category: "tops" | "bottoms" | "shoes",
    size: string,
    checked: boolean
  ) => {
    setMeasurements((prev) => ({
      ...prev,
      usualSize: {
        ...prev.usualSize,
        [category]: checked
          ? [...(prev.usualSize?.[category] || []), size]
          : (prev.usualSize?.[category] || []).filter((s) => s !== size),
      },
    }));
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleFitPreferenceChange = (
    category: "tops" | "bottoms",
    value: "true-to-size" | "loose-relaxed" | "tight-fitting"
  ) => {
    setMeasurements((prev) => ({
      ...prev,
      fitPreference: {
        ...prev.fitPreference,
        [category]: value,
      },
    }));
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleBodyMeasurementChange = (
    field: "bust" | "waist" | "hips",
    value: number | undefined
  ) => {
    setMeasurements((prev) => ({
      ...prev,
      bodyMeasurements: {
        ...prev.bodyMeasurements,
        [field]: value,
      },
    }));
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const toggleMeasurementUnit = () => {
    setMeasurements((prev) => ({
      ...prev,
      bodyMeasurements: {
        ...prev.bodyMeasurements,
        unit: prev.bodyMeasurements?.unit === "cm" ? "in" : "cm",
      },
    }));
  };

  const nextStep = () => {
    const steps: Step[] = ["basic", "sizes", "preferences", "body", "complete"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: Step[] = ["basic", "sizes", "preferences", "body", "complete"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const canProceedFromBasic = measurements.DOB && measurements.height;
  const canProceedFromSizes =
    (measurements.usualSize?.tops?.length || 0) > 0 ||
    (measurements.usualSize?.bottoms?.length || 0) > 0 ||
    (measurements.usualSize?.shoes?.length || 0) > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
            style={{ borderColor: "#EBE6E2" }}
          ></div>
          <span style={{ color: "#6C6A68" }}>Loading measurements...</span>
        </div>
      </div>
    );
  }

  const stepProgress = {
    basic: 1,
    sizes: 2,
    preferences: 3,
    body: 4,
    complete: 5,
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border border-stone-300 shadow-lg">
      {/* Progress Indicator - Hidden on complete step */}
      {currentStep !== "complete" && (
        <div className="mb-2">
          <span className="text-sm font-medium" style={{ color: "#6C6A68" }}>
            Step {stepProgress[currentStep]} of 4
          </span>
        </div>
      )}

      {/* Step Content */}
      {currentStep === "basic" && (
        <div className="space-y-6">
          <div className="mb-6">
            <h3
              className="text-xl font-semibold mb-2"
              style={{ color: "#4E4B4B" }}
            >
              Your details
            </h3>
          </div>

          <div className="space-y-6">
            {/* Date of Birth */}
            <div>
              <label
                htmlFor="dob"
                className="block text-sm font-medium mb-2"
                style={{ color: "#4E4B4B" }}
              >
                Date of birth
              </label>
              <input
                type="date"
                id="dob"
                value={measurements.DOB || ""}
                onChange={(e) => handleInputChange("DOB", e.target.value)}
                className="w-full px-3 py-2 rounded border transition-colors focus:outline-none"
                style={{
                  backgroundColor: "#F8F7F4",
                  borderColor: "#E9DED5",
                  color: "#4E4B4B",
                }}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* Height */}
            <div>
              <label
                htmlFor="height"
                className="block text-sm font-medium mb-2"
                style={{ color: "#4E4B4B" }}
              >
                Height
              </label>
              <input
                type="number"
                id="height"
                value={measurements.height || ""}
                onChange={(e) =>
                  handleInputChange(
                    "height",
                    e.target.value ? Number(e.target.value) : 0
                  )
                }
                min="50"
                max="300"
                step="0.1"
                className="w-full px-3 py-2 rounded border transition-colors focus:outline-none"
                style={{
                  backgroundColor: "#F8F7F4",
                  borderColor: "#E9DED5",
                  color: "#4E4B4B",
                }}
                placeholder="166 cm"
              />
            </div>
          </div>
        </div>
      )}

      {currentStep === "sizes" && (
        <div className="space-y-6">
          <div className="mb-6">
            <h3
              className="text-xl font-semibold mb-2"
              style={{ color: "#4E4B4B" }}
            >
              Your Usual Sizes
            </h3>
            <p className="text-sm" style={{ color: "#6C6A68" }}>
              Click on the sizes that fit you well (you can select multiple
              sizes)
            </p>
          </div>

          <div className="space-y-8">
            {/* Tops Size */}
            <div>
              <label
                className="block text-sm font-semibold mb-4"
                style={{ color: "#4E4B4B" }}
              >
                Tops Size (UK)
              </label>
              <div className="flex flex-wrap gap-2">
                {UK_TOPS_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      const isSelected =
                        measurements.usualSize?.tops?.includes(size) || false;
                      handleMultiSelectChange("tops", size, !isSelected);
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      measurements.usualSize?.tops?.includes(size)
                        ? "bg-stone-200 text-stone-800"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-150"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottoms Size */}
            <div>
              <label
                className="block text-sm font-semibold mb-4"
                style={{ color: "#4E4B4B" }}
              >
                Bottoms Size (UK)
              </label>
              <div className="flex flex-wrap gap-2">
                {UK_BOTTOMS_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      const isSelected =
                        measurements.usualSize?.bottoms?.includes(size) ||
                        false;
                      handleMultiSelectChange("bottoms", size, !isSelected);
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      measurements.usualSize?.bottoms?.includes(size)
                        ? "bg-stone-200 text-stone-800"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-150"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Shoe Size */}
            <div>
              <label
                className="block text-sm font-semibold mb-4"
                style={{ color: "#4E4B4B" }}
              >
                Shoe Size (EU)
              </label>
              <div className="flex flex-wrap gap-2">
                {EU_SHOE_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      const isSelected =
                        measurements.usualSize?.shoes?.includes(size) || false;
                      handleMultiSelectChange("shoes", size, !isSelected);
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      measurements.usualSize?.shoes?.includes(size)
                        ? "bg-stone-200 text-stone-800"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-150"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === "preferences" && (
        <div className="space-y-6">
          <div className="mb-6">
            <h3
              className="text-xl font-semibold mb-2"
              style={{ color: "#4E4B4B" }}
            >
              Fit Preferences (Optional)
            </h3>
            <p className="text-sm" style={{ color: "#6C6A68" }}>
              Tell us about your preferred fit style
            </p>
          </div>

          <div className="space-y-6">
            {/* Tops Fit Preference */}
            <div>
              <label
                className="block text-sm font-semibold mb-3"
                style={{ color: "#4E4B4B" }}
              >
                Tops Fit Preference
              </label>
              <select
                value={measurements.fitPreference?.tops || ""}
                onChange={(e) =>
                  handleFitPreferenceChange(
                    "tops",
                    e.target.value as
                      | "true-to-size"
                      | "loose-relaxed"
                      | "tight-fitting"
                  )
                }
                className="w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none"
                style={{
                  backgroundColor: "#F8F7F4",
                  borderColor: measurements.fitPreference?.tops
                    ? "#EBE6E2"
                    : "#E9DED5",
                  color: "#4E4B4B",
                }}
              >
                <option value="">Select preference</option>
                {FIT_PREFERENCES.map((pref) => (
                  <option key={pref.value} value={pref.value}>
                    {pref.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Bottoms Fit Preference */}
            <div>
              <label
                className="block text-sm font-semibold mb-3"
                style={{ color: "#4E4B4B" }}
              >
                Bottoms Fit Preference
              </label>
              <select
                value={measurements.fitPreference?.bottoms || ""}
                onChange={(e) =>
                  handleFitPreferenceChange(
                    "bottoms",
                    e.target.value as
                      | "true-to-size"
                      | "loose-relaxed"
                      | "tight-fitting"
                  )
                }
                className="w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none"
                style={{
                  backgroundColor: "#F8F7F4",
                  borderColor: measurements.fitPreference?.bottoms
                    ? "#EBE6E2"
                    : "#E9DED5",
                  color: "#4E4B4B",
                }}
              >
                <option value="">Select preference</option>
                {FIT_PREFERENCES.map((pref) => (
                  <option key={pref.value} value={pref.value}>
                    {pref.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {currentStep === "body" && (
        <div className="space-y-6">
          <div className="mb-6">
            <h3
              className="text-xl font-semibold mb-2"
              style={{ color: "#4E4B4B" }}
            >
              Body Measurements (Optional)
            </h3>
            <p className="text-sm" style={{ color: "#6C6A68" }}>
              These measurements help us provide more accurate size
              recommendations
            </p>
          </div>

          <div className="flex items-center mb-6">
            <div className="flex items-center space-x-3">
              <span
                className="text-sm font-medium"
                style={{ color: "#4E4B4B" }}
              >
                cm
              </span>
              <button
                type="button"
                onClick={toggleMeasurementUnit}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor:
                    measurements.bodyMeasurements?.unit === "cm"
                      ? "#EBE6E2"
                      : "#E9DED5",
                }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    measurements.bodyMeasurements?.unit === "cm"
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
              <span
                className="text-sm font-medium"
                style={{ color: "#4E4B4B" }}
              >
                in
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bust */}
            <div>
              <label
                className="block text-sm font-semibold mb-3"
                style={{ color: "#4E4B4B" }}
              >
                Bust ({measurements.bodyMeasurements?.unit || "cm"})
              </label>
              <input
                type="number"
                value={measurements.bodyMeasurements?.bust || ""}
                onChange={(e) =>
                  handleBodyMeasurementChange(
                    "bust",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                min="0"
                step="0.1"
                className="w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none"
                style={{
                  backgroundColor: "#F8F7F4",
                  borderColor: measurements.bodyMeasurements?.bust
                    ? "#EBE6E2"
                    : "#E9DED5",
                  color: "#4E4B4B",
                }}
                placeholder={`Enter bust measurement in ${
                  measurements.bodyMeasurements?.unit || "cm"
                }`}
              />
            </div>

            {/* Waist */}
            <div>
              <label
                className="block text-sm font-semibold mb-3"
                style={{ color: "#4E4B4B" }}
              >
                Waist ({measurements.bodyMeasurements?.unit || "cm"})
              </label>
              <input
                type="number"
                value={measurements.bodyMeasurements?.waist || ""}
                onChange={(e) =>
                  handleBodyMeasurementChange(
                    "waist",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                min="0"
                step="0.1"
                className="w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none"
                style={{
                  backgroundColor: "#F8F7F4",
                  borderColor: measurements.bodyMeasurements?.waist
                    ? "#EBE6E2"
                    : "#E9DED5",
                  color: "#4E4B4B",
                }}
                placeholder={`Enter waist measurement in ${
                  measurements.bodyMeasurements?.unit || "cm"
                }`}
              />
            </div>

            {/* Hips */}
            <div>
              <label
                className="block text-sm font-semibold mb-3"
                style={{ color: "#4E4B4B" }}
              >
                Hips ({measurements.bodyMeasurements?.unit || "cm"})
              </label>
              <input
                type="number"
                value={measurements.bodyMeasurements?.hips || ""}
                onChange={(e) =>
                  handleBodyMeasurementChange(
                    "hips",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                min="0"
                step="0.1"
                className="w-full px-4 py-3 rounded-lg border-2 transition-colors focus:outline-none"
                style={{
                  backgroundColor: "#F8F7F4",
                  borderColor: measurements.bodyMeasurements?.hips
                    ? "#EBE6E2"
                    : "#E9DED5",
                  color: "#4E4B4B",
                }}
                placeholder={`Enter hips measurement in ${
                  measurements.bodyMeasurements?.unit || "cm"
                }`}
              />
            </div>
          </div>
        </div>
      )}

      {currentStep === "complete" && (
        <div className="text-center space-y-8">
          <div className="mb-8">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#EBE6E2" }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h3
              className="text-2xl font-semibold mb-3"
              style={{ color: "#4E4B4B" }}
            >
              All Set!
            </h3>
            <p className="text-sm" style={{ color: "#6C6A68" }}>
              Your measurements have been saved successfully. We&apos;ll use
              this information to provide better size recommendations.
            </p>
          </div>

          {skipSaving ? (
            // Loading state for analyze page flow
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center space-x-2">
                <div
                  className="animate-spin rounded-full h-6 w-6 border-b-2"
                  style={{ borderColor: "#4E4B4B" }}
                ></div>
                <span className="text-sm" style={{ color: "#6C6A68" }}>
                  Taking you to your personalized recommendations...
                </span>
              </div>
            </div>
          ) : (
            // Button for regular measurements page
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => (window.location.href = "/analyze")}
                className="px-8 py-3 rounded-lg text-sm font-semibold transition-colors bg-black hover:bg-stone-800 text-white"
              >
                Start New Search
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          className="rounded-lg p-4 mb-6"
          style={{
            backgroundColor: "#F8F7F4",
            border: "1px solid #9F513A",
          }}
        >
          <p className="text-sm font-medium" style={{ color: "#9F513A" }}>
            {error}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-6">
        {currentStep === "basic" && (
          <button
            type="button"
            onClick={nextStep}
            disabled={!canProceedFromBasic}
            className="w-full px-8 py-3 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-black hover:bg-stone-800 text-white disabled:bg-stone-400"
          >
            Continue
          </button>
        )}

        {currentStep === "sizes" && (
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={prevStep}
              className="px-4 py-3 rounded-lg text-sm font-medium transition-colors bg-stone-100 hover:bg-stone-200 text-stone-700"
            >
              Back
            </button>
            <button
              type="button"
              onClick={nextStep}
              disabled={!canProceedFromSizes}
              className="flex-1 ml-4 px-8 py-3 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-black hover:bg-stone-800 text-white disabled:bg-stone-400"
            >
              Continue
            </button>
          </div>
        )}

        {currentStep === "preferences" && (
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={prevStep}
              className="px-4 py-3 rounded-lg text-sm font-medium transition-colors bg-stone-100 hover:bg-stone-200 text-stone-700"
            >
              Back
            </button>
            <button
              type="button"
              onClick={nextStep}
              className="flex-1 ml-4 px-8 py-3 rounded-lg text-sm font-semibold transition-colors bg-black hover:bg-stone-800 text-white"
            >
              Continue
            </button>
          </div>
        )}

        {currentStep === "body" && (
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={prevStep}
              className="px-4 py-3 rounded-lg text-sm font-medium transition-colors bg-stone-100 hover:bg-stone-200 text-stone-700"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 ml-4 px-8 py-3 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-black hover:bg-stone-800 text-white disabled:bg-stone-400"
            >
              {saving ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </span>
              ) : (
                "Save Measurements"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
