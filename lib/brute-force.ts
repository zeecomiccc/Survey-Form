import { getPool } from './db';

// Track failed login attempts per email
interface FailedAttempt {
  count: number;
  lockUntil: number | null; // Timestamp when account is locked until
  lastAttempt: number;
}

const failedAttempts = new Map<string, FailedAttempt>();

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [email, attempt] of failedAttempts.entries()) {
    // Remove entries older than 1 hour if not locked
    if (!attempt.lockUntil && now - attempt.lastAttempt > 60 * 60 * 1000) {
      failedAttempts.delete(email);
    }
    // Remove expired locks
    if (attempt.lockUntil && now > attempt.lockUntil) {
      failedAttempts.delete(email);
    }
  }
}, 10 * 60 * 1000);

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION = 30 * 60 * 1000; // 30 minutes
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes

export async function recordFailedLogin(email: string): Promise<void> {
  const now = Date.now();
  const attempt = failedAttempts.get(email) || {
    count: 0,
    lockUntil: null,
    lastAttempt: now,
  };

  // Reset count if outside the window
  if (now - attempt.lastAttempt > ATTEMPT_WINDOW) {
    attempt.count = 0;
  }

  attempt.count++;
  attempt.lastAttempt = now;

  // Lock account after max attempts
  if (attempt.count >= MAX_FAILED_ATTEMPTS) {
    attempt.lockUntil = now + LOCK_DURATION;
  }

  failedAttempts.set(email, attempt);

  // Also store in database for persistence across restarts
  try {
    const pool = getPool();
    await pool.execute(
      `INSERT INTO login_attempts (email, attempts, locked_until, last_attempt)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       attempts = VALUES(attempts),
       locked_until = VALUES(locked_until),
       last_attempt = VALUES(last_attempt)`,
      [
        email,
        attempt.count,
        attempt.lockUntil ? new Date(attempt.lockUntil) : null,
        new Date(now),
      ]
    );
  } catch (error) {
    // If table doesn't exist, that's okay - we'll use in-memory only
    console.warn('Could not store login attempt in database:', error);
  }
}

export async function recordSuccessfulLogin(email: string): Promise<void> {
  // Clear failed attempts on successful login
  failedAttempts.delete(email);

  // Clear from database
  try {
    const pool = getPool();
    await pool.execute('DELETE FROM login_attempts WHERE email = ?', [email]);
  } catch (error) {
    // Ignore if table doesn't exist
  }
}

export function isAccountLocked(email: string): { locked: boolean; lockUntil?: number } {
  const attempt = failedAttempts.get(email);
  
  if (!attempt || !attempt.lockUntil) {
    return { locked: false };
  }

  const now = Date.now();
  if (now < attempt.lockUntil) {
    return {
      locked: true,
      lockUntil: attempt.lockUntil,
    };
  }

  // Lock expired, clear it
  failedAttempts.delete(email);
  return { locked: false };
}

export function getRemainingAttempts(email: string): number {
  const attempt = failedAttempts.get(email);
  if (!attempt) {
    return MAX_FAILED_ATTEMPTS;
  }

  const now = Date.now();
  // Reset if outside the window
  if (now - attempt.lastAttempt > ATTEMPT_WINDOW) {
    return MAX_FAILED_ATTEMPTS;
  }

  return Math.max(0, MAX_FAILED_ATTEMPTS - attempt.count);
}

// Load failed attempts from database on startup
export async function loadFailedAttemptsFromDB(): Promise<void> {
  try {
    const pool = getPool();
    const [attempts] = await pool.execute(
      'SELECT email, attempts, locked_until, last_attempt FROM login_attempts WHERE locked_until > NOW() OR last_attempt > DATE_SUB(NOW(), INTERVAL 1 HOUR)'
    ) as any[];

    for (const attempt of attempts) {
      failedAttempts.set(attempt.email, {
        count: attempt.attempts,
        lockUntil: attempt.locked_until ? new Date(attempt.locked_until).getTime() : null,
        lastAttempt: new Date(attempt.last_attempt).getTime(),
      });
    }
  } catch (error) {
    // Table might not exist yet, that's okay
    console.warn('Could not load login attempts from database:', error);
  }
}

