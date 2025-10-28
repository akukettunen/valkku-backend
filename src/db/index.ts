import { Sequelize, QueryTypes, Transaction as SequelizeTransaction } from 'sequelize';
import * as dotenv from 'dotenv';

dotenv.config({ path: `.env` });

const isProd = process.env['NODE_ENV'] === 'production';

export const sequelize = isProd
  ? new Sequelize(process.env['DATABASE_URL'] as string, {
      dialect: 'mysql',
      logging: false,
      pool: { max: 10, min: 0, idle: 10000, acquire: 30000 },
      dialectOptions: {
        ssl: process.env['DB_SSL'] === 'true' ? { rejectUnauthorized: true } : undefined,
      },
    })
  : new Sequelize({
      dialect: 'mysql',
      host: process.env['DB_HOST'] || '127.0.0.1',
      port: parseInt('3306', 10),
      username: 'root',
      password: 'root',
      database: process.env['DB_NAME'] as string,
      logging: false,
      // logging: console.log,
      dialectOptions: {
        multipleStatements: true,
      },
    });

// Export Transaction type
export type Transaction = SequelizeTransaction & {
  query: (sql: string, params?: any[]) => Promise<any>;
};

// Raw query function - minimal wrapper around sequelize.query
export async function query(sql: string, params?: any[]): Promise<any> {
  const options: any = {
    type: QueryTypes.RAW,
    raw: true,
  };

  if (params && params.length > 0) {
    // Filter out undefined values and replace with null
    const cleanParams = params.map(p => p === undefined ? null : p);
    options.replacements = cleanParams;
  }

  const [results, metadata] = await sequelize.query(sql, options);

  console.log('results', results);

  // For INSERT queries, return an object with insertId for backwards compatibility
  if (sql.trim().toUpperCase().startsWith('INSERT')) {
    return { insertId: results };
  }

  // For SELECT queries, return the results array
  return results;
}

// Transaction-aware query wrapper
export async function withTransaction<T>(
  callback: (trx: Transaction) => Promise<T>
): Promise<T> {
  return await sequelize.transaction(async (t) => {
    // Add query method to transaction
    const trx = t as Transaction;
    trx.query = async (sql: string, params?: any[]) => {
      const options: any = {
        type: QueryTypes.RAW,
        transaction: t,
        raw: true,
      };

      if (params && params.length > 0) {
        // Filter out undefined values and replace with null
        const cleanParams = params.map(p => p === undefined ? null : p);
        options.replacements = cleanParams;
      }

      const [results, metadata] = await sequelize.query(sql, options);

      // For INSERT queries, return an object with insertId for backwards compatibility
      if (sql.trim().toUpperCase().startsWith('INSERT')) {
        return { insertId: results };
      }

      // For SELECT queries, return the results array
      return results;
    };
    return await callback(trx);
  });
}

// Optionally: export helpers to check the connection at startup
export async function assertDb() {
  await sequelize.authenticate();
}

// Close database connection pool (for graceful shutdown)
export async function promisePoolEnd() {
  await sequelize.close();
}