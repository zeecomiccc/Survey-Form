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

    if (!token || token.trim() === '') {
      return NextResponse.json({ error: 'token is required' }, { status: 400 });
    }

    // Check for submissions with this exact token (excluding NULL values)
    // This ensures we only check for actual token matches, not NULL values
    const trimmedToken = token.trim();
    const [responses] = await pool.execute(
      'SELECT id FROM survey_responses WHERE link_token = ? AND link_token IS NOT NULL',
      [trimmedToken]
    ) as any[];

    // Log for debugging (remove in production if needed)
    if (responses.length > 0) {
      console.log(`[check-link] Token ${trimmedToken.substring(0, 8)}... already has ${responses.length} submission(s)`);
    }

    const result = NextResponse.json({ 
      hasSubmitted: responses.length > 0,
      responseId: responses.length > 0 ? responses[0].id : null
    });
    
    // Prevent caching to ensure fresh data on every request
    result.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    result.headers.set('Pragma', 'no-cache');
    result.headers.set('Expires', '0');
    
    return result;
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

