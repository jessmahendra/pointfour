"use client";
import React from "react";
import Link from "next/link";
import { UserProfile } from "../types/analysis";

interface UserProfileFormProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  brandQuery: string;
  setBrandQuery: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
  onSubmit: () => void;
}

export const UserProfileForm: React.FC<UserProfileFormProps> = ({
  userProfile,
  setUserProfile,
  brandQuery,
  setBrandQuery,
  loading,
  onSubmit,
}) => {
  const isFootwear = userProfile.category === "footwear";
  const showSpecificFields = userProfile.category !== "";

  const buttonEnabled =
    !loading &&
    brandQuery.trim() &&
    userProfile.category &&
    (isFootwear || userProfile.fitPreference) && // Don't require fitPreference for footwear
    ((isFootwear && userProfile.footType) ||
      (!isFootwear && userProfile.bodyShape));

  return (
    <div style={{ maxWidth: "480px", margin: "0 auto" }}>
      <div style={{ marginBottom: "32px", textAlign: "center" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "16px",
          }}
        >
          <Link href="/">
            <svg
              width="93"
              height="24"
              viewBox="0 0 62 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ cursor: "pointer" }}
            >
              <path
                d="M4.20631 6.53813L3.45431 11.0021C3.83831 11.2261 4.20631 11.2901 4.63831 11.2901C6.09431 11.2901 7.10231 9.65813 7.10231 7.57813C7.10231 6.36213 6.57431 5.69013 5.74231 5.69013C5.15031 5.69013 4.62231 6.07413 4.20631 6.53813ZM4.27031 5.89813H4.33431C4.84631 5.03413 5.48631 4.65013 6.38231 4.65013C7.71031 4.65013 8.59031 5.59413 8.59031 7.30613C8.59031 9.96213 6.97431 11.9461 4.47831 11.9461C3.88631 11.9461 3.48631 11.8021 3.32631 11.7221L2.84631 14.3781L3.96631 14.6821L3.75831 15.1461H0.654312V14.6981L1.40631 14.4261L2.95831 5.69013C2.47831 5.53013 1.99831 5.80213 1.69431 6.13813L1.47031 5.89813C1.66231 5.32213 2.19031 4.65013 3.19831 4.65013C4.07831 4.65013 4.36631 5.11413 4.27031 5.89813ZM12.6003 11.2741C13.8803 11.2741 14.5203 9.49813 14.6163 7.99413C14.6323 7.81813 14.6323 7.64213 14.6323 7.48213C14.6323 6.09013 14.2643 5.32213 13.3843 5.32213C12.1043 5.32213 11.4643 7.09813 11.3683 8.60213C11.3523 8.77813 11.3523 8.95413 11.3523 9.11413C11.3523 10.5061 11.7203 11.2741 12.6003 11.2741ZM12.5843 11.9461C10.7923 11.9461 9.86431 10.6661 9.86431 8.92213C9.86431 6.71413 11.0003 4.65013 13.4003 4.65013C15.1923 4.65013 16.1203 5.93013 16.1203 7.67413C16.1203 9.88213 14.9843 11.9461 12.5843 11.9461ZM19.8756 6.26613L19.0916 10.8741C19.5716 11.0341 20.0676 10.7621 20.3716 10.4261L20.6116 10.6661C20.4196 11.2421 19.8756 11.9461 18.8676 11.9461C18.0196 11.9461 17.7156 11.4981 17.7156 10.8901C17.7156 10.7621 17.7316 10.5701 17.7796 10.2821L18.5636 5.69013C18.0836 5.53013 17.6196 5.80213 17.3156 6.13813L17.0756 5.89813C17.2676 5.32213 17.8116 4.65013 18.8196 4.65013C19.6676 4.65013 19.9396 5.09813 19.9396 5.70613C19.9396 5.83413 19.9076 6.07413 19.8756 6.26613ZM18.5796 2.58613C18.5796 2.02613 19.0116 1.59413 19.5716 1.59413C20.1316 1.59413 20.5636 2.02613 20.5636 2.58613C20.5636 3.14613 20.1316 3.57813 19.5716 3.57813C19.0116 3.57813 18.5796 3.14613 18.5796 2.58613ZM26.1713 10.2821L26.7153 7.11413C26.8753 6.21813 26.6353 5.85013 25.9793 5.85013C25.4513 5.85013 24.8273 6.23413 24.3153 6.61813L23.4353 11.7861H22.0113L23.0673 5.69013C22.5873 5.53013 22.1073 5.80213 21.8033 6.13813L21.5793 5.89813C21.7713 5.32213 22.2993 4.65013 23.3073 4.65013C24.3313 4.65013 24.4913 5.30613 24.3473 6.10613H24.4113C25.1153 5.00213 25.9633 4.65013 26.6833 4.65013C27.4993 4.65013 28.2353 5.13013 28.2353 6.20213C28.2353 6.45813 28.2033 6.63413 28.1713 6.84213L27.4833 10.8741C27.9633 11.0341 28.4593 10.7621 28.7633 10.4261L29.0033 10.6661C28.8113 11.2421 28.2673 11.9461 27.2593 11.9461C26.4113 11.9461 26.1073 11.4981 26.1073 10.8901C26.1073 10.7621 26.1233 10.5701 26.1713 10.2821ZM30.2762 5.56213L30.3562 5.14613L32.6122 2.93813H33.0442L32.7082 4.81013H34.8042L34.5642 5.56213H32.5962L31.8922 9.51413C31.8602 9.67413 31.8122 9.94613 31.8122 10.2181C31.8122 10.7621 32.1482 10.9221 32.6922 10.9221C33.0922 10.9221 33.5082 10.7941 33.9082 10.5541L34.0522 10.8581C33.5882 11.5461 32.6922 11.9461 31.8922 11.9461C31.0602 11.9461 30.3562 11.5141 30.3562 10.5221C30.3562 10.3141 30.3882 10.0421 30.4362 9.77013L31.2842 5.56213H30.2762ZM35.0179 13.1301L36.2979 5.56213H35.1299L35.2419 5.00213L36.4739 4.74613L36.6659 3.83413C37.0979 1.77013 38.4099 0.810132 39.8339 0.810132C40.7459 0.810132 41.6259 1.14613 41.6259 2.05813C41.6259 2.60213 41.2579 2.98613 40.7619 2.98613C40.2979 2.98613 39.8979 2.66613 39.8979 2.13813C39.8979 1.85013 40.0419 1.56213 40.2339 1.41813C40.1059 1.38613 39.9779 1.37013 39.8499 1.37013C38.8739 1.37013 38.2819 2.39413 37.9779 4.09013L37.8499 4.81013H39.7699L39.5299 5.56213H37.7059L36.6179 12.0901C36.2979 13.9621 35.3859 15.3061 33.4979 15.3061C32.7779 15.3061 32.3299 14.8901 32.3299 14.3461C32.3299 13.7381 32.7139 13.4501 33.1939 13.4501C33.6739 13.4501 33.9459 13.7861 33.9459 14.2661C33.9459 14.5061 33.8659 14.7141 33.7219 14.8261C34.2979 14.8261 34.8099 14.3141 35.0179 13.1301ZM42.2878 11.2741C43.5678 11.2741 44.2078 9.49813 44.3038 7.99413C44.3198 7.81813 44.3198 7.64213 44.3198 7.48213C44.3198 6.09013 43.9518 5.32213 43.0718 5.32213C41.7918 5.32213 41.1518 7.09813 41.0558 8.60213C41.0398 8.77813 41.0398 8.95413 41.0398 9.11413C41.0398 10.5061 41.4078 11.2741 42.2878 11.2741ZM42.2718 11.9461C40.4798 11.9461 39.5518 10.6661 39.5518 8.92213C39.5518 6.71413 40.6878 4.65013 43.0878 4.65013C44.8798 4.65013 45.8078 5.93013 45.8078 7.67413C45.8078 9.88213 44.6718 11.9461 42.2718 11.9461ZM53.6751 4.81013L52.6191 10.8741C53.0991 11.0341 53.5791 10.7621 53.8831 10.4261L54.1231 10.6661C53.9311 11.2421 53.3871 11.9461 52.3791 11.9461C51.3551 11.9461 51.2111 11.2901 51.3551 10.4901H51.2911C50.5871 11.5941 49.7231 11.9461 49.0031 11.9461C48.0751 11.9461 47.2431 11.3861 47.5151 9.75413L48.1871 5.69013C47.7071 5.53013 47.2271 5.80213 46.9231 6.13813L46.6831 5.89813C46.8751 5.32213 47.4191 4.65013 48.4271 4.65013C49.4511 4.65013 49.6911 5.30613 49.5471 6.10613L48.9231 9.75413C48.7951 10.4741 48.9391 10.9061 49.5151 10.9061C50.1551 10.9061 50.8271 10.4741 51.3711 9.97813L52.2191 4.93813L53.6751 4.81013ZM57.8793 6.10613L57.7833 6.69813H57.8473C58.4393 5.14613 59.1433 4.65013 59.9913 4.65013C60.6473 4.65013 61.0793 5.01813 61.0793 5.67413C61.0793 6.33013 60.6793 6.71413 60.0553 6.71413C59.4953 6.71413 59.1753 6.36213 59.1753 5.73813C58.6953 6.02613 58.2153 6.71413 57.6233 7.78613L56.9353 11.7861H55.5113L56.5673 5.69013C56.0873 5.53013 55.6073 5.80213 55.3033 6.13813L55.0793 5.89813C55.2713 5.32213 55.7993 4.65013 56.8073 4.65013C57.8313 4.65013 57.9913 5.30613 57.8793 6.10613Z"
                fill="black"
                fillOpacity="0.5"
              />
            </svg>
          </Link>
        </div>
        <p
          style={{
            fontSize: "16px",
            color: "#666",
            margin: 0,
            lineHeight: "1.4",
          }}
        >
          Get personalized sizing and fit advice
        </p>
      </div>

      <div
        style={{
          backgroundColor: "#FFFFFF",
          padding: "32px",
          borderRadius: "16px",
          border: "1px solid #D8D6D5",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Brand Query */}
        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "500",
              color: "#333",
              marginBottom: "8px",
            }}
          >
            Brand or item you&apos;re interested in
          </label>
          <input
            type="text"
            value={brandQuery}
            onChange={(e) => setBrandQuery(e.target.value)}
            placeholder="e.g., Nike Air Max, Zara blazer, Levi's jeans"
            style={{
              width: "100%",
              padding: "12px 16px",
              fontSize: "14px",
              backgroundColor: "#F8F7F4",
              border: "1px solid #D8D6D5",
              borderRadius: "8px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Category Selection */}
        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "500",
              color: "#333",
              marginBottom: "8px",
            }}
          >
            What are you looking for?
          </label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "12px",
            }}
          >
            {[
              { value: "clothing", label: "Clothing", icon: "👕" },
              { value: "footwear", label: "Footwear", icon: "👟" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setUserProfile((prev) => ({
                    ...prev,
                    category: option.value,
                    // Reset specific fields when changing category
                    bodyShape: "",
                    footType: "",
                    fitPreference: "",
                  }))
                }
                style={{
                  padding: "16px",
                  fontSize: "14px",
                  fontWeight: "500",
                  backgroundColor:
                    userProfile.category === option.value ? "#E9DED5" : "#F8F7F4",
                  border: "1px solid #D8D6D5",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "18px" }}>{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Specific Fields based on category */}
        {showSpecificFields && (
          <>
            {/* Size Selection */}
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#333",
                  marginBottom: "8px",
                }}
              >
                Your UK size (optional)
              </label>
              <select
                value={isFootwear ? userProfile.ukShoeSize : userProfile.ukClothingSize}
                onChange={(e) =>
                  setUserProfile((prev) => ({
                    ...prev,
                    [isFootwear ? "ukShoeSize" : "ukClothingSize"]: e.target.value,
                  }))
                }
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  fontSize: "14px",
                  backgroundColor: "#F8F7F4",
                  border: "1px solid #D8D6D5",
                  borderRadius: "8px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              >
                <option value="">Select size (optional)</option>
                {isFootwear ? (
                  <>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="10">10</option>
                    <option value="11">11</option>
                  </>
                ) : (
                  <>
                    <option value="6">6</option>
                    <option value="8">8</option>
                    <option value="10">10</option>
                    <option value="12">12</option>
                    <option value="14">14</option>
                    <option value="16">16</option>
                    <option value="18">18</option>
                    <option value="20+">20+</option>
                  </>
                )}
              </select>
            </div>

            {/* Height field for clothing only */}
            {!isFootwear && (
              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#333",
                    marginBottom: "8px",
                  }}
                >
                  Your height (optional)
                </label>
                <select
                  value={userProfile.height}
                  onChange={(e) =>
                    setUserProfile((prev) => ({
                      ...prev,
                      height: e.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    fontSize: "14px",
                    backgroundColor: "#F8F7F4",
                    border: "1px solid #D8D6D5",
                    borderRadius: "8px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">Select height (optional)</option>
                  <option value="under-5-2">Under 5&apos;2&quot;</option>
                  <option value="5-2-to-5-4">5&apos;2&quot; - 5&apos;4&quot;</option>
                  <option value="5-4-to-5-6">5&apos;4&quot; - 5&apos;6&quot;</option>
                  <option value="5-6-to-5-8">5&apos;6&quot; - 5&apos;8&quot;</option>
                  <option value="5-8-to-5-10">5&apos;8&quot; - 5&apos;10&quot;</option>
                  <option value="5-10-to-6-0">5&apos;10&quot; - 6&apos;0&quot;</option>
                  <option value="over-6-0">Over 6&apos;0&quot;</option>
                </select>
              </div>
            )}

            {/* Body Shape for clothing */}
            {!isFootwear && (
              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#333",
                    marginBottom: "8px",
                  }}
                >
                  Your body shape
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "12px",
                  }}
                >
                  {[
                    { value: "pear", label: "Pear" },
                    { value: "apple", label: "Apple" },
                    { value: "hourglass", label: "Hourglass" },
                    { value: "rectangle", label: "Rectangle" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setUserProfile((prev) => ({
                          ...prev,
                          bodyShape: option.value,
                        }))
                      }
                      style={{
                        padding: "12px",
                        fontSize: "14px",
                        fontWeight: "500",
                        backgroundColor:
                          userProfile.bodyShape === option.value ? "#E9DED5" : "#F8F7F4",
                        border: "1px solid #D8D6D5",
                        borderRadius: "8px",
                        cursor: "pointer",
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Foot Type for footwear */}
            {isFootwear && (
              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#333",
                    marginBottom: "8px",
                  }}
                >
                  Your foot type
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "12px",
                  }}
                >
                  {[
                    { value: "narrow", label: "Narrow" },
                    { value: "medium", label: "Medium" },
                    { value: "wide", label: "Wide" },
                    { value: "extra-wide", label: "Extra Wide" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setUserProfile((prev) => ({
                          ...prev,
                          footType: option.value,
                        }))
                      }
                      style={{
                        padding: "12px",
                        fontSize: "14px",
                        fontWeight: "500",
                        backgroundColor:
                          userProfile.footType === option.value ? "#E9DED5" : "#F8F7F4",
                        border: "1px solid #D8D6D5",
                        borderRadius: "8px",
                        cursor: "pointer",
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Fit Preference for clothing */}
            {!isFootwear && (
              <div style={{ marginBottom: "32px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#333",
                    marginBottom: "8px",
                  }}
                >
                  Your fit preference
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "12px",
                  }}
                >
                  {[
                    { value: "slim", label: "Slim" },
                    { value: "regular", label: "Regular" },
                    { value: "loose", label: "Loose" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setUserProfile((prev) => ({
                          ...prev,
                          fitPreference: option.value,
                        }))
                      }
                      style={{
                        padding: "12px",
                        fontSize: "14px",
                        fontWeight: "500",
                        backgroundColor:
                          userProfile.fitPreference === option.value ? "#E9DED5" : "#F8F7F4",
                        border: "1px solid #D8D6D5",
                        borderRadius: "8px",
                        cursor: "pointer",
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Submit Button */}
        <button
          onClick={onSubmit}
          disabled={!buttonEnabled}
          style={{
            width: "100%",
            padding: "16px",
            fontSize: "16px",
            fontWeight: "600",
            color: buttonEnabled ? "#FFFFFF" : "#9CA3AF",
            backgroundColor: buttonEnabled ? "#DC2626" : "#E5E7EB",
            border: "none",
            borderRadius: "8px",
            cursor: buttonEnabled ? "pointer" : "not-allowed",
            transition: "all 0.2s",
          }}
        >
          {loading ? "Analyzing..." : "Get Analysis"}
        </button>
      </div>
    </div>
  );
};
