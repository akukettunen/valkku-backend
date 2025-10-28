#!/usr/bin/env node

const { Sequelize } = require('sequelize');
const path = require('path');

// Load .env file from project root with variable expansion
require('dotenv-expand').expand(require('dotenv').config({ path: path.join(__dirname, '../.env') }));

async function createDatabase() {
  const dbName = process.env['DB_NAME'];
  const dbHost = process.env['DB_HOST'];
  const dbPort = process.env['DB_PORT'];
  const dbUsername = process.env['DB_USERNAME'];
  const dbPassword = process.env['DB_PASSWORD'];

  // Validate required environment variables
  if (!dbName || !dbHost || !dbPort || !dbUsername || !dbPassword) {
    console.error('❌ Missing required environment variables:');
    console.error(`   DB_NAME: ${dbName ? '✓' : '✗'}`);
    console.error(`   DB_HOST: ${dbHost ? '✓' : '✗'}`);
    console.error(`   DB_PORT: ${dbPort ? '✓' : '✗'}`);
    console.error(`   DB_USERNAME: ${dbUsername ? '✓' : '✗'}`);
    console.error(`   DB_PASSWORD: ${dbPassword ? '✓' : '✗'}`);
    process.exit(1);
  }

  console.log('🔍 Creating database if it doesn\'t exist...');
  console.log(`   Host: ${dbHost}:${dbPort}`);
  console.log(`   Database: ${dbName}`);
  console.log(`   User: ${dbUsername}`);
  console.log(`   NODE_ENV: ${process.env['NODE_ENV']}`);

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

    // Create database (quote the name to handle special characters)
    await sequelize.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database '${dbName}' created or already exists`);

  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

createDatabase();
