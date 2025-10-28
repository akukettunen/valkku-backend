'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  async up(queryInterface) {
    const schemaPath = path.join(__dirname, '../sql/schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await queryInterface.sequelize.query(sql);
  },

  async down() {
    return queryInterface.dropAllTables();
  }
};
