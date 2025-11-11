'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
    */

    await queryInterface.sequelize.query(
      `
        CREATE TABLE IF NOT EXISTS folders (
          id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          folderType ENUM('plan_part', 'plan', 'file', 'folder') NOT NULL DEFAULT 'folder',
          position INT NOT NULL,
          teamId VARCHAR(21) NULL,
          userId VARCHAR(21) NULL,
          parentId BIGINT NULL,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT fk_folder_parent FOREIGN KEY (parentId) REFERENCES folders(id) ON DELETE CASCADE
        );
      `
    );

    await queryInterface.sequelize.query(`
      ALTER TABLE plan_parts ADD COLUMN folderId BIGINT NULL,
      ADD CONSTRAINT fk_plan_part_folder FOREIGN KEY (folderId) REFERENCES folders(id) ON DELETE SET NULL;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE plan_part_types ADD COLUMN folderId BIGINT NULL,
      ADD CONSTRAINT fk_plan_part_type_folder FOREIGN KEY (folderId) REFERENCES folders(id) ON DELETE SET NULL;
    `);
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.sequelize.query(
      `
        DROP TABLE IF EXISTS folders;
      `
    );

    await queryInterface.sequelize.query(`
      ALTER TABLE plan_parts DROP FOREIGN KEY fk_plan_part_folder;
      ALTER TABLE plan_parts DROP COLUMN folderId;
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE plan_part_types DROP FOREIGN KEY fk_plan_part_type_folder;
      ALTER TABLE plan_part_types DROP COLUMN folderId;
    `);
  }
};
