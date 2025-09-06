import mysql from 'mysql';
import { promisify } from 'util';
import dotenv from 'dotenv';

dotenv.config();

const databaseConfig: mysql.PoolConfig = {
  connectionLimit: 10,
  host: process.env['DB_HOST'],
  user: process.env['DB_USERNAME'],
  password: process.env['DB_PASSWORD'],
  database: process.env['DB_NAME']
};

const pool = mysql.createPool(databaseConfig);
const query = promisify(pool.query).bind(pool) as (sql: string, values?: any[]) => Promise<any>;
const promisePoolEnd = promisify(pool.end).bind(pool) as () => Promise<void>;

export {
  query,
  promisePoolEnd,
  databaseConfig
};
