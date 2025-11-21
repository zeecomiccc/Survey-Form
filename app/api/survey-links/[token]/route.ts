import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// GET survey by token (validate and get survey ID)
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const pool = getPool();
    const token = params.token;

    // Find link by token
    const [links] = await pool.execute(
      `SELECT survey_id as surveyId, expires_at as expiresAt
       FROM survey_links 
       WHERE token = ?`,
      [token]
    ) as any[];

    if (links.length === 0) {
      return NextResponse.json({ error: 'Invalid link' }, { status: 404 });
    }

    const link = links[0];

    // Check if expired
    if (new Date(link.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Link has expired' }, { status: 410 });
    }

    return NextResponse.json({ surveyId: link.surveyId });
  } catch (error: any) {
    console.error('Error validating survey link:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

