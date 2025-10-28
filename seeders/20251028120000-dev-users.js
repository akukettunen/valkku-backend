'use strict';

const argon2 = require('argon2');

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🌱 Seeding development users...');

    // Only run in development
    if (process.env.NODE_ENV !== 'development') {
      console.log('⏭️  Skipping seeder - not in development environment');
      return;
    }

    const passwordHash = await argon2.hash('asdcasdc', {
      type: argon2.argon2id,     // Argon2id = resist GPU + side-channels
      memoryCost: 1 << 16,       // 64 MiB
      timeCost: 3,               // iterations
      parallelism: 1,            // threads
      hashLength: 32,            // bytes
    });

    const users = [
      {
        id: 'dev-user-1--', // has to have length 12 chars
        email: 'dev@valkku.com',
        passwordHash: passwordHash,
        firstName: 'Dev',
        lastName: 'User',
        emailConfirmed: true,
        preferredLanguage: 'en',
        forcePasswordChange: false,
        emojiClickedCount: 0,
        superAdmin: false
      },
      {
        id: 'dev-user-2--',
        email: 'dev2@valkku.com',
        passwordHash: passwordHash,
        firstName: 'Dev2',
        lastName: 'User',
        emailConfirmed: true,
        preferredLanguage: 'en',
        forcePasswordChange: false,
        emojiClickedCount: 0,
        superAdmin: false
      }
    ];

    // Check if users already exist
    const existingUsers = await queryInterface.sequelize.query(
      'SELECT email FROM users WHERE email IN (:emails)',
      {
        replacements: { emails: ['dev@valkku.com', 'dev2@valkku.com'] },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (existingUsers.length > 0) {
      console.log('⚠️  Some dev users already exist, skipping seeder');
      return;
    }

    await queryInterface.bulkInsert('users', users);
    console.log('✅ Development users seeded successfully');
  },

  async down(queryInterface, Sequelize) {
    console.log('🗑️  Removing development users...');

    // Only run in development
    if (process.env.NODE_ENV !== 'development') {
      console.log('⏭️  Skipping seeder rollback - not in development environment');
      return;
    }

    await queryInterface.bulkDelete('users', {
      email: ['dev@valkku.com', 'dev2@valkku.com']
    });

    console.log('✅ Development users removed');
  }
};
