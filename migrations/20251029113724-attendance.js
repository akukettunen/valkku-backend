'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Create user_event_attendances table using raw SQL to ensure proper charset/collation
    await queryInterface.sequelize.query(`
      CREATE TABLE user_event_attendances (
        userId VARCHAR(21) CHARACTER SET utf8mb4 NOT NULL,
        eventId INT NOT NULL,
        repeatId DATE NOT NULL,
        attends BOOLEAN NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (userId, eventId, repeatId),
        CONSTRAINT user_event_attendances_ibfk_1 FOREIGN KEY (userId) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
        CONSTRAINT user_event_attendances_ibfk_2 FOREIGN KEY (eventId) REFERENCES events(id) ON UPDATE CASCADE ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await queryInterface.addColumn('events', 'baseEventId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'events',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  },
  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('user_event_attendances');
    await queryInterface.removeColumn('events', 'baseEventId');
  }
}
