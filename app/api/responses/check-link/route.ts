import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// Check if a link token has already been used
export async function GET(request: NextRequest) {
  try {
    const pool = getPool();
    const token = request.nextUrl.searchParams.get('token');

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
    console.error('Error checking link submission:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

