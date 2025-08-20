import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage for shared analysis results
// In production, you'd want to use a database or persistent storage
const sharedAnalysis = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const analysisData = await request.json();
    
    // Generate a unique share ID
    const shareId = uuidv4();
    
    // Store the analysis data with timestamp
    sharedAnalysis.set(shareId, {
      ...analysisData,
      createdAt: new Date().toISOString(),
      viewCount: 0
    });
    
    // Return the share ID and URL
    const shareUrl = `${request.nextUrl.origin}/analyze?share=${shareId}`;
    
    return NextResponse.json({
      success: true,
      shareId,
      shareUrl
    });
    
  } catch (error) {
    console.error('Error creating share link:', error);
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get('id');
    
    if (!shareId) {
      return NextResponse.json(
        { error: 'Share ID is required' },
        { status: 400 }
      );
    }
    
    const analysisData = sharedAnalysis.get(shareId);
    
    if (!analysisData) {
      return NextResponse.json(
        { error: 'Share link not found or expired' },
        { status: 404 }
      );
    }
    
    // Increment view count
    analysisData.viewCount = (analysisData.viewCount || 0) + 1;
    sharedAnalysis.set(shareId, analysisData);
    
    return NextResponse.json({
      success: true,
      data: analysisData
    });
    
  } catch (error) {
    console.error('Error retrieving shared analysis:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve shared analysis' },
      { status: 500 }
    );
  }
}