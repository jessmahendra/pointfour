"use client";

import { useState, useEffect } from "react";
import { UserMeasurements } from "@/types/user";

interface MeasurementsFormProps {
  onSave?: (measurements: UserMeasurements) => void;
  onCancel?: () => void;
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

export default function MeasurementsForm({
  onSave,
  onCancel,
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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load existing measurements on component mount
  useEffect(() => {
    loadMeasurements();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
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
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || "Failed to save measurements");
        if (data.details) {
          setError(data.details.join(", "));
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading measurements...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Your Measurements & Sizing
      </h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date of Birth */}
            <div>
              <label
                htmlFor="dob"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Date of Birth
              </label>
              <input
                type="date"
                id="dob"
                value={measurements.DOB || ""}
                onChange={(e) => handleInputChange("DOB", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                max={new Date().toISOString().split("T")[0]}
              />
              <p className="mt-1 text-xs text-gray-500">
                Helps us provide age-appropriate recommendations
              </p>
            </div>

            {/* Height */}
            <div>
              <label
                htmlFor="height"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Height (cm)
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your height in centimeters"
              />
              <p className="mt-1 text-xs text-gray-500">
                Height range: 50-300 cm
              </p>
            </div>
          </div>
        </div>

        {/* Usual Sizes */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Usual Sizes (UK Women&apos;s)
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Select all sizes that fit you (you can be between sizes)
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tops Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tops Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                {UK_TOPS_SIZES.map((size) => (
                  <label key={size} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={
                        measurements.usualSize?.tops?.includes(size) || false
                      }
                      onChange={(e) =>
                        handleMultiSelectChange("tops", size, e.target.checked)
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{size}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Bottoms Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Bottoms Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                {UK_BOTTOMS_SIZES.map((size) => (
                  <label key={size} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={
                        measurements.usualSize?.bottoms?.includes(size) || false
                      }
                      onChange={(e) =>
                        handleMultiSelectChange(
                          "bottoms",
                          size,
                          e.target.checked
                        )
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{size}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Shoe Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Shoe Size (EU)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {EU_SHOE_SIZES.map((size) => (
                  <label key={size} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={
                        measurements.usualSize?.shoes?.includes(size) || false
                      }
                      onChange={(e) =>
                        handleMultiSelectChange("shoes", size, e.target.checked)
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{size}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Fit Preferences */}
        <div className="border-b border-gray-200 pb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Fit Preferences (Optional)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tops Fit Preference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tops Fit Preference
              </label>
              <select
                value={measurements.fitPreference?.tops || ""}
                onChange={(e) =>
                  handleFitPreferenceChange("tops", e.target.value as "true-to-size" | "loose-relaxed" | "tight-fitting")
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bottoms Fit Preference
              </label>
              <select
                value={measurements.fitPreference?.bottoms || ""}
                onChange={(e) =>
                  handleFitPreferenceChange("bottoms", e.target.value as "true-to-size" | "loose-relaxed" | "tight-fitting")
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

        {/* Body Measurements */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Body Measurements (Optional)
            </h3>
            <button
              type="button"
              onClick={toggleMeasurementUnit}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              {measurements.bodyMeasurements?.unit === "cm"
                ? "Switch to inches"
                : "Switch to cm"}
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            These measurements help us provide more accurate size
            recommendations
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bust */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bust
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Enter bust measurement in ${
                  measurements.bodyMeasurements?.unit || "cm"
                }`}
              />
            </div>

            {/* Waist */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Waist
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Enter waist measurement in ${
                  measurements.bodyMeasurements?.unit || "cm"
                }`}
              />
            </div>

            {/* Hips */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hips
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Enter hips measurement in ${
                  measurements.bodyMeasurements?.unit || "cm"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Future measurements note */}
      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Coming Soon</h3>
        <p className="text-xs text-blue-700">
          We&apos;re working on adding more measurement fields like weight, chest,
          waist, and hips to provide even better size recommendations.
        </p>
      </div>
    </div>
  );
}
