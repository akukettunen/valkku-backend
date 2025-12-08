'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🌱 Seeding default units and tests...');

    // 1. UNITS
    const units = [
      // Distance (Base: Meter)
      { id: 1, name: JSON.stringify({ en: 'Meter', fi: 'Metri' }), symbol: 'm', code: 'meter', unit_group: 'distance', base_unit_id: null, factor_to_base: 1.0, is_default: 1 },
      { id: 2, name: JSON.stringify({ en: 'Centimeter', fi: 'Senttimetri' }), symbol: 'cm', code: 'centimeter', unit_group: 'distance', base_unit_id: 1, factor_to_base: 0.01, is_default: 0 },
      { id: 3, name: JSON.stringify({ en: 'Millimeter', fi: 'Millimetri' }), symbol: 'mm', code: 'millimeter', unit_group: 'distance', base_unit_id: 1, factor_to_base: 0.001, is_default: 0 },
      { id: 4, name: JSON.stringify({ en: 'Kilometer', fi: 'Kilometri' }), symbol: 'km', code: 'kilometer', unit_group: 'distance', base_unit_id: 1, factor_to_base: 1000.0, is_default: 0 },
      { id: 5, name: JSON.stringify({ en: 'Inch', fi: 'Tuuma' }), symbol: 'in', code: 'inch', unit_group: 'distance', base_unit_id: 1, factor_to_base: 0.0254, is_default: 0 },
      { id: 6, name: JSON.stringify({ en: 'Foot', fi: 'Jalka' }), symbol: 'ft', code: 'foot', unit_group: 'distance', base_unit_id: 1, factor_to_base: 0.3048, is_default: 0 },
      { id: 7, name: JSON.stringify({ en: 'Yard', fi: 'Jaardi' }), symbol: 'yd', code: 'yard', unit_group: 'distance', base_unit_id: 1, factor_to_base: 0.9144, is_default: 0 },
      { id: 8, name: JSON.stringify({ en: 'Mile', fi: 'Maili' }), symbol: 'mi', code: 'mile', unit_group: 'distance', base_unit_id: 1, factor_to_base: 1609.344, is_default: 0 },

      // Time (Base: Second)
      { id: 10, name: JSON.stringify({ en: 'Second', fi: 'Sekunti' }), symbol: 's', code: 'second', unit_group: 'time', base_unit_id: null, factor_to_base: 1.0, is_default: 1 },
      { id: 11, name: JSON.stringify({ en: 'Minute', fi: 'Minuutti' }), symbol: 'min', code: 'minute', unit_group: 'time', base_unit_id: 10, factor_to_base: 60.0, is_default: 0 },
      { id: 12, name: JSON.stringify({ en: 'Hour', fi: 'Tunti' }), symbol: 'h', code: 'hour', unit_group: 'time', base_unit_id: 10, factor_to_base: 3600.0, is_default: 0 },

      // Mass (Base: Kilogram)
      { id: 20, name: JSON.stringify({ en: 'Kilogram', fi: 'Kilogramma' }), symbol: 'kg', code: 'kilogram', unit_group: 'mass', base_unit_id: null, factor_to_base: 1.0, is_default: 1 },
      { id: 21, name: JSON.stringify({ en: 'Gram', fi: 'Gramma' }), symbol: 'g', code: 'gram', unit_group: 'mass', base_unit_id: 20, factor_to_base: 0.001, is_default: 0 },
      { id: 22, name: JSON.stringify({ en: 'Pound', fi: 'Pauna' }), symbol: 'lb', code: 'pound', unit_group: 'mass', base_unit_id: 20, factor_to_base: 0.45359237, is_default: 0 },

      // Temperature (Base: Celsius)
      { id: 30, name: JSON.stringify({ en: 'Celsius', fi: 'Celsius' }), symbol: '°C', code: 'celsius', unit_group: 'temperature', base_unit_id: null, factor_to_base: 1.0, is_default: 1 },
      { id: 31, name: JSON.stringify({ en: 'Fahrenheit', fi: 'Fahrenheit' }), symbol: '°F', code: 'fahrenheit', unit_group: 'temperature', base_unit_id: 30, factor_to_base: 0.555555555555556, offset_to_base: -17.777777777777778, is_default: 0 },

      // Speed (Base: Meter per second)
      { id: 40, name: JSON.stringify({ en: 'Meters per second', fi: 'Metriä sekunnissa' }), symbol: 'm/s', code: 'meters_per_second', unit_group: 'speed', base_unit_id: null, factor_to_base: 1.0, is_default: 1 },
      { id: 41, name: JSON.stringify({ en: 'Kilometers per hour', fi: 'Kilometriä tunnissa' }), symbol: 'km/h', code: 'kilometers_per_hour', unit_group: 'speed', base_unit_id: 40, factor_to_base: 0.277777777777778, is_default: 0 },
      { id: 42, name: JSON.stringify({ en: 'Miles per hour', fi: 'Mailia tunnissa' }), symbol: 'mph', code: 'miles_per_hour', unit_group: 'speed', base_unit_id: 40, factor_to_base: 0.44704, is_default: 0 },

      // Angle (Base: Degree)
      { id: 50, name: JSON.stringify({ en: 'Degree', fi: 'Aste' }), symbol: '°', code: 'degree', unit_group: 'angle', base_unit_id: null, factor_to_base: 1.0, is_default: 1 },

      // Amount (Base: Empty)
      { id: 61, name: JSON.stringify({ en: 'Empty', fi: 'Tyhjä' }), symbol: ' ', code: 'empty', unit_group: 'amount', base_unit_id: null, factor_to_base: 1.0, is_default: 1 },
      { id: 62, name: JSON.stringify({ en: 'Amount', fi: 'Määrä' }), symbol: '#', code: 'amount', unit_group: 'amount', base_unit_id: 61, factor_to_base: 1.0, is_default: 0 },
    ];

    // Prepare base and derived units
    const baseUnits = units.filter(u => u.base_unit_id === null);
    const derivedUnits = units.filter(u => u.base_unit_id !== null);

    // Upsert base units
    await queryInterface.bulkInsert('units', baseUnits, {
      updateOnDuplicate: ['name', 'symbol', 'factor_to_base', 'offset_to_base', 'is_default', 'unit_group']
    });
    // Upsert derived units
    await queryInterface.bulkInsert('units', derivedUnits, {
      updateOnDuplicate: ['name', 'symbol', 'factor_to_base', 'offset_to_base', 'is_default', 'unit_group', 'base_unit_id']
    });

    console.log('✅ Default units seeded/updated successfully');

    // 2. TEST GROUPS
    const testGroups = [
      { id: 1, title: JSON.stringify({ en: 'Speed', fi: 'Nopeus' }) },
      { id: 2, title: JSON.stringify({ en: 'Skill', fi: 'Taito' }) },
      { id: 3, title: JSON.stringify({ en: 'Cardio', fi: 'Kestävyys' }) }
    ];

    await queryInterface.bulkInsert('test_groups', testGroups, {
      updateOnDuplicate: ['title']
    });

    console.log('✅ Test groups seeded/updated successfully');

    // 3. TESTS, VARIANTS, FILLABLES
    // We need a user ID for createdById. Try to find one.
    const [users] = await queryInterface.sequelize.query('SELECT id FROM users LIMIT 1');
    const userId = users[0]?.id;

    if (!userId) {
      console.warn('⚠️  No users found in database. Skipping seeding of tests, variants, and fillables because createdById is required.');
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

    const testVariants = [
      {
        id: 1,
        testId: 1,
        title: JSON.stringify({ en: 'Standard', fi: 'Vakio' }),
        createdById: userId
      },
      {
        id: 2,
        testId: 2,
        title: JSON.stringify({ en: 'Standard', fi: 'Vakio' }),
        createdById: userId
      },
      {
        id: 3,
        testId: 3,
        title: JSON.stringify({ en: 'Standard', fi: 'Vakio' }),
        createdById: userId
      }
    ];

    await queryInterface.bulkInsert('test_variants', testVariants, {
      updateOnDuplicate: ['title', 'createdById', 'testId']
    });

    const testVariantFillables = [
      {
        id: 1,
        testVariantId: 1,
        unitId: 1, // Meter
        title: JSON.stringify({ en: 'Distance', fi: 'Matka' })
      },
      {
        id: 2,
        testVariantId: 2,
        unitId: 62, // Amount
        title: JSON.stringify({ en: 'Count', fi: 'Määrä' })
      },
      {
        id: 3,
        testVariantId: 3,
        unitId: 10, // Second
        title: JSON.stringify({ en: 'Time', fi: 'Aika' })
      }
    ];

    await queryInterface.bulkInsert('test_variant_fillables', testVariantFillables, {
      updateOnDuplicate: ['title', 'unitId', 'testVariantId']
    });

    console.log('✅ Tests, variants, and fillables seeded/updated successfully');
  },

  async down(queryInterface, Sequelize) {
    console.log('🗑️  Removing seeded data...');

    // Delete in reverse order of dependency
    await queryInterface.bulkDelete('test_variant_fillables', { id: [1, 2, 3] });
    await queryInterface.bulkDelete('test_variants', { id: [1, 2, 3] });
    await queryInterface.bulkDelete('tests', { id: [1, 2, 3] });
    await queryInterface.bulkDelete('test_groups', { id: [1, 2, 3] });

    await queryInterface.bulkDelete('units', { base_unit_id: { [Sequelize.Op.ne]: null } });
    await queryInterface.bulkDelete('units', { base_unit_id: null });
  }
};
