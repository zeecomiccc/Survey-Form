import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { verifyPassword, generateToken, createSession } from '@/lib/auth';
import { loginRateLimit } from '@/lib/rate-limit';
import { isAccountLocked, recordFailedLogin, recordSuccessfulLogin, getRemainingAttempts } from '@/lib/brute-force';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Apply rate limiting (after getting email for better tracking)
    const rateLimitResponse = await loginRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Check if account is locked
    const lockStatus = isAccountLocked(email);
    if (lockStatus.locked) {
      const lockUntil = new Date(lockStatus.lockUntil!);
      const minutesRemaining = Math.ceil((lockStatus.lockUntil! - Date.now()) / (60 * 1000));
      return NextResponse.json(
        {
          error: `Account temporarily locked due to too many failed login attempts. Please try again in ${minutesRemaining} minute(s).`,
          lockUntil: lockUntil.toISOString(),
        },
        { status: 423 } // 423 Locked
      );
    }

    const pool = getPool();
    const [users] = await pool.execute(
      'SELECT id, email, name, role, password FROM users WHERE email = ?',
      [email]
    ) as any[];

    if (users.length === 0) {
      // Record failed attempt even if user doesn't exist (prevents email enumeration)
      await recordFailedLogin(email);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const user = users[0];
    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      // Record failed attempt
      await recordFailedLogin(email);
      const remaining = getRemainingAttempts(email);
      return NextResponse.json(
        {
          error: 'Invalid email or password',
          remainingAttempts: remaining,
        },
        { status: 401 }
      );
    }

    // Successful login - clear failed attempts
    await recordSuccessfulLogin(email);

    const token = generateToken(user.id);
    await createSession(user.id, token);

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });

    // Set cookie
    // Check if we're using HTTPS by checking the X-Forwarded-Proto header
    // (set by reverse proxy) or request protocol
    // Behind Apache reverse proxy, X-Forwarded-Proto header should be set
    const forwardedProto = request.headers.get('x-forwarded-proto');
    const isSecure = forwardedProto === 'https' || 
                     request.nextUrl.protocol === 'https:' ||
                     request.url.startsWith('https://');
    
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: isSecure, // Only require HTTPS if actually using HTTPS
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/', // Explicitly set path to root
    });

    return response;
  } catch (error: any) {
    console.error('Error logging in:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

