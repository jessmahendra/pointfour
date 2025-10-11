"use client";

import { useState, useEffect } from "react";
import { UserMeasurements } from "@/types/user";

interface MeasurementsFormProps {
  onSave?: (measurements: UserMeasurements) => void;
  skipLoading?: boolean; // New prop to skip loading existing measurements
  skipSaving?: boolean; // New prop to skip saving to database
}

// Size options for UK women's sizing (stored in database)
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

// Size conversion functions
type SizeSystem = "UK" | "US" | "EU";

const convertUKtoUS = (ukSize: string): string => {
  const uk = parseInt(ukSize);
  const us = uk - 4;
  return us >= 0 ? us.toString() : ukSize;
};

const convertUKtoEU = (ukSize: string): string => {
  const uk = parseInt(ukSize);
  const eu = uk + 28;
  return eu.toString();
};

const convertToDisplaySize = (ukSize: string, system: SizeSystem): string => {
  if (system === "UK") return ukSize;
  if (system === "US") return convertUKtoUS(ukSize);
  if (system === "EU") return convertUKtoEU(ukSize);
  return ukSize;
};

const SIZE_SYSTEM_OPTIONS: { value: SizeSystem; label: string }[] = [
  { value: "UK", label: "UK" },
  { value: "US", label: "US" },
  { value: "EU", label: "EU" },
];

// Shoe size conversion map (stored as EU in database)
const SHOE_SIZE_MAP: { eu: string; us: string; uk: string }[] = [
  { eu: "35", us: "4-4.5", uk: "2-2.5" },
  { eu: "36", us: "5-6", uk: "3-4" },
  { eu: "37", us: "6.5-7", uk: "4.5-5" },
  { eu: "38", us: "7.5-8", uk: "5.5-6" },
  { eu: "39", us: "8.5-9", uk: "6.5-7" },
  { eu: "40", us: "9.5-10", uk: "7.5-8" },
  { eu: "41", us: "10.5-11", uk: "8.5-9" },
  { eu: "42", us: "11.5-12", uk: "9.5-10" },
  { eu: "43", us: "12-12.5", uk: "10-10.5" },
  { eu: "44", us: "13", uk: "11" },
  { eu: "45", us: "13.5", uk: "11.5" },
  { eu: "46", us: "14", uk: "12" },
  { eu: "47", us: "14.5", uk: "12.5" },
  { eu: "48", us: "15", uk: "13" },
];

const EU_SHOE_SIZES = SHOE_SIZE_MAP.map(s => s.eu);

const convertShoeSize = (euSize: string, system: SizeSystem): string => {
  const mapping = SHOE_SIZE_MAP.find(s => s.eu === euSize);
  if (!mapping) return euSize;

  if (system === "EU") return mapping.eu;
  if (system === "US") return mapping.us;
  if (system === "UK") return mapping.uk;
  return euSize;
};

const FIT_PREFERENCES = [
  { value: "true-to-size", label: "True to size" },
  { value: "loose-relaxed", label: "Loose/Relaxed" },
  { value: "tight-fitting", label: "Tight-fitting" },
] as const;

type Step = "height" | "tops" | "bottoms" | "shoes" | "birthday" | "preferences" | "body" | "complete";

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
  const [currentStep, setCurrentStep] = useState<Step>("height");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sizeSystem, setSizeSystem] = useState<SizeSystem>("UK");
  const [heightUnit, setHeightUnit] = useState<"cm" | "ft">("cm");
  const [birthdayDay, setBirthdayDay] = useState("");
  const [birthdayMonth, setBirthdayMonth] = useState("");
  const [birthdayYear, setBirthdayYear] = useState("");

  // Load existing measurements on component mount
  useEffect(() => {
    if (!skipLoading) {
      loadMeasurements();
    } else {
      setLoading(false);
    }
  }, [skipLoading]);

  // Sync birthday fields with DOB
  useEffect(() => {
    if (measurements.DOB) {
      const parts = measurements.DOB.split("/");
      if (parts.length === 3) {
        setBirthdayDay(parts[0]);
        setBirthdayMonth(parts[1]);
        setBirthdayYear(parts[2]);
      }
    }
  }, [measurements.DOB]);

  // Update DOB when birthday fields change
  useEffect(() => {
    if (birthdayDay && birthdayMonth && birthdayYear) {
      const dob = `${birthdayDay.padStart(2, "0")}/${birthdayMonth.padStart(2, "0")}/${birthdayYear}`;
      if (dob !== measurements.DOB) {
        setMeasurements((prev) => ({ ...prev, DOB: dob }));
      }
    }
  }, [birthdayDay, birthdayMonth, birthdayYear, measurements.DOB]);

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
            preferredSizingSystem: profile.measurements.preferredSizingSystem,
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
          // Set the size system dropdown to match loaded preference
          if (profile.measurements.preferredSizingSystem) {
            setSizeSystem(profile.measurements.preferredSizingSystem);
          }
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

    // Include the preferred sizing system in measurements
    const measurementsWithSizingSystem = {
      ...measurements,
      preferredSizingSystem: sizeSystem,
    };

    try {
      if (skipSaving) {
        // Skip database saving, just call onSave and complete
        setSuccess("Measurements completed!");
        onSave?.(measurementsWithSizingSystem);
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
          body: JSON.stringify({ measurements: measurementsWithSizingSystem }),
        });

        const data = await response.json();

        if (response.ok) {
          setSuccess("Measurements saved successfully!");
          onSave?.(measurementsWithSizingSystem);
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
    const steps: Step[] = ["height", "tops", "bottoms", "shoes", "birthday", "preferences", "body", "complete"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: Step[] = ["height", "tops", "bottoms", "shoes", "birthday", "preferences", "body", "complete"];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const canProceedFromHeight = measurements.height;
  const canProceedFromTops = (measurements.usualSize?.tops?.length || 0) > 0;
  const canProceedFromBottoms = (measurements.usualSize?.bottoms?.length || 0) > 0;
  const canProceedFromShoes = (measurements.usualSize?.shoes?.length || 0) > 0;
  const canProceedFromBirthday = measurements.DOB;

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
    height: 1,
    tops: 2,
    bottoms: 3,
    shoes: 4,
    birthday: 5,
    preferences: 6,
    body: 7,
    complete: 8,
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border border-stone-300 shadow-lg">
      {/* Progress Indicator - Hidden on complete step */}
      {currentStep !== "complete" && (
        <div className="mb-2">
          <span className="text-sm font-medium" style={{ color: "#6C6A68" }}>
            Step {stepProgress[currentStep]} of 7
          </span>
        </div>
      )}

      {/* Step Content */}
      {currentStep === "height" && (
        <div className="space-y-6">
          <div className="mb-6">
            <h3
              className="text-xl font-semibold mb-2"
              style={{ color: "#4E4B4B" }}
            >
              What&apos;s your height?
            </h3>
            <p className="text-sm" style={{ color: "#6C6A68" }}>
              This helps us provide accurate size recommendations
            </p>
          </div>

          <div className="flex items-center mb-4">
            <div className="flex items-center space-x-3">
              <span
                className={`text-sm font-medium ${heightUnit === "cm" ? "font-semibold" : ""}`}
                style={{ color: "#4E4B4B" }}
              >
                cm
              </span>
              <button
                type="button"
                onClick={() => setHeightUnit(heightUnit === "cm" ? "ft" : "cm")}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor: heightUnit === "ft" ? "#4E4B4B" : "#E9DED5",
                }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    heightUnit === "ft" ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span
                className={`text-sm font-medium ${heightUnit === "ft" ? "font-semibold" : ""}`}
                style={{ color: "#4E4B4B" }}
              >
                ft
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="height"
              className="block text-sm font-medium mb-2"
              style={{ color: "#4E4B4B" }}
            >
              Height ({heightUnit})
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
              placeholder={heightUnit === "cm" ? "166" : "5.5"}
            />
          </div>
        </div>
      )}

      {currentStep === "tops" && (
        <div className="space-y-6">
          <div className="mb-6">
            <h3
              className="text-xl font-semibold mb-2"
              style={{ color: "#4E4B4B" }}
            >
              What&apos;s your tops size?
            </h3>
            <p className="text-sm" style={{ color: "#6C6A68" }}>
              Select all sizes that fit you well
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <label
                className="block text-sm font-semibold"
                style={{ color: "#4E4B4B" }}
              >
                Tops Size
              </label>
              <select
                value={sizeSystem}
                onChange={(e) => setSizeSystem(e.target.value as SizeSystem)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                {SIZE_SYSTEM_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              {UK_TOPS_SIZES.map((ukSize) => {
                const displaySize = convertToDisplaySize(ukSize, sizeSystem);
                return (
                  <button
                    key={ukSize}
                    type="button"
                    onClick={() => {
                      const isSelected =
                        measurements.usualSize?.tops?.includes(ukSize) || false;
                      handleMultiSelectChange("tops", ukSize, !isSelected);
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      measurements.usualSize?.tops?.includes(ukSize)
                        ? "bg-stone-200 text-stone-800"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-150"
                    }`}
                  >
                    {displaySize}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {currentStep === "bottoms" && (
        <div className="space-y-6">
          <div className="mb-6">
            <h3
              className="text-xl font-semibold mb-2"
              style={{ color: "#4E4B4B" }}
            >
              What&apos;s your bottoms size?
            </h3>
            <p className="text-sm" style={{ color: "#6C6A68" }}>
              Select all sizes that fit you well
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <label
                className="block text-sm font-semibold"
                style={{ color: "#4E4B4B" }}
              >
                Bottoms Size
              </label>
              <select
                value={sizeSystem}
                onChange={(e) => setSizeSystem(e.target.value as SizeSystem)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                {SIZE_SYSTEM_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              {UK_BOTTOMS_SIZES.map((ukSize) => {
                const displaySize = convertToDisplaySize(ukSize, sizeSystem);
                return (
                  <button
                    key={ukSize}
                    type="button"
                    onClick={() => {
                      const isSelected =
                        measurements.usualSize?.bottoms?.includes(ukSize) ||
                        false;
                      handleMultiSelectChange("bottoms", ukSize, !isSelected);
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      measurements.usualSize?.bottoms?.includes(ukSize)
                        ? "bg-stone-200 text-stone-800"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-150"
                    }`}
                  >
                    {displaySize}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {currentStep === "shoes" && (
        <div className="space-y-6">
          <div className="mb-6">
            <h3
              className="text-xl font-semibold mb-2"
              style={{ color: "#4E4B4B" }}
            >
              What&apos;s your shoe size?
            </h3>
            <p className="text-sm" style={{ color: "#6C6A68" }}>
              Select your usual shoe size
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <label
                className="block text-sm font-semibold"
                style={{ color: "#4E4B4B" }}
              >
                Shoe Size
              </label>
              <select
                value={sizeSystem}
                onChange={(e) => setSizeSystem(e.target.value as SizeSystem)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                {SIZE_SYSTEM_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              {EU_SHOE_SIZES.map((euSize) => {
                const displaySize = convertShoeSize(euSize, sizeSystem);
                const isSelected = measurements.usualSize?.shoes?.[0] === euSize;
                return (
                  <button
                    key={euSize}
                    type="button"
                    onClick={() => {
                      // Single select - replace the array with just this size
                      setMeasurements({
                        ...measurements,
                        usualSize: {
                          ...measurements.usualSize,
                          shoes: [euSize],
                        },
                      });
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isSelected
                        ? "bg-stone-200 text-stone-800"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-150"
                    }`}
                  >
                    {displaySize}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {currentStep === "birthday" && (
        <div className="space-y-6">
          <div className="mb-6">
            <h3
              className="text-xl font-semibold mb-2"
              style={{ color: "#4E4B4B" }}
            >
              What&apos;s your date of birth?
            </h3>
            <p className="text-sm" style={{ color: "#6C6A68" }}>
              This helps us find reviews from people similar to you
            </p>
          </div>

          <div>
            <fieldset>
              <legend
                className="block text-sm font-medium mb-3"
                style={{ color: "#4E4B4B" }}
              >
                Date of birth
              </legend>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label
                    htmlFor="dob-day"
                    className="block text-xs font-medium mb-1"
                    style={{ color: "#6C6A68" }}
                  >
                    Day
                  </label>
                  <input
                    type="text"
                    id="dob-day"
                    value={birthdayDay}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 2);
                      setBirthdayDay(value);
                      if (error) setError(null);
                      if (success) setSuccess(null);
                    }}
                    maxLength={2}
                    className="w-full px-3 py-2 rounded border transition-colors focus:outline-none text-center"
                    style={{
                      backgroundColor: "#F8F7F4",
                      borderColor: "#E9DED5",
                      color: "#4E4B4B",
                    }}
                    placeholder="DD"
                  />
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="dob-month"
                    className="block text-xs font-medium mb-1"
                    style={{ color: "#6C6A68" }}
                  >
                    Month
                  </label>
                  <input
                    type="text"
                    id="dob-month"
                    value={birthdayMonth}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 2);
                      setBirthdayMonth(value);
                      if (error) setError(null);
                      if (success) setSuccess(null);
                    }}
                    maxLength={2}
                    className="w-full px-3 py-2 rounded border transition-colors focus:outline-none text-center"
                    style={{
                      backgroundColor: "#F8F7F4",
                      borderColor: "#E9DED5",
                      color: "#4E4B4B",
                    }}
                    placeholder="MM"
                  />
                </div>
                <div className="flex-[1.5]">
                  <label
                    htmlFor="dob-year"
                    className="block text-xs font-medium mb-1"
                    style={{ color: "#6C6A68" }}
                  >
                    Year
                  </label>
                  <input
                    type="text"
                    id="dob-year"
                    value={birthdayYear}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setBirthdayYear(value);
                      if (error) setError(null);
                      if (success) setSuccess(null);
                    }}
                    maxLength={4}
                    className="w-full px-3 py-2 rounded border transition-colors focus:outline-none text-center"
                    style={{
                      backgroundColor: "#F8F7F4",
                      borderColor: "#E9DED5",
                      color: "#4E4B4B",
                    }}
                    placeholder="YYYY"
                  />
                </div>
              </div>
            </fieldset>
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
                className={`text-sm font-medium ${measurements.bodyMeasurements?.unit === "cm" ? "font-semibold" : ""}`}
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
                    measurements.bodyMeasurements?.unit === "in"
                      ? "#4E4B4B"
                      : "#E9DED5",
                }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    measurements.bodyMeasurements?.unit === "in"
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
              <span
                className={`text-sm font-medium ${measurements.bodyMeasurements?.unit === "in" ? "font-semibold" : ""}`}
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
        {currentStep === "height" && (
          <button
            type="button"
            onClick={nextStep}
            disabled={!canProceedFromHeight}
            className="w-full px-8 py-3 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-black hover:bg-stone-800 text-white disabled:bg-stone-400"
          >
            Next
          </button>
        )}

        {currentStep === "tops" && (
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
              disabled={!canProceedFromTops}
              className="flex-1 ml-4 px-8 py-3 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-black hover:bg-stone-800 text-white disabled:bg-stone-400"
            >
              Next
            </button>
          </div>
        )}

        {currentStep === "bottoms" && (
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
              disabled={!canProceedFromBottoms}
              className="flex-1 ml-4 px-8 py-3 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-black hover:bg-stone-800 text-white disabled:bg-stone-400"
            >
              Next
            </button>
          </div>
        )}

        {currentStep === "shoes" && (
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
              disabled={!canProceedFromShoes}
              className="flex-1 ml-4 px-8 py-3 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-black hover:bg-stone-800 text-white disabled:bg-stone-400"
            >
              Next
            </button>
          </div>
        )}

        {currentStep === "birthday" && (
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
              disabled={!canProceedFromBirthday}
              className="flex-1 ml-4 px-8 py-3 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-black hover:bg-stone-800 text-white disabled:bg-stone-400"
            >
              Next
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
              Next
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
