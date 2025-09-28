import { Metadata } from "next";
import MeasurementsForm from "@/components/MeasurementsForm";

export const metadata: Metadata = {
  title: "My Measurements | PointFour",
  description: "Manage your body measurements for better size recommendations",
};

export default function MeasurementsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            My Measurements
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Help us provide better size recommendations by sharing your
            measurements. This information is stored securely and only used to
            improve your shopping experience.
          </p>
        </div>

        {/* Measurements Form */}
        <MeasurementsForm />

        {/* Privacy Notice */}
        <div className="mt-8 max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Privacy & Security
            </h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Your measurements are encrypted and stored securely</li>
              <li>• Only you can view and edit your data</li>
              <li>• We never share your personal information</li>
              <li>• You can delete your data anytime</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
