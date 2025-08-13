import { NextRequest, NextResponse } from 'next/server';
import { BrandCategorizer } from '@/lib/brand-categorization';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, content, url } = body;

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Brand categorization request:', { domain, hasContent: !!content, hasUrl: !!url });

    // Categorize the brand using our utility
    const brandInfo = BrandCategorizer.categorizeBrand(domain, content, url);

    if (!brandInfo) {
      return NextResponse.json(
        { 
          error: 'Unable to categorize brand',
          domain,
          suggestions: {
            availableCategories: BrandCategorizer.getAllCategories().map(cat => ({
              id: cat.id,
              name: cat.name,
              description: cat.description
            }))
          }
        },
        { status: 404 }
      );
    }

    // Get additional category information
    const categoryInfo = BrandCategorizer.getCategoryInfo(brandInfo.category);
    const subcategories = BrandCategorizer.getSubcategories(brandInfo.category);
    const fitAdviceApplicable = BrandCategorizer.shouldShowFitAdvice(brandInfo.category);

    const response = {
      success: true,
      brand: {
        ...brandInfo,
        categoryInfo,
        subcategories,
        fitAdviceApplicable
      },
      metadata: {
        totalCategories: BrandCategorizer.getAllCategories().length,
        fitAdviceCategories: BrandCategorizer.getFitAdviceCategories(),
        timestamp: new Date().toISOString()
      }
    };

    console.log('✅ Brand categorized successfully:', response.brand.name, 'as', response.brand.category);
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error in brand categorization API:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to categorize brand',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Return available categories and their information
    const categories = BrandCategorizer.getAllCategories();
    const fitAdviceCategories = BrandCategorizer.getFitAdviceCategories();

    const response = {
      success: true,
      categories: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        subcategories: cat.subcategories,
        fitAdviceApplicable: cat.fitAdviceApplicable,
        priority: cat.priority,
        keywords: cat.keywords
      })),
      fitAdviceCategories,
      totalCategories: categories.length,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error in brand categories API:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch brand categories',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
