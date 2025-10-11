// Types for user measurements and profiles
export interface UserMeasurements {
  // Basic info
  DOB?: string; // ISO date string (YYYY-MM-DD)
  height?: number; // Height in centimeters
  preferredSizingSystem?: 'UK' | 'US' | 'EU'; // User's preferred sizing system for recommendations

  // Sizing system (UK women's sizing)
  usualSize?: {
    tops?: string[]; // UK sizes: 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32
    bottoms?: string[]; // UK sizes: 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32
    shoes?: string[]; // EU sizes: 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48
  };
  
  // Fit preferences (optional)
  fitPreference?: {
    tops?: 'true-to-size' | 'loose-relaxed' | 'tight-fitting';
    bottoms?: 'true-to-size' | 'loose-relaxed' | 'tight-fitting';
  };
  
  // Body measurements (optional, in cm)
  bodyMeasurements?: {
    bust?: number;
    waist?: number;
    hips?: number;
    unit?: 'cm' | 'in'; // Default to cm
  };
}

export interface UserProfile {
  id: string;
  email: string;
  measurements: UserMeasurements;
  created_at: string;
  updated_at: string;
}

// Database operation types
export interface CreateProfileData {
  id: string;
  email: string;
  measurements?: UserMeasurements;
}

export interface UpdateMeasurementsData {
  measurements: UserMeasurements;
}
