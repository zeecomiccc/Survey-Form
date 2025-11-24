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

    // Find the link by short code and check if survey is published
    const [links] = await pool.execute(
      `SELECT sl.id, sl.survey_id, sl.token, sl.expires_at as expiresAt, s.published
       FROM survey_links sl
       INNER JOIN surveys s ON sl.survey_id = s.id
       WHERE sl.short_code = ? AND sl.expires_at > NOW() AND s.deleted_at IS NULL`,
      [code]
    ) as any[];

    if (links.length === 0) {
      return NextResponse.json({ error: 'Link not found or expired' }, { status: 404 });
    }

    const link = links[0];

    // Check if survey is published
    if (!link.published) {
      return NextResponse.json({ error: 'This survey is not currently published' }, { status: 403 });
    }
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

