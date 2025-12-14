'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS unit_groups (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        title JSON NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

      CREATE TABLE IF NOT EXISTS units (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name JSON NOT NULL,
        symbol VARCHAR(32) NOT NULL,
        code VARCHAR(64) NOT NULL UNIQUE,
        unit_group_id INT UNSIGNED NOT NULL,
        base_unit_id INT UNSIGNED NULL,
        factor_to_base DECIMAL(30, 15) NOT NULL DEFAULT 1.0,
        offset_to_base DECIMAL(30, 15) DEFAULT 0.0,
        display_mode VARCHAR(32) NOT NULL DEFAULT 'decimal',
        is_default TINYINT(1) NOT NULL DEFAULT 0,

        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        CONSTRAINT fk_units_base_unit
          FOREIGN KEY (base_unit_id) REFERENCES units(id),
        CONSTRAINT fk_units_group
          FOREIGN KEY (unit_group_id) REFERENCES unit_groups(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS test_groups (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        title JSON NOT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        deleted_at DATETIME NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

      CREATE TABLE IF NOT EXISTS tests (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        title JSON NOT NULL,
        notes JSON NOT NULL,
        teamId VARCHAR(21),
        createdById VARCHAR(21) NOT NULL,
        scope ENUM('global', 'club', 'team') NOT NULL DEFAULT 'global',
        testGroupId INT UNSIGNED NOT NULL,
        decimals INT UNSIGNED NOT NULL DEFAULT 0,
        deleted_at DATETIME NULL,

        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        CONSTRAINT fk_tests_team
          FOREIGN KEY (teamId) REFERENCES teams(id),
        CONSTRAINT fk_tests_created_by
          FOREIGN KEY (createdById) REFERENCES users(id),
        CONSTRAINT fk_tests_group
          FOREIGN KEY (testGroupId) REFERENCES test_groups(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

      CREATE TABLE IF NOT EXISTS test_fillables (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        testId INT UNSIGNED NOT NULL,
        unitId INT UNSIGNED NOT NULL,
        title JSON NOT NULL,
        deleted_at DATETIME NULL,

        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        CONSTRAINT fk_test_fillables_test
          FOREIGN KEY (testId) REFERENCES tests(id) ON DELETE CASCADE,
        CONSTRAINT fk_test_fillables_unit
          FOREIGN KEY (unitId) REFERENCES units(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

      CREATE TABLE IF NOT EXISTS test_events (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        teamId VARCHAR(21) NOT NULL,
        date DATE NOT NULL,
        name JSON NULL,
        createdById VARCHAR(21) NOT NULL,
        deleted_at DATETIME NULL,

        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        CONSTRAINT fk_test_events_team
          FOREIGN KEY (teamId) REFERENCES teams(id),
        CONSTRAINT fk_test_events_created_by
          FOREIGN KEY (createdById) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

      CREATE TABLE IF NOT EXISTS test_event_tests (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        testEventId INT UNSIGNED NOT NULL,
        testId INT UNSIGNED NOT NULL,
        deleted_at DATETIME NULL,

        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        CONSTRAINT fk_test_event_tests_event
          FOREIGN KEY (testEventId) REFERENCES test_events(id) ON DELETE CASCADE,
        CONSTRAINT fk_test_event_tests_test
          FOREIGN KEY (testId) REFERENCES tests(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

      CREATE TABLE IF NOT EXISTS test_results (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        userId VARCHAR(21) NOT NULL,
        testId INT UNSIGNED NOT NULL,
        testEventId INT UNSIGNED NULL,
        date DATE NOT NULL,
        createdById VARCHAR(21) NOT NULL,
        teamId VARCHAR(21),
        tryOrder INT NOT NULL DEFAULT 1,
        deleted_at DATETIME NULL,

        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        CONSTRAINT fk_test_results_user
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_test_results_test
          FOREIGN KEY (testId) REFERENCES tests(id) ON DELETE CASCADE,
        CONSTRAINT fk_test_results_test_event
          FOREIGN KEY (testEventId) REFERENCES test_events(id) ON DELETE SET NULL,
        CONSTRAINT fk_test_results_created_by
          FOREIGN KEY (createdById) REFERENCES users(id),
        CONSTRAINT fk_test_results_team
          FOREIGN KEY (teamId) REFERENCES teams(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

      CREATE TABLE IF NOT EXISTS test_result_values (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        testResultId INT UNSIGNED NOT NULL,
        testFillableId INT UNSIGNED NOT NULL,
        value DECIMAL(10, 4) NOT NULL,
        deleted_at DATETIME NULL,

        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        CONSTRAINT fk_test_result_values_result
          FOREIGN KEY (testResultId) REFERENCES test_results(id) ON DELETE CASCADE,
        CONSTRAINT fk_test_result_values_fillable
          FOREIGN KEY (testFillableId) REFERENCES test_fillables(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS test_result_values;
      DROP TABLE IF EXISTS test_results;
      DROP TABLE IF EXISTS test_event_tests;
      DROP TABLE IF EXISTS test_events;
      DROP TABLE IF EXISTS test_fillables;
      DROP TABLE IF EXISTS tests;
      DROP TABLE IF EXISTS test_groups;
      DROP TABLE IF EXISTS units;
      DROP TABLE IF EXISTS unit_groups;
    `);
  }
};
