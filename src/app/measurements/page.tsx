import { Metadata } from "next";
import MeasurementsForm from "@/components/MeasurementsForm";

export const metadata: Metadata = {
  title: "My Measurements | PointFour",
  description: "Manage your body measurements for better size recommendations",
};

export default function MeasurementsPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-6" style={{ color: "#4E4B4B" }}>
            My Measurements
          </h1>
          <p
            className="text-sm max-w-2xl mx-auto leading-relaxed"
            style={{ color: "#6C6A68" }}
          >
            Help us provide better size recommendations by sharing your
            measurements. This information is stored securely and only used to
            improve your shopping experience.
          </p>
        </div>

        {/* Measurements Form */}
        <MeasurementsForm />

        {/* Privacy Notice */}
        <div className="mt-12 max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-stone-200 p-6">
            <h3
              className="text-sm font-semibold mb-3"
              style={{ color: "#4E4B4B" }}
            >
              Privacy & Security
            </h3>
            <ul className="text-xs space-y-2" style={{ color: "#6C6A68" }}>
              <li className="flex items-start">
                <span className="mr-2" style={{ color: "#EBE6E2" }}>
                  •
                </span>
                Your measurements are encrypted and stored securely
              </li>
              <li className="flex items-start">
                <span className="mr-2" style={{ color: "#EBE6E2" }}>
                  •
                </span>
                Only you can view and edit your data
              </li>
              <li className="flex items-start">
                <span className="mr-2" style={{ color: "#EBE6E2" }}>
                  •
                </span>
                We never share your personal information
              </li>
              <li className="flex items-start">
                <span className="mr-2" style={{ color: "#EBE6E2" }}>
                  •
                </span>
                You can delete your data anytime
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
