'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add athleteId to events (nullable, references users)
    await queryInterface.addColumn('events', 'athleteId', {
      type: Sequelize.STRING(21),
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      after: 'createdById',
    });

    await queryInterface.addIndex('events', ['athleteId'], {
      name: 'events_athleteId_idx',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('events', 'events_athleteId_idx');
    await queryInterface.removeColumn('events', 'athleteId');
  }
};
