import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { isValidShortCode } from '@/lib/shortCode';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;

    // Validate short code format
    if (!isValidShortCode(code)) {
      return NextResponse.json({ error: 'Invalid short code format' }, { status: 400 });
    }

    const pool = getPool();

    // Find the link by short code
    const [links] = await pool.execute(
      `SELECT id, survey_id, token, expires_at as expiresAt
       FROM survey_links 
       WHERE short_code = ? AND expires_at > NOW()`,
      [code]
    ) as any[];

    if (links.length === 0) {
      return NextResponse.json({ error: 'Link not found or expired' }, { status: 404 });
    }

    const link = links[0];
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Return the full survey link URL
    return NextResponse.json({
      url: `${baseUrl}/survey-link/${link.token}`,
      surveyId: link.survey_id,
    });
  } catch (error: any) {
    console.error('Error fetching short link:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

