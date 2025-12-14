'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS event_users (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        eventId INT NOT NULL,
        userId VARCHAR(21) NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT event_users_ibfk_1 FOREIGN KEY (eventId) REFERENCES events(id) ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT event_users_ibfk_2 FOREIGN KEY (userId) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Add forAllAthletes column if it doesn't exist
    const [columnsForAllAthletes] = await queryInterface.sequelize.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'events'
      AND COLUMN_NAME = 'forAllAthletes';
    `);
    if (columnsForAllAthletes.length === 0) {
      await queryInterface.sequelize.query(`
        ALTER TABLE events ADD COLUMN forAllAthletes BOOLEAN NOT NULL DEFAULT 1;
      `);
    }

    // Add forAllStaff column if it doesn't exist
    const [columnsForAllStaff] = await queryInterface.sequelize.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'events'
      AND COLUMN_NAME = 'forAllStaff';
    `);
    if (columnsForAllStaff.length === 0) {
      await queryInterface.sequelize.query(`
        ALTER TABLE events ADD COLUMN forAllStaff BOOLEAN NOT NULL DEFAULT 1;
      `);
    }

    // Add registrationRequired column if it doesn't exist
    const [columnsRegistrationRequired] = await queryInterface.sequelize.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'events'
      AND COLUMN_NAME = 'registrationRequired';
    `);
    if (columnsRegistrationRequired.length === 0) {
      await queryInterface.sequelize.query(`
        ALTER TABLE events ADD COLUMN registrationRequired BOOLEAN NOT NULL DEFAULT 1;
      `);
    }
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.sequelize.query(`
      ALTER TABLE events DROP COLUMN IF EXISTS registrationRequired;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE events DROP COLUMN IF EXISTS forAllStaff;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE events DROP COLUMN IF EXISTS forAllAthletes;
    `);

    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS event_users;
    `);
  }
};
