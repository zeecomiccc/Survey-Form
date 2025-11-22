import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// Force dynamic rendering (can't be statically generated due to searchParams)
// This prevents Next.js from trying to statically analyze this route during build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Check if a link token has already been used
export async function GET(request: NextRequest) {
  try {
    const pool = getPool();
    
    // During build phase, Next.js tries to analyze routes
    // We need to safely access searchParams without triggering static analysis
    let token: string | null = null;
    try {
      token = request.nextUrl.searchParams.get('token');
    } catch (buildError: any) {
      // During build analysis, searchParams access throws an error
      // Return a default response to allow build to continue
      if (buildError.digest === 'DYNAMIC_SERVER_USAGE') {
        return NextResponse.json({ hasSubmitted: false, responseId: null });
      }
      throw buildError; // Re-throw if it's a different error
    }

    if (!token) {
      return NextResponse.json({ error: 'token is required' }, { status: 400 });
    }

    const [responses] = await pool.execute(
      'SELECT id FROM survey_responses WHERE link_token = ?',
      [token]
    ) as any[];

    return NextResponse.json({ 
      hasSubmitted: responses.length > 0,
      responseId: responses.length > 0 ? responses[0].id : null
    });
  } catch (error: any) {
    // Suppress the DYNAMIC_SERVER_USAGE error during build phase
    if (error.digest === 'DYNAMIC_SERVER_USAGE' || 
        error.description?.includes('Dynamic server usage') ||
        process.env.NEXT_PHASE === 'phase-production-build') {
      // During build, return default response instead of logging error
      return NextResponse.json({ hasSubmitted: false, responseId: null });
    }
    
    // Log other errors (runtime errors)
    console.error('Error checking link submission:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

