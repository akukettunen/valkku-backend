require('dotenv-expand').expand(require('dotenv').config());

console.log('🔍 Sequelize Config Debug:');
console.log('  NODE_ENV:', process.env['NODE_ENV']);
console.log('  DB_NAME:', process.env['DB_NAME'] || 'NOT SET');
console.log('  DB_HOST:', process.env['DB_HOST'] || 'NOT SET');
console.log('  DB_PORT:', process.env['DB_PORT'] || 'NOT SET');
console.log('  DB_USERNAME:', process.env['DB_USERNAME'] || 'NOT SET');
console.log('  DB_PASSWORD:', process.env['DB_PASSWORD'] ? 'SET' : 'NOT SET');

module.exports = {
  development: {
    dialect: 'mysql',
    host: process.env['DB_HOST'],
    port: parseInt(process.env['DB_PORT'], 10),
    username: process.env['DB_USERNAME'],
    password: process.env['DB_PASSWORD'],
    database: process.env['DB_NAME'],
    logging: console.log,
    dialectOptions: {
      multipleStatements: true
    },
  },
  test: {
    dialect: 'mysql',
    host: process.env['DB_HOST'],
    port: parseInt(process.env['DB_PORT'], 10),
    username: process.env['DB_USERNAME'],
    password: process.env['DB_PASSWORD'],
    database: process.env['DB_NAME'],
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