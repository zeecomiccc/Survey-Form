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
    let shortCode: string = generateShortCode(6); // Initialize with a default value
    let attempts = 0;
    const maxAttempts = 20; // Increased attempts
    
    // Keep generating until we find a unique code
    let isUnique = false;
    while (!isUnique && attempts < maxAttempts) {
      // Generate code with increasing length for better uniqueness
      const codeLength = attempts < 10 ? 6 : attempts < 15 ? 8 : 10;
      shortCode = generateShortCode(codeLength);
      
      try {
        const [existing] = await pool.execute(
          'SELECT id FROM survey_links WHERE short_code = ?',
          [shortCode]
        ) as any[];
        
        if (existing.length === 0) {
          isUnique = true;
        } else {
          attempts++;
        }
      } catch (checkError: any) {
        // If there's an error checking (e.g., column doesn't exist), 
        // we'll handle it during insert
        console.warn('Error checking short code uniqueness:', checkError);
        isUnique = true; // Try to proceed, error will be caught during insert
        break;
      }
    }
    
    if (!isUnique) {
      // Last resort: use a UUID-based short code
      shortCode = linkId.substring(0, 12) + Date.now().toString(36).substring(0, 4);
    }
    
    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Insert link
    try {
      // Try inserting with short_code first
      await pool.execute(
        'INSERT INTO survey_links (id, survey_id, token, short_code, expires_at) VALUES (?, ?, ?, ?, ?)',
        [linkId, surveyId, token, shortCode, expiresAt]
      );
    } catch (dbError: any) {
      // Check if it's a duplicate key error (short_code already exists)
      if (dbError.code === 'ER_DUP_ENTRY') {
        // Try again with a longer, unique code
        shortCode = generateShortCode(10);
        try {
          await pool.execute(
            'INSERT INTO survey_links (id, survey_id, token, short_code, expires_at) VALUES (?, ?, ?, ?, ?)',
            [linkId, surveyId, token, shortCode, expiresAt]
          );
        } catch (retryError: any) {
          // If still failing, try without short_code (fallback for older schema)
          if (retryError.code === 'ER_BAD_FIELD_ERROR' || retryError.code === 'ER_DUP_ENTRY') {
            await pool.execute(
              'INSERT INTO survey_links (id, survey_id, token, expires_at) VALUES (?, ?, ?, ?)',
              [linkId, surveyId, token, expiresAt]
            );
            // Set shortCode to null if column doesn't exist
            shortCode = '';
          } else {
            throw retryError;
          }
        }
      } else if (dbError.code === 'ER_BAD_FIELD_ERROR' && dbError.sqlMessage?.includes('short_code')) {
        // Column doesn't exist - insert without short_code (backward compatibility)
        await pool.execute(
          'INSERT INTO survey_links (id, survey_id, token, expires_at) VALUES (?, ?, ?, ?)',
          [linkId, surveyId, token, expiresAt]
        );
        shortCode = ''; // No short code available
      } else {
        throw dbError; // Re-throw other database errors
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return NextResponse.json({
      id: linkId,
      token,
      shortCode: shortCode || null,
      expiresAt: expiresAt.toISOString(),
      url: `${baseUrl}/survey-link/${token}`,
      shortUrl: shortCode ? `${baseUrl}/s/${shortCode}` : null,
    });
  } catch (error: any) {
    console.error('Error creating survey link:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      stack: error.stack,
    });
    return NextResponse.json({ 
      error: error.message || 'Failed to create survey link. Please check server logs for details.' 
    }, { status: 500 });
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


