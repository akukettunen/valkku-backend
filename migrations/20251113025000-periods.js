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
    await queryInterface.createTable('periods', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      decsription: {
        type: Sequelize.STRING,
        allowNull: true
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: false
      },
      createdById: {
        type: Sequelize.STRING(21),
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      teamId: {
        type: Sequelize.STRING(21),
        allowNull: false,
        references: {
          model: 'teams',
          key: 'id'
        }
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      color: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: '#3B82F6'
      }
    }, {
      charset: 'utf8mb4',
      collate: 'utf8mb4_0900_ai_ci'  // or utf8mb4_general_ci
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.dropTable('periods');
  }
};
