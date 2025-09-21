import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const databaseConfig = {
  connectionLimit: 10,
  host: process.env['DB_HOST']!,
  user: process.env['DB_USERNAME']!,
  password: process.env['DB_PASSWORD']!,
  database: process.env['DB_NAME']!
};

const pool = mysql.createPool(databaseConfig);

// mysql2/promise already returns promises, so we can use it directly
const query = async (sql: string, values?: any[]) => {
  const [rows] = await pool.execute(sql, values);
  return rows;
};

const promisePoolEnd = async () => {
  await pool.end();
};

export {
  query,
  promisePoolEnd,
  databaseConfig
};
