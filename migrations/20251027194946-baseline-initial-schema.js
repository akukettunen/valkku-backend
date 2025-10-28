'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query('CREATE DATABASE IF NOT EXISTS valkku CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');

    const schemaPath = path.join(__dirname, '../sql/schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await queryInterface.sequelize.query(sql);
  },

  async down() {
    return queryInterface.dropAllTables();
  }
};
