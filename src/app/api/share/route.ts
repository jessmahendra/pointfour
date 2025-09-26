import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { airtableService } from '@/lib/airtable';

// Types for shared analysis data
interface SharedAnalysisData {
  analysisResult: unknown;
  userProfile: unknown;
  brandQuery: string;
  sharedAt: string;
}

export async function POST(request: NextRequest) {
  try {
    const analysisData: SharedAnalysisData = await request.json();
    
    // Generate a unique share ID
    const shareId = uuidv4();
    const now = new Date().toISOString();
    
    // Store the analysis data in Airtable
    await airtableService.createSharedAnalysis({
      shareId,
      analysisResult: JSON.stringify(analysisData.analysisResult),
      userProfile: JSON.stringify(analysisData.userProfile),
      brandQuery: analysisData.brandQuery,
      createdAt: now,
      viewCount: 0,
      sharedAt: analysisData.sharedAt || now
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
    
    // Retrieve the analysis data from Airtable
    const analysisData = await airtableService.getSharedAnalysis(shareId);
    
    if (!analysisData) {
      return NextResponse.json(
        { error: 'Share link not found or expired' },
        { status: 404 }
      );
    }
    
    // Increment view count
    await airtableService.incrementViewCount(shareId);
    
    // Parse the JSON strings back to objects
    const parsedData = {
      analysisResult: JSON.parse(analysisData.analysisResult),
      userProfile: JSON.parse(analysisData.userProfile),
      brandQuery: analysisData.brandQuery,
      createdAt: analysisData.createdAt,
      viewCount: analysisData.viewCount + 1, // Incremented count
      sharedAt: analysisData.sharedAt
    };
    
    return NextResponse.json({
      success: true,
      data: parsedData
    });
    
  } catch (error) {
    console.error('Error retrieving shared analysis:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve shared analysis' },
      { status: 500 }
    );
  }
}