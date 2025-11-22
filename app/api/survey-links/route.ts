import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { generateShortCode } from '@/lib/shortCode';

// POST create new survey link
export async function POST(request: NextRequest) {
  try {
    const pool = getPool();
    const { surveyId } = await request.json();

    if (!surveyId) {
      return NextResponse.json({ error: 'surveyId is required' }, { status: 400 });
    }

    // Verify survey exists (exclude soft-deleted surveys)
    const [surveys] = await pool.execute(
      'SELECT id FROM surveys WHERE id = ? AND deleted_at IS NULL',
      [surveyId]
    ) as any[];

    if (surveys.length === 0) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');
    const linkId = uuidv4();
    
    // Generate unique short code
    let shortCode: string;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      shortCode = generateShortCode(6);
      const [existing] = await pool.execute(
        'SELECT id FROM survey_links WHERE short_code = ?',
        [shortCode]
      ) as any[];
      
      if (existing.length === 0) break;
      attempts++;
      
      if (attempts >= maxAttempts) {
        // Fallback to longer code if collisions
        shortCode = generateShortCode(8);
        break;
      }
    } while (attempts < maxAttempts);
    
    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Insert link
    await pool.execute(
      'INSERT INTO survey_links (id, survey_id, token, short_code, expires_at) VALUES (?, ?, ?, ?, ?)',
      [linkId, surveyId, token, shortCode, expiresAt]
    );

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return NextResponse.json({
      id: linkId,
      token,
      shortCode,
      expiresAt: expiresAt.toISOString(),
      url: `${baseUrl}/survey-link/${token}`,
      shortUrl: `${baseUrl}/s/${shortCode}`,
    });
  } catch (error: any) {
    console.error('Error creating survey link:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET all links for a survey
export async function GET(request: NextRequest) {
  try {
    const pool = getPool();
    const surveyId = request.nextUrl.searchParams.get('surveyId');

    if (!surveyId) {
      return NextResponse.json({ error: 'surveyId is required' }, { status: 400 });
    }

    const [links] = await pool.execute(
      `SELECT id, token, short_code as shortCode, expires_at as expiresAt, created_at as createdAt
       FROM survey_links 
       WHERE survey_id = ? 
       ORDER BY created_at DESC`,
      [surveyId]
    ) as any[];

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const linksWithUrls = links.map((link: any) => ({
      ...link,
      url: `${baseUrl}/survey-link/${link.token}`,
      shortUrl: link.shortCode ? `${baseUrl}/s/${link.shortCode}` : null,
      isExpired: new Date(link.expiresAt) < new Date(),
    }));

    return NextResponse.json(linksWithUrls);
  } catch (error: any) {
    console.error('Error fetching survey links:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

