import { NextRequest } from 'next/server';
import { getPool } from './db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'your-secret-key-change-in-production') {
  console.error('ERROR: JWT_SECRET must be changed in production!');
  throw new Error('JWT_SECRET not configured for production');
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
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

export async function verifyToken(token: string): Promise<string | null> {
  try {
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

