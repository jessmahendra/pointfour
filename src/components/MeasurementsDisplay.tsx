"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserMeasurements } from "@/types/user";

interface MeasurementsDisplayProps {
  showEditButton?: boolean;
  compact?: boolean;
}

export default function MeasurementsDisplay({
  showEditButton = true,
  compact = false,
}: MeasurementsDisplayProps) {
  const [measurements, setMeasurements] = useState<UserMeasurements | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMeasurements();
  }, []);

  const loadMeasurements = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const { profile } = await response.json();
        setMeasurements(profile?.measurements || null);
      } else if (response.status === 401) {
        setError("Please sign in to view measurements");
      } else {
        setError("Failed to load measurements");
      }
    } catch (err) {
      setError("Failed to load measurements");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatHeight = (height: number) => {
    const feet = Math.floor(height / 30.48);
    const inches = Math.round((height % 30.48) / 2.54);
    return `${height} cm (${feet}'${inches}")`;
  };

  const formatBodyMeasurements = (measurements: any) => {
    if (!measurements) return null;
    const { bust, waist, hips, unit } = measurements;
    const parts = [];

    if (bust) parts.push(`Bust: ${bust}${unit}`);
    if (waist) parts.push(`Waist: ${waist}${unit}`);
    if (hips) parts.push(`Hips: ${hips}${unit}`);

    return parts.length > 0 ? parts.join(", ") : null;
  };

  const formatSizes = (sizes: string[] | undefined) => {
    if (!sizes || sizes.length === 0) return null;
    return sizes.join(", ");
  };

  const formatFitPreference = (preference: string | undefined) => {
    if (!preference) return null;
    return preference
      .replace("-", " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className={`${compact ? "p-3" : "p-4"} bg-gray-50 rounded-lg`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`${
          compact ? "p-3" : "p-4"
        } bg-red-50 border border-red-200 rounded-lg`}
      >
        <p className="text-sm text-red-600">{error}</p>
        {showEditButton && (
          <Link
            href="/measurements"
            className="text-sm text-red-600 hover:text-red-800 underline mt-1 inline-block"
          >
            Set up measurements
          </Link>
        )}
      </div>
    );
  }

  if (
    !measurements ||
    (!measurements.DOB &&
      !measurements.height &&
      !measurements.usualSize?.tops?.length &&
      !measurements.usualSize?.bottoms?.length &&
      !measurements.usualSize?.shoes?.length &&
      !measurements.bodyMeasurements?.bust &&
      !measurements.bodyMeasurements?.waist &&
      !measurements.bodyMeasurements?.hips)
  ) {
    return (
      <div
        className={`${
          compact ? "p-3" : "p-4"
        } bg-blue-50 border border-blue-200 rounded-lg`}
      >
        <p className="text-sm text-blue-600 mb-2">No measurements saved yet</p>
        <p className="text-xs text-blue-500 mb-3">
          Add your measurements to get better size recommendations
        </p>
        {showEditButton && (
          <Link
            href="/measurements"
            className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Measurements
          </Link>
        )}
      </div>
    );
  }

  return (
    <div
      className={`${
        compact ? "p-3" : "p-4"
      } bg-white border border-gray-200 rounded-lg`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3
            className={`${
              compact ? "text-sm" : "text-base"
            } font-medium text-gray-900 mb-2`}
          >
            Your Measurements
          </h3>

          <div className="space-y-2">
            {measurements.DOB && (
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium mr-2">DOB:</span>
                <span>{formatDate(measurements.DOB)}</span>
              </div>
            )}

            {measurements.height && (
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium mr-2">Height:</span>
                <span>{formatHeight(measurements.height)}</span>
              </div>
            )}

            {/* Usual Sizes */}
            {measurements.usualSize && (
              <>
                {measurements.usualSize.tops &&
                  measurements.usualSize.tops.length > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium mr-2">Tops:</span>
                      <span>{formatSizes(measurements.usualSize.tops)}</span>
                    </div>
                  )}

                {measurements.usualSize.bottoms &&
                  measurements.usualSize.bottoms.length > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium mr-2">Bottoms:</span>
                      <span>{formatSizes(measurements.usualSize.bottoms)}</span>
                    </div>
                  )}

                {measurements.usualSize.shoes &&
                  measurements.usualSize.shoes.length > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium mr-2">Shoes:</span>
                      <span>
                        {formatSizes(measurements.usualSize.shoes)} (EU)
                      </span>
                    </div>
                  )}
              </>
            )}

            {/* Fit Preferences */}
            {measurements.fitPreference && (
              <>
                {measurements.fitPreference.tops && (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium mr-2">Tops Fit:</span>
                    <span>
                      {formatFitPreference(measurements.fitPreference.tops)}
                    </span>
                  </div>
                )}

                {measurements.fitPreference.bottoms && (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="font-medium mr-2">Bottoms Fit:</span>
                    <span>
                      {formatFitPreference(measurements.fitPreference.bottoms)}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Body Measurements */}
            {measurements.bodyMeasurements &&
              formatBodyMeasurements(measurements.bodyMeasurements) && (
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium mr-2">Measurements:</span>
                  <span>
                    {formatBodyMeasurements(measurements.bodyMeasurements)}
                  </span>
                </div>
              )}
          </div>
        </div>

        {showEditButton && (
          <Link
            href="/measurements"
            className={`${
              compact ? "text-xs" : "text-sm"
            } text-blue-600 hover:text-blue-800 underline ml-2`}
          >
            Edit
          </Link>
        )}
      </div>

      {!compact && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            These measurements help us provide better size recommendations for
            you.
          </p>
        </div>
      )}
    </div>
  );
}
