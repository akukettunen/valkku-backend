'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS units (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name JSON NOT NULL,
        symbol VARCHAR(32) NOT NULL,
        code VARCHAR(64) NOT NULL UNIQUE,
        unit_group ENUM(
          'amount',
          'distance',
          'time',
          'mass',
          'temperature',
          'area',
          'volume',
          'speed',
          'angle'
        ) NOT NULL,
        base_unit_id INT UNSIGNED NULL,
        factor_to_base DECIMAL(30, 15) NOT NULL DEFAULT 1.0,
        offset_to_base DECIMAL(30, 15) DEFAULT 0.0,
        is_default TINYINT(1) NOT NULL DEFAULT 0,

        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        CONSTRAINT fk_units_base_unit
          FOREIGN KEY (base_unit_id) REFERENCES units(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS test_groups (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        title JSON NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

      CREATE TABLE IF NOT EXISTS tests (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        title JSON NOT NULL,
        notes JSON NOT NULL,
        teamId VARCHAR(21),
        createdById VARCHAR(21) NOT NULL,
        scope ENUM('global', 'club', 'team') NOT NULL DEFAULT 'global',
        testGroupId INT UNSIGNED NOT NULL,

        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        CONSTRAINT fk_tests_team
          FOREIGN KEY (teamId) REFERENCES teams(id),
        CONSTRAINT fk_tests_created_by
          FOREIGN KEY (createdById) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

      CREATE TABLE IF NOT EXISTS test_fillables (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        testId INT UNSIGNED NOT NULL,
        unitId INT UNSIGNED NOT NULL,
        title JSON NOT NULL,

        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        CONSTRAINT fk_test_fillables_test
          FOREIGN KEY (testId) REFERENCES tests(id),
        CONSTRAINT fk_test_fillables_unit
          FOREIGN KEY (unitId) REFERENCES units(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS test_variant_fillables;
      DROP TABLE IF EXISTS test_variants;
      DROP TABLE IF EXISTS tests;
      DROP TABLE IF EXISTS test_groups;
      DROP TABLE IF EXISTS units;
    `);
  }
};
