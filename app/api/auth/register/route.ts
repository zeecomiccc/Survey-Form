import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { hashPassword, generateToken, createSession, getCurrentUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { strictApiRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await strictApiRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Check if user is admin
    const currentUser = await getCurrentUser(request);
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can create users' }, { status: 403 });
    }

    const { email, password, name, role } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 });
    }

    const pool = getPool();
    
    // Check if user already exists
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    ) as any[];

    if (existing.length > 0) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    const userId = uuidv4();
    const userRole = role || 'user';

    await pool.execute(
      'INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)',
      [userId, email, hashedPassword, name, userRole]
    );

    return NextResponse.json({
      user: {
        id: userId,
        email,
        name,
        role: userRole,
      },
    });
  } catch (error: any) {
    console.error('Error registering user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

