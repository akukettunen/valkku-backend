require('dotenv').config();

console.log('🔍 Sequelize Config Debug:');
console.log('  NODE_ENV:', process.env['NODE_ENV']);
console.log('  DB_NAME:', process.env['DB_NAME'] || 'NOT SET (will use default: valkku)');
console.log('  DB_HOST:', process.env['DB_HOST'] || 'NOT SET (will use default: 127.0.0.1)');
console.log('  DB_PORT:', process.env['DB_PORT'] || 'NOT SET (will use default: 3306)');
console.log('  DB_USERNAME:', process.env['DB_USERNAME'] || 'NOT SET (will use default: root)');
console.log('  DB_PASSWORD:', process.env['DB_PASSWORD'] ? 'SET' : 'NOT SET (will use default: root)');

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
    host: process.env['DB_HOST'] || '127.0.0.1',
    port: parseInt(process.env['DB_PORT'] || '3306', 10),
    username: process.env['DB_USERNAME'] || 'root',
    password: process.env['DB_PASSWORD'] || 'root',
    database: process.env['DB_NAME'] || 'valkku',
    logging: false,
    dialectOptions: {
      multipleStatements: true
    },
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'mysql',
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
      multipleStatements: true,
    },
    logging: false,
    pool: { max: 10, min: 0, idle: 10000, acquire: 30000 },
  },
};