#!/usr/bin/env node

const { Sequelize } = require('sequelize');
require('dotenv').config();

async function createDatabase() {
  const isProd = process.env['NODE_ENV'] === 'production';

  if (isProd) {
    console.log('⏭️  Skipping database creation in production');
    return;
  }

  const dbName = process.env['DB_NAME'] || 'valkku';
  const dbHost = process.env['DB_HOST'] || '127.0.0.1';
  const dbPort = process.env['DB_PORT'] || '3306';
  const dbUsername = process.env['DB_USERNAME'] || 'root';
  const dbPassword = process.env['DB_PASSWORD'] || 'root';

  console.log('🔍 Creating database if it doesn\'t exist...');
  console.log(`   Host: ${dbHost}:${dbPort}`);
  console.log(`   Database: ${dbName}`);
  console.log(`   User: ${dbUsername}`);

  // Create connection without specifying database
  const sequelize = new Sequelize({
    dialect: 'mysql',
    host: dbHost,
    port: parseInt(dbPort, 10),
    username: dbUsername,
    password: dbPassword,
    logging: false,
    dialectOptions: {
      multipleStatements: true,
    },
  });

  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ MySQL connection successful');

    // Create database
    await sequelize.query(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database '${dbName}' created or already exists`);

  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

createDatabase();
