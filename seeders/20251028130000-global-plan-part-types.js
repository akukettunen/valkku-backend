'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🌱 Seeding global plan part types...');

    const globalPlanPartTypes = [
      {
        "id" : 2,
        "titleObject" : "{\"en\": \"Warm up\", \"fi\": \"Alkuverryttely\"}",
        "scope" : "global",
        "userId" : null,
        "teamId" : null,
        "color" : "#FFEB3B",
        "createdById" : null,
        "archived" : 0,
        "position" : 0
      },
      {
        "id" : 4,
        "titleObject" : "{\"en\": \"Sport-specific training\", \"fi\": \"Lajiharjoittelu\"}",
        "scope" : "global",
        "userId" : null,
        "teamId" : null,
        "color" : "#2196F3",
        "createdById" : null,
        "archived" : 0,
        "position" : 2
      },
      {
        "id" : 5,
        "titleObject" : "{\"en\": \"Speed training\", \"fi\": \"Nopeusharjoittelu\"}",
        "scope" : "global",
        "userId" : null,
        "teamId" : null,
        "color" : "#4CAF50",
        "createdById" : null,
        "archived" : 0,
        "position" : 3
      },
      {
        "id" : 6,
        "titleObject" : "{\"en\": \"Strength training\", \"fi\": \"Voimaharjoittelu\"}",
        "scope" : "global",
        "userId" : null,
        "teamId" : null,
        "color" : "#F44336",
        "createdById" : null,
        "archived" : 0,
        "position" : 1
      },
      {
        "id" : 7,
        "titleObject" : "{\"en\": \"Fifth\", \"fi\": \"Viides\"}",
        "scope" : "global",
        "userId" : null,
        "teamId" : null,
        "color" : "#00BCD4",
        "createdById" : null,
        "archived" : 1,
        "position" : 8
      },
      {
        "id" : 8,
        "titleObject" : "{\"en\": \"Cool down\", \"fi\": \"Loppuverryttely\"}",
        "scope" : "global",
        "userId" : null,
        "teamId" : null,
        "color" : "#8BC34A",
        "createdById" : null,
        "archived" : 0,
        "position" : 7
      },
      {
        "id" : 9,
        "titleObject" : "{\"en\": \"Mental training\", \"fi\": \"Psyykkinen harjoite\"}",
        "scope" : "global",
        "userId" : null,
        "teamId" : null,
        "color" : "#2196F3",
        "createdById" : null,
        "archived" : 0,
        "position" : 5
      },
      {
        "id" : 10,
        "titleObject" : "{\"en\": \"Mobility\", \"fi\": \"Liikkuvuus\"}",
        "scope" : "global",
        "userId" : null,
        "teamId" : null,
        "color" : "#9C27B0",
        "createdById" : null,
        "archived" : 0,
        "position" : 6
      },
      {
        "id" : 11,
        "titleObject" : "{\"en\": \"Endurance\", \"fi\": \"Kestävyys\"}",
        "scope" : "global",
        "userId" : null,
        "teamId" : null,
        "color" : "#795548",
        "createdById" : null,
        "archived" : 0,
        "position" : 4
      }
    ];

    // Check if global plan part types already exist
    const existingTypes = await queryInterface.sequelize.query(
      'SELECT COUNT(*) as count FROM plan_part_types WHERE scope = "global"',
      {
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (existingTypes[0].count > 0) {
      console.log('⚠️  Global plan part types already exist, skipping seeder');
      return;
    }

    await queryInterface.bulkInsert('plan_part_types', globalPlanPartTypes);
    console.log('✅ Global plan part types seeded successfully');
  },

  async down(queryInterface, Sequelize) {
    console.log('🗑️  Removing global plan part types...');

    // Only run in development
    if (process.env.NODE_ENV !== 'development') {
      console.log('⏭️  Skipping seeder rollback - not in development environment');
      return;
    }

    await queryInterface.bulkDelete('plan_part_types', {
      scope: 'global'
    });

    console.log('✅ Global plan part types removed');
  }
};
