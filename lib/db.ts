import mysql from 'mysql2/promise';

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'survey_app',
  waitForConnections: true,
  connectionLimit: 20,
  maxIdle: 10,
  // Release idle connections before MySQL closes them (wait_timeout is often 8h)
  idleTimeout: 60_000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 10_000,
};

// Create connection pool
let pool: mysql.Pool | null = null;
let poolRecreating = false;

const STALE_CONNECTION_CODES = new Set([
  'PROTOCOL_CONNECTION_LOST',
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ER_CON_COUNT_ERROR',
]);

function attachPoolHandlers(p: mysql.Pool): void {
  p.on('connection', (connection) => {
    connection.on('error', (err: NodeJS.ErrnoException) => {
      console.error('[DB] Connection error:', err.code, err.message);
      if (err.code && STALE_CONNECTION_CODES.has(err.code)) {
        void recreatePool();
      }
    });
  });

  // mysql2 pool-level errors (e.g. server closed idle connection)
  p.on('error', (err: NodeJS.ErrnoException) => {
    console.error('[DB] Pool error:', err.code, err.message);
    if (err.code && STALE_CONNECTION_CODES.has(err.code)) {
      void recreatePool();
    }
  });
}

async function recreatePool(): Promise<void> {
  if (poolRecreating) return;
  poolRecreating = true;
  const old = pool;
  pool = null;
  try {
    if (old) await old.end();
  } catch (err) {
    console.error('[DB] Error closing old pool:', err);
  }
  pool = mysql.createPool(dbConfig);
  attachPoolHandlers(pool);
  console.log('[DB] Connection pool recreated');
  poolRecreating = false;
}

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
    attachPoolHandlers(pool);
    console.log('[DB] Connection pool created with limit:', dbConfig.connectionLimit);
  }
  return pool;
}

// Gracefully close pool on shutdown
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[DB] Connection pool closed');
  }
}

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await getPool().getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

