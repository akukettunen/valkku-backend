import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const databaseConfig = {
  connectionLimit: 10,
  host: process.env['DB_HOST']!,
  user: process.env['DB_USERNAME']!,
  password: process.env['DB_PASSWORD']!,
  database: process.env['DB_NAME']!,
  waitForConnections: true,
  queueLimit: 0,
  connectTimeout: 10_000,
  // Keep idle connections alive to reduce server-side idle timeouts
  enableKeepAlive: true,
  keepAliveInitialDelay: 10_000,
  // mysql2 v3 pool idle tuning
  maxIdle: 10,           // max idle connections, same as connectionLimit by default
  idleTimeout: 60_000,   // prune idle connections after 60s
} as const;

const pool = mysql.createPool(databaseConfig);

// mysql2/promise already returns promises, so we can use it directly
// Add a single retry on transient connection errors after idle periods
const transientErrorCodes = new Set(['PROTOCOL_CONNECTION_LOST', 'ECONNRESET', 'EPIPE']);

const query = async (sql: string, values?: any[]) => {
  try {
    const [rows] = await pool.execute(sql, values);
    return rows;
  } catch (error: any) {
    if (transientErrorCodes.has(error?.code)) {
      // Retry once by getting a fresh connection
      const conn = await pool.getConnection();
      try {
        const [rows] = await conn.execute(sql, values);
        return rows;
      } finally {
        conn.release();
      }
    }
    throw error;
  }
};

const promisePoolEnd = async () => {
  await pool.end();
};

export {
  query,
  promisePoolEnd,
  databaseConfig
};
