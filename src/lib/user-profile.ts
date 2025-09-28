import { createClient } from '@/utils/supabase/server';
import { UserProfile, UserMeasurements, CreateProfileData } from '@/types/user';

/**
 * Get the current user's profile from the database
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

/**
 * Create a new user profile
 */
export async function createUserProfile(profileData: CreateProfileData): Promise<UserProfile | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .insert(profileData)
    .select()
    .single();

  if (error) {
    console.error('Error creating user profile:', error);
    return null;
  }

  return data;
}

/**
 * Update user measurements
 */
export async function updateUserMeasurements(measurements: UserMeasurements): Promise<UserProfile | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .update({ 
      measurements,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating user measurements:', error);
    return null;
  }

  return data;
}

/**
 * Get user measurements only
 */
export async function getUserMeasurements(): Promise<UserMeasurements | null> {
  const profile = await getUserProfile();
  return profile?.measurements || null;
}

/**
 * Validate measurements data
 */
export function validateMeasurements(measurements: UserMeasurements): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Basic info validation
  if (measurements.DOB) {
    const dobDate = new Date(measurements.DOB);
    if (isNaN(dobDate.getTime())) {
      errors.push('DOB must be a valid date');
    } else if (dobDate > new Date()) {
      errors.push('DOB cannot be in the future');
    }
  }

  if (measurements.height !== undefined) {
    if (typeof measurements.height !== 'number' || measurements.height <= 0) {
      errors.push('Height must be a positive number');
    } else if (measurements.height < 50 || measurements.height > 300) {
      errors.push('Height must be between 50 and 300 cm');
    }
  }

  // Body measurements validation
  if (measurements.bodyMeasurements) {
    const { bust, waist, hips, unit } = measurements.bodyMeasurements;
    
    if (bust !== undefined) {
      if (typeof bust !== 'number' || bust <= 0) {
        errors.push('Bust measurement must be a positive number');
      } else {
        const maxValue = unit === 'in' ? 60 : 150; // Reasonable limits
        if (bust > maxValue) {
          errors.push(`Bust measurement seems too large (max ${maxValue} ${unit})`);
        }
      }
    }

    if (waist !== undefined) {
      if (typeof waist !== 'number' || waist <= 0) {
        errors.push('Waist measurement must be a positive number');
      } else {
        const maxValue = unit === 'in' ? 50 : 125;
        if (waist > maxValue) {
          errors.push(`Waist measurement seems too large (max ${maxValue} ${unit})`);
        }
      }
    }

    if (hips !== undefined) {
      if (typeof hips !== 'number' || hips <= 0) {
        errors.push('Hips measurement must be a positive number');
      } else {
        const maxValue = unit === 'in' ? 60 : 150;
        if (hips > maxValue) {
          errors.push(`Hips measurement seems too large (max ${maxValue} ${unit})`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
