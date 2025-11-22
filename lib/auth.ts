import { NextRequest } from 'next/server';
import { getPool } from './db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Validate JWT_SECRET at runtime only (not during build)
function validateJwtSecret() {
  // Check if we're in a Next.js build phase
  // During build, Next.js sets NODE_ENV=production but we shouldn't validate
  const isBuildPhase = 
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.NEXT_PHASE === 'phase-export' ||
    typeof process.env.__NEXT_PRIVATE_STANDALONE_BUILD !== 'undefined' ||
    // Check process arguments for build commands
    (typeof process !== 'undefined' && process.argv && 
     (process.argv.some(arg => arg.includes('next build')) || 
      process.argv.some(arg => arg.includes('next export'))));
  
  // Skip validation entirely during build phase
  if (isBuildPhase) {
    return;
  }
  
  // Only validate when actually running the server in production (not during build)
  // We need to be certain we're in runtime, not build
  // During build, Next.js might call functions but without clear indicators
  // So we'll only throw if we're absolutely certain we're in runtime
  if (
    process.env.NODE_ENV === 'production' && 
    JWT_SECRET === 'your-secret-key-change-in-production' &&
    !isBuildPhase
  ) {
    // Check if we have runtime indicators that suggest we're actually running
    // If NEXT_RUNTIME is set, we're in a runtime context (not build)
    // If PORT is set, we're likely in a server runtime context
    const isRuntimeContext = 
      process.env.NEXT_RUNTIME !== undefined ||
      process.env.PORT !== undefined;
    
    // Only throw if we're certain we're in runtime (not during build)
    if (isRuntimeContext) {
      console.error('ERROR: JWT_SECRET must be changed in production!');
      throw new Error('JWT_SECRET not configured for production');
    }
    // If we can't determine context, just warn (likely during build)
    // This allows build to complete but warns about the issue
    else {
      console.warn('WARNING: JWT_SECRET should be changed in production!');
    }
  }
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(userId: string): string {
  validateJwtSecret(); // Validate at runtime
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export async function verifyToken(token: string): Promise<string | null> {
  try {
    validateJwtSecret(); // Validate at runtime
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function getCurrentUser(request: NextRequest): Promise<User | null> {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) return null;

    const userId = await verifyToken(token);
    if (!userId) return null;

    const pool = getPool();
    const [users] = await pool.execute(
      'SELECT id, email, name, role FROM users WHERE id = ?',
      [userId]
    ) as any[];

    if (users.length === 0) return null;

    return users[0];
  } catch {
    return null;
  }
}

export async function createSession(userId: string, token: string): Promise<void> {
  const pool = getPool();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await pool.execute(
    'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
    [uuidv4(), userId, token, expiresAt]
  );
}

export async function deleteSession(token: string): Promise<void> {
  const pool = getPool();
  await pool.execute('DELETE FROM sessions WHERE token = ?', [token]);
}

