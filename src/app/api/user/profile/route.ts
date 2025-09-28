import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { validateMeasurements } from '@/lib/user-profile';
import { UserMeasurements } from '@/types/user';

/**
 * GET /api/user/profile - Get current user's profile and measurements
 */
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      
      // If no profile exists, create one
      if (error.code === 'PGRST116') {
        console.log('No profile found, creating one for user:', user.id);
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            measurements: {}
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
        }

        return NextResponse.json({ profile: newProfile });
      }
      
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    return NextResponse.json({ profile: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/user/profile - Update user measurements
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const measurements: UserMeasurements = body.measurements;

    if (!measurements) {
      return NextResponse.json({ error: 'Measurements data is required' }, { status: 400 });
    }

    // Validate measurements
    const validation = validateMeasurements(measurements);
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: 'Invalid measurements data', 
        details: validation.errors 
      }, { status: 400 });
    }

    // Try to update measurements in the database
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
      
      // If no profile exists, create one with the measurements
      if (error.code === 'PGRST116') {
        console.log('No profile found, creating one with measurements for user:', user.id);
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            measurements
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
        }

        return NextResponse.json({ 
          success: true, 
          profile: newProfile,
          message: 'Measurements saved successfully' 
        });
      }
      
      return NextResponse.json({ error: 'Failed to update measurements' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      profile: data,
      message: 'Measurements updated successfully' 
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
