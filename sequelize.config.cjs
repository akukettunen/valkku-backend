require('dotenv').config({ path: `.env` });

module.exports = {
  development: {
    dialect: 'mysql',
    host: process.env['DB_HOST'] || '127.0.0.1',
    port: parseInt(process.env['DB_PORT'] || '3306', 10),
    username: process.env['DB_USERNAME'] || 'root',
    password: process.env['DB_PASSWORD'] || 'root',
    database: process.env['DB_NAME'] || 'valkku',
    logging: console.log,
    dialectOptions: {
      multipleStatements: true
    },
  },
  test: {
    dialect: 'mysql',
    host: '127.0.0.1',
    port: 3306,
    username: 'root',
    password: 'root',
    database: process.env['DB_NAME'],
    logging: console.log,

  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'mysql',
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
    },
    logging: false,
    pool: { max: 10, min: 0, idle: 10000, acquire: 30000 },
  },
};