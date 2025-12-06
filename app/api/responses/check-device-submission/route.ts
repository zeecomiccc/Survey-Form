import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import crypto from 'crypto';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Generate a device fingerprint from IP and User-Agent
function getDeviceFingerprint(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // Create a hash of IP + User-Agent for device identification
  const fingerprint = crypto
    .createHash('sha256')
    .update(`${ip}:${userAgent}`)
    .digest('hex')
    .substring(0, 32); // Use first 32 chars as device ID
  
  return fingerprint;
}

// Check if a device has already submitted a survey
export async function GET(request: NextRequest) {
  try {
    const pool = getPool();
    const surveyId = request.nextUrl.searchParams.get('surveyId');
    
    if (!surveyId) {
      return NextResponse.json({ error: 'surveyId is required' }, { status: 400 });
    }
    
    const deviceFingerprint = getDeviceFingerprint(request);
    
    // Check if this device has already submitted this survey
    try {
      const [responses] = await pool.execute(
        'SELECT id FROM survey_responses WHERE survey_id = ? AND device_fingerprint = ?',
        [surveyId, deviceFingerprint]
      ) as any[];
      
      const result = NextResponse.json({ 
        hasSubmitted: responses.length > 0,
        responseId: responses.length > 0 ? responses[0].id : null
      });
      
      result.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      result.headers.set('Pragma', 'no-cache');
      result.headers.set('Expires', '0');
      
      return result;
    } catch (dbError: any) {
      // If column doesn't exist yet, return false (allow submission)
      // User needs to run the migration script first
      if (dbError.code === 'ER_BAD_FIELD_ERROR' && dbError.sqlMessage?.includes('device_fingerprint')) {
        console.warn('device_fingerprint column does not exist. Please run database migration.');
        return NextResponse.json({ 
          hasSubmitted: false,
          responseId: null,
          warning: 'Database migration needed'
        });
      }
      throw dbError;
    }
  } catch (error: any) {
    console.error('Error checking device submission:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

