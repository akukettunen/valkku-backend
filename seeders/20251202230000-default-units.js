'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    console.log('🌱 Seeding default units and tests...');

    // 1. UNIT GROUPS
    const unitGroups = [
      { id: 1, title: JSON.stringify({ en: 'Amount', fi: 'Määrä' }) },
      { id: 2, title: JSON.stringify({ en: 'Distance', fi: 'Matka' }) },
      { id: 3, title: JSON.stringify({ en: 'Time', fi: 'Aika' }) },
      { id: 4, title: JSON.stringify({ en: 'Mass', fi: 'Massa' }) },
      { id: 5, title: JSON.stringify({ en: 'Temperature', fi: 'Lämpötila' }) },
      { id: 6, title: JSON.stringify({ en: 'Speed', fi: 'Nopeus' }) },
      { id: 7, title: JSON.stringify({ en: 'Angle', fi: 'Kulma' }) },
    ];

    await queryInterface.bulkInsert('unit_groups', unitGroups, {
      updateOnDuplicate: ['title']
    });

    console.log('✅ Unit groups seeded/updated successfully');

    // 2. UNITS
    const units = [
      // Distance (Base: Meter) - Group ID 2
      { id: 1, name: JSON.stringify({ en: 'Meter', fi: 'Metri' }), symbol: 'm', code: 'meter', unit_group_id: 2, base_unit_id: null, factor_to_base: 1.0, is_default: 1, display_mode: 'decimal' },
      { id: 2, name: JSON.stringify({ en: 'Centimeter', fi: 'Senttimetri' }), symbol: 'cm', code: 'centimeter', unit_group_id: 2, base_unit_id: 1, factor_to_base: 0.01, is_default: 0, display_mode: 'decimal' },
      { id: 3, name: JSON.stringify({ en: 'Millimeter', fi: 'Millimetri' }), symbol: 'mm', code: 'millimeter', unit_group_id: 2, base_unit_id: 1, factor_to_base: 0.001, is_default: 0, display_mode: 'decimal' },
      { id: 4, name: JSON.stringify({ en: 'Kilometer', fi: 'Kilometri' }), symbol: 'km', code: 'kilometer', unit_group_id: 2, base_unit_id: 1, factor_to_base: 1000.0, is_default: 0, display_mode: 'decimal' },
      { id: 5, name: JSON.stringify({ en: 'Inch', fi: 'Tuuma' }), symbol: 'in', code: 'inch', unit_group_id: 2, base_unit_id: 1, factor_to_base: 0.0254, is_default: 0, display_mode: 'decimal' },
      { id: 6, name: JSON.stringify({ en: 'Foot', fi: 'Jalka' }), symbol: 'ft', code: 'foot', unit_group_id: 2, base_unit_id: 1, factor_to_base: 0.3048, is_default: 0, display_mode: 'decimal' },
      { id: 7, name: JSON.stringify({ en: 'Yard', fi: 'Jaardi' }), symbol: 'yd', code: 'yard', unit_group_id: 2, base_unit_id: 1, factor_to_base: 0.9144, is_default: 0, display_mode: 'decimal' },
      { id: 8, name: JSON.stringify({ en: 'Mile', fi: 'Maili' }), symbol: 'mi', code: 'mile', unit_group_id: 2, base_unit_id: 1, factor_to_base: 1609.344, is_default: 0, display_mode: 'decimal' },

      // Time (Base: Second) - Group ID 3
      { id: 10, name: JSON.stringify({ en: 'Second', fi: 'Sekunti' }), symbol: 's', code: 'second', unit_group_id: 3, base_unit_id: null, factor_to_base: 1.0, is_default: 1, display_mode: 'decimal' },
      { id: 11, name: JSON.stringify({ en: 'Minute', fi: 'Minuutti' }), symbol: 'min', code: 'minute', unit_group_id: 3, base_unit_id: 10, factor_to_base: 60.0, is_default: 0, display_mode: 'decimal' },
      { id: 12, name: JSON.stringify({ en: 'Hour', fi: 'Tunti' }), symbol: 'h', code: 'hour', unit_group_id: 3, base_unit_id: 10, factor_to_base: 3600.0, is_default: 0, display_mode: 'decimal' },
      { id: 13, name: JSON.stringify({ en: 'Duration', fi: 'Kesto' }), symbol: 'hh:mm:ss', code: 'duration_seconds', unit_group_id: 3, base_unit_id: 10, factor_to_base: 1.0, is_default: 0, display_mode: 'time_hhmmss' },
      { id: 14, name: JSON.stringify({ en: 'Duration (mm:ss)', fi: 'Kesto (mm:ss)' }), symbol: 'mm:ss', code: 'duration_seconds_mm_ss', unit_group_id: 3, base_unit_id: 10, factor_to_base: 1.0, is_default: 0, display_mode: 'time_hhmmss' },

      // Mass (Base: Kilogram) - Group ID 4
      { id: 20, name: JSON.stringify({ en: 'Kilogram', fi: 'Kilogramma' }), symbol: 'kg', code: 'kilogram', unit_group_id: 4, base_unit_id: null, factor_to_base: 1.0, is_default: 1, display_mode: 'decimal' },
      { id: 21, name: JSON.stringify({ en: 'Gram', fi: 'Gramma' }), symbol: 'g', code: 'gram', unit_group_id: 4, base_unit_id: 20, factor_to_base: 0.001, is_default: 0, display_mode: 'decimal' },
      { id: 22, name: JSON.stringify({ en: 'Pound', fi: 'Pauna' }), symbol: 'lb', code: 'pound', unit_group_id: 4, base_unit_id: 20, factor_to_base: 0.45359237, is_default: 0, display_mode: 'decimal' },

      // Temperature (Base: Celsius) - Group ID 5
      { id: 30, name: JSON.stringify({ en: 'Celsius', fi: 'Celsius' }), symbol: '°C', code: 'celsius', unit_group_id: 5, base_unit_id: null, factor_to_base: 1.0, is_default: 1, display_mode: 'decimal' },
      { id: 31, name: JSON.stringify({ en: 'Fahrenheit', fi: 'Fahrenheit' }), symbol: '°F', code: 'fahrenheit', unit_group_id: 5, base_unit_id: 30, factor_to_base: 0.555555555555556, offset_to_base: -17.777777777777778, is_default: 0, display_mode: 'decimal' },

      // Speed (Base: Meter per second) - Group ID 6
      { id: 40, name: JSON.stringify({ en: 'Meters per second', fi: 'Metriä sekunnissa' }), symbol: 'm/s', code: 'meters_per_second', unit_group_id: 6, base_unit_id: null, factor_to_base: 1.0, is_default: 1, display_mode: 'decimal' },
      { id: 41, name: JSON.stringify({ en: 'Kilometers per hour', fi: 'Kilometriä tunnissa' }), symbol: 'km/h', code: 'kilometers_per_hour', unit_group_id: 6, base_unit_id: 40, factor_to_base: 0.277777777777778, is_default: 0, display_mode: 'decimal' },
      { id: 42, name: JSON.stringify({ en: 'Miles per hour', fi: 'Mailia tunnissa' }), symbol: 'mph', code: 'miles_per_hour', unit_group_id: 6, base_unit_id: 40, factor_to_base: 0.44704, is_default: 0, display_mode: 'decimal' },

      // Angle (Base: Degree) - Group ID 7
      { id: 50, name: JSON.stringify({ en: 'Degree', fi: 'Aste' }), symbol: '°', code: 'degree', unit_group_id: 7, base_unit_id: null, factor_to_base: 1.0, is_default: 1, display_mode: 'decimal' },

      // Amount (Base: Empty) - Group ID 1
      { id: 61, name: JSON.stringify({ en: 'Empty', fi: 'Tyhjä' }), symbol: ' ', code: 'empty', unit_group_id: 1, base_unit_id: null, factor_to_base: 1.0, is_default: 1, display_mode: 'decimal' },
      { id: 62, name: JSON.stringify({ en: 'Amount', fi: 'Määrä' }), symbol: '#', code: 'amount', unit_group_id: 1, base_unit_id: 61, factor_to_base: 1.0, is_default: 0, display_mode: 'decimal' },
    ];

    // Prepare base and derived units
    const baseUnits = units.filter(u => u.base_unit_id === null);
    const derivedUnits = units.filter(u => u.base_unit_id !== null);

    // Upsert base units
    await queryInterface.bulkInsert('units', baseUnits, {
      updateOnDuplicate: ['name', 'symbol', 'factor_to_base', 'offset_to_base', 'is_default', 'unit_group_id', 'display_mode']
    });
    // Upsert derived units
    await queryInterface.bulkInsert('units', derivedUnits, {
      updateOnDuplicate: ['name', 'symbol', 'factor_to_base', 'offset_to_base', 'is_default', 'unit_group_id', 'base_unit_id', 'display_mode']
    });

    console.log('✅ Default units seeded/updated successfully');

    // 3. TEST GROUPS
    const testGroups = [
      { id: 1, title: JSON.stringify({ en: 'Speed', fi: 'Nopeus' }) },
      { id: 2, title: JSON.stringify({ en: 'Skill', fi: 'Taito' }) },
      { id: 3, title: JSON.stringify({ en: 'Cardio', fi: 'Kestävyys' }) }
    ];

    await queryInterface.bulkInsert('test_groups', testGroups, {
      updateOnDuplicate: ['title']
    });

    console.log('✅ Test groups seeded/updated successfully');

    // 3. TESTS AND FILLABLES
    // We need a user ID for createdById. Try to find one.
    const [users] = await queryInterface.sequelize.query('SELECT id FROM users LIMIT 1');
    const userId = users[0]?.id;

    if (!userId) {
      console.warn('⚠️  No users found in database. Skipping seeding of tests and fillables because createdById is required.');
      return;
    }

    const tests = [
      {
        id: 1,
        title: JSON.stringify({ en: 'Cooper Test', fi: 'Cooperin testi' }),
        notes: JSON.stringify({ en: 'Run as far as possible in 12 minutes.', fi: 'Juokse niin pitkälle kuin pystyt 12 minuutissa.' }),
        teamId: null,
        createdById: userId,
        scope: 'global',
        testGroupId: 3 // Cardio
      },
      {
        id: 2,
        title: JSON.stringify({ en: 'Juggling', fi: 'Pomputtelu' }),
        notes: JSON.stringify({ en: 'Keep the ball in the air.', fi: 'Pidä pallo ilmassa.' }),
        teamId: null,
        createdById: userId,
        scope: 'global',
        testGroupId: 2 // Skill
      },
      {
        id: 3,
        title: JSON.stringify({ en: 'Sprint', fi: 'Sprintti' }),
        notes: JSON.stringify({ en: 'Run as fast as possible.', fi: 'Juokse niin nopeasti kuin pystyt.' }),
        teamId: null,
        createdById: userId,
        scope: 'global',
        testGroupId: 1 // Speed
      }
    ];

    await queryInterface.bulkInsert('tests', tests, {
      updateOnDuplicate: ['title', 'notes', 'teamId', 'createdById', 'scope', 'testGroupId']
    });

    const testFillables = [
      {
        id: 1,
        testId: 1,
        unitId: 1, // Meter
        title: JSON.stringify({ en: 'Distance', fi: 'Matka' })
      },
      {
        id: 2,
        testId: 2,
        unitId: 62, // Amount
        title: JSON.stringify({ en: 'Count', fi: 'Määrä' })
      },
      {
        id: 3,
        testId: 3,
        unitId: 10, // Second
        title: JSON.stringify({ en: 'Time', fi: 'Aika' })
      }
    ];

    await queryInterface.bulkInsert('test_fillables', testFillables, {
      updateOnDuplicate: ['title', 'unitId', 'testId']
    });

    console.log('✅ Tests and fillables seeded/updated successfully');
  },

  async down(queryInterface, Sequelize) {
    console.log('🗑️  Removing seeded data...');

    // Delete in reverse order of dependency
    await queryInterface.bulkDelete('test_fillables', { id: [1, 2, 3] });
    await queryInterface.bulkDelete('tests', { id: [1, 2, 3] });
    await queryInterface.bulkDelete('test_groups', { id: [1, 2, 3] });

    await queryInterface.bulkDelete('units', { base_unit_id: { [Sequelize.Op.ne]: null } });
    await queryInterface.bulkDelete('units', { base_unit_id: null });
  }
};
