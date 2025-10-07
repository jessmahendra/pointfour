"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface ReviewSubmissionFormProps {
  productId: string;
  brandId: string;
  productName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewSubmissionForm({
  productId,
  brandId,
  productName,
  onSuccess,
  onCancel,
}: ReviewSubmissionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  const [formData, setFormData] = useState({
    rating: 0,
    fitRating: "",
    reviewText: "",
    sizeWorn: "",
  });

  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);

  const handleRatingClick = (rating: number) => {
    setFormData({ ...formData, rating });
  };

  const handleFitRatingChange = (fitRating: string) => {
    setFormData({ ...formData, fitRating });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (photos.length + files.length > 5) {
      setError("Maximum 5 photos allowed");
      return;
    }

    // Validate file types and sizes
    for (const file of files) {
      if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
        setError("Only JPEG, PNG, and WebP images are allowed");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Each photo must be under 5MB");
        return;
      }
    }

    setPhotos([...photos, ...files]);

    // Create preview URLs
    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
    setPhotoPreviewUrls([...photoPreviewUrls, ...newPreviewUrls]);
    setError(null);
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
    URL.revokeObjectURL(photoPreviewUrls[index]);
    setPhotoPreviewUrls(photoPreviewUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Check authentication
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Validate form
      if (formData.rating === 0) {
        setError("Please select a rating");
        setLoading(false);
        return;
      }

      if (!formData.fitRating) {
        setError("Please select how this item fits");
        setLoading(false);
        return;
      }

      if (!formData.reviewText.trim()) {
        setError("Please write a review");
        setLoading(false);
        return;
      }

      if (!formData.sizeWorn.trim()) {
        setError("Please enter the size you wore");
        setLoading(false);
        return;
      }

      // Upload photos first if any
      let photoUrls: string[] = [];
      if (photos.length > 0) {
        setUploadingPhotos(true);

        for (const photo of photos) {
          const formData = new FormData();
          formData.append("file", photo);
          formData.append("reviewId", "temp"); // Will be moved after review creation

          const uploadResponse = await fetch("/api/reviews/upload-photo", {
            method: "POST",
            body: formData,
          });

          if (!uploadResponse.ok) {
            throw new Error("Failed to upload photo");
          }

          const { url } = await uploadResponse.json();
          photoUrls.push(url);
        }

        setUploadingPhotos(false);
      }

      // Submit review
      const response = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          brandId,
          rating: formData.rating,
          fitRating: formData.fitRating,
          reviewText: formData.reviewText,
          sizeWorn: formData.sizeWorn,
          photos: photoUrls,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit review");
      }

      // Success!
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/products/${productId}?reviewSubmitted=true`);
      }
    } catch (err: any) {
      console.error("Error submitting review:", err);
      setError(err.message || "Failed to submit review. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Write a Review
        </h2>
        <p className="text-gray-600">for {productName}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Overall Rating <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleRatingClick(star)}
              className="text-3xl focus:outline-none"
            >
              {star <= formData.rating ? "★" : "☆"}
            </button>
          ))}
        </div>
      </div>

      {/* Fit Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          How does it fit? <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-3">
          {[
            { value: "runs_small", label: "Runs Small" },
            { value: "true_to_size", label: "True to Size" },
            { value: "runs_large", label: "Runs Large" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleFitRatingChange(option.value)}
              className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                formData.fitRating === option.value
                  ? "border-[#4E4B4B] bg-[#4E4B4B] text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Size Worn */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Size Worn <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.sizeWorn}
          onChange={(e) =>
            setFormData({ ...formData, sizeWorn: e.target.value })
          }
          placeholder="e.g., UK 8, Small, 28W x 32L"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4E4B4B] focus:border-transparent"
        />
      </div>

      {/* Review Text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Review <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.reviewText}
          onChange={(e) =>
            setFormData({ ...formData, reviewText: e.target.value })
          }
          placeholder="Share your experience with fit, comfort, quality, and style..."
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4E4B4B] focus:border-transparent"
        />
      </div>

      {/* Photo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Photos (Optional - Max 5)
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Earn 2 bonus points per photo! Show how the item fits on you.
        </p>

        {photoPreviewUrls.length < 5 && (
          <div className="mb-4">
            <label className="cursor-pointer inline-block px-4 py-2 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-sm text-gray-700">+ Add Photos</span>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>
        )}

        {photoPreviewUrls.length > 0 && (
          <div className="grid grid-cols-5 gap-3">
            {photoPreviewUrls.map((url, index) => (
              <div key={index} className="relative">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading || uploadingPhotos}
          className="flex-1 bg-[#4E4B4B] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#3a3838] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? uploadingPhotos
              ? "Uploading photos..."
              : "Submitting..."
            : "Submit Review"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-3 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>

      <p className="text-sm text-gray-500 text-center">
        You'll earn <strong>10 points</strong> for this review
        {photos.length > 0 && (
          <>
            {" "}
            + <strong>{Math.min(photos.length * 2, 10)} bonus points</strong>{" "}
            for photos
          </>
        )}
        !
      </p>
    </form>
  );
}
