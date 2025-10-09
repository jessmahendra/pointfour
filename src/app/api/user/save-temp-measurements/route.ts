import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { measurements } = body;

    if (!measurements) {
      return NextResponse.json(
        { error: 'Measurements are required' },
        { status: 400 }
      );
    }

    // Check if user already has measurements
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('measurements')
      .eq('user_id', user.id)
      .single();

    // Only save if user doesn't already have measurements
    if (!existingProfile || !existingProfile.measurements) {
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          measurements: measurements,
          updated_at: new Date().toISOString(),
        });

      if (updateError) {
        console.error('Error saving measurements:', updateError);
        return NextResponse.json(
          { error: 'Failed to save measurements' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Measurements saved successfully'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'User already has measurements'
    });

  } catch (error) {
    console.error('Error saving temp measurements:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
