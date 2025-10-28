'use strict';
const fs = require('fs');
const path = require('path');
require('dotenv-expand').expand(require('dotenv').config());

const dbName = process.env['DB_NAME'];

console.log('🔍 Migration Debug:');
console.log('  DB_NAME:', dbName);
console.log('  NODE_ENV:', process.env['NODE_ENV']);

module.exports = {
  async up(queryInterface) {
    console.log('🚀 Starting migration...');

    try {
      console.log(`📦 Creating database: ${dbName}`);
      await queryInterface.sequelize.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log('✅ Database creation completed');

      const schemaPath = path.join(__dirname, '../sql/schema.sql');
      console.log('📄 Schema file path:', schemaPath);

      if (!fs.existsSync(schemaPath)) {
        throw new Error(`Schema file not found at: ${schemaPath}`);
      }

      const sql = fs.readFileSync(schemaPath, 'utf8');
      console.log('📄 Schema file size:', sql.length, 'characters');
      console.log('📄 Schema preview (first 200 chars):', sql.substring(0, 200));

      console.log('🔧 Executing schema SQL...');
      const result = await queryInterface.sequelize.query(sql);
      console.log('✅ Schema execution completed');
      console.log('📊 Query result:', result);

    } catch (error) {
      console.error('❌ Migration error:', error);
      throw error;
    }
  },

  async down() {
    console.log('🔄 Rolling back migration...');
    return queryInterface.dropAllTables();
  }
};
