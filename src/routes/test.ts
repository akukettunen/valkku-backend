import { Router, Request, Response } from 'express';
import { models, sequelize } from '@/db/index';
import { requireSignedIn, validateBasedOnScope, requireScope, requireSuperAdmin } from '@/middleware/auth';
import { AppError } from '@/middleware/errors';
import { testsCreationAttributes } from '@/models/tests';
import { testFillablesCreationAttributes } from '@/models/testFillables';
import { testResultsCreationAttributes } from '@/models/testResults';
import { testResultValuesCreationAttributes } from '@/models/testResultValues';
import { testEventsCreationAttributes } from '@/models/testEvents';
import { testEventTestsCreationAttributes } from '@/models/testEventTests';
import { Op } from 'sequelize';
import { ROLES } from '@/types/team';

const router: Router = Router();

// --- ADMIN ROUTES ---

// GET /test/groups/admin - List all test groups (admin)
// Defined first to ensure it's not captured by other routes
router.get('/groups/admin', requireSignedIn, requireSuperAdmin, async (req: Request, res: Response) => {
    const groups = await models.testGroups.findAll({
        where: { deletedAt: null },
        order: [['sort_order', 'ASC'], ['id', 'DESC']]
    });
    return res.status(200).json({ success: true, data: groups });
});

// PUT /test/groups/admin/order - Reorder test groups (admin)
router.put('/groups/admin/order', requireSignedIn, requireSuperAdmin, async (req: Request, res: Response) => {
    const { items } = req.body; // Array of { id, sort_order }

    if (!items || !Array.isArray(items)) {
        throw new AppError('Invalid payload', 400, 'validation_error');
    }

    await sequelize.transaction(async (t) => {
        for (const item of items) {
            await models.testGroups.update(
                { sortOrder: item.sort_order },
                { where: { id: item.id, deletedAt: null }, transaction: t }
            );
        }
    });

    return res.status(200).json({ success: true, message: 'Groups reordered' });
});

// GET /test/admin - List all global tests
router.get('/admin', requireSignedIn, requireSuperAdmin, async (req: Request, res: Response) => {
  const tests = await models.tests.findAll({
    where: { scope: 'global', deletedAt: null },
    include: [
      {
        model: models.testGroups,
        as: 'testGroup',
        attributes: ['title'],
        where: { deletedAt: null },
        required: false
      },
      {
        model: models.testFillables,
        as: 'testFillables',
        where: { deletedAt: null },
        required: false,
        include: [{ model: models.units, as: 'unit' }]
      }
    ],
    order: [['updatedAt', 'DESC']]
  });

  return res.status(200).json({
    success: true,
    data: tests
  });
});

// --- TEST GROUPS (ADMIN) ---

// POST /test/groups/admin - Create test group (admin)
router.post('/groups/admin', requireSignedIn, requireSuperAdmin, async (req: Request, res: Response) => {
    const { title } = req.body;
    if (!title) throw new AppError('Title is required', 400, 'validation_error');

    // title should be { fi: '...', en: '...' }
    const group = await models.testGroups.create({
        title
    });

    return res.status(201).json({ success: true, data: group });
});

// PUT /test/groups/admin/:id - Update test group (admin)
router.put('/groups/admin/:id', requireSignedIn, requireSuperAdmin, async (req: Request, res: Response) => {
    const id = req.params['id'];
    const { title } = req.body;
    if (!id) throw new AppError('Invalid ID', 400, 'validation_error');
    const groupId = parseInt(id, 10);

    if (isNaN(groupId)) throw new AppError('Invalid ID', 400, 'validation_error');
    if (!title) throw new AppError('Title is required', 400, 'validation_error');

    const group = await models.testGroups.findOne({ where: { id: groupId, deletedAt: null } });
    if (!group) throw new AppError('Group not found', 404, 'not_found');

    await group.update({ title });

    return res.status(200).json({ success: true, data: group });
});

// DELETE /test/groups/admin/:id - Delete test group (admin)
router.delete('/groups/admin/:id', requireSignedIn, requireSuperAdmin, async (req: Request, res: Response) => {
    const id = req.params['id'];
    if (!id) throw new AppError('Invalid ID', 400, 'validation_error');
    const groupId = parseInt(id, 10);

    if (isNaN(groupId)) throw new AppError('Invalid ID', 400, 'validation_error');

    const group = await models.testGroups.findOne({ where: { id: groupId, deletedAt: null } });
    if (!group) throw new AppError('Group not found', 404, 'not_found');

    // Check for tests using this group (active tests only)
    const count = await models.tests.count({ where: { testGroupId: groupId, deletedAt: null } });
    if (count > 0) {
        throw new AppError('Cannot delete group with associated tests', 400, 'constraint_error');
    }

    // Soft delete
    await group.update({ deletedAt: new Date() });

    return res.status(200).json({ success: true, message: 'Group deleted' });
});

// POST /test/admin - Create a new global test
router.post('/admin', requireSignedIn, requireSuperAdmin, async (req: Request, res: Response) => {
  const { title, notes, testGroupId, fillables, decimals } = req.body;
  const createdById = req.user?.sub;

  if (!createdById) throw new AppError('User not found', 404, 'user_not_found');
  if (!title || !testGroupId) throw new AppError('Missing required fields', 400, 'validation_error');

  const createdTest = await sequelize.transaction(async (t) => {
    const testData: testsCreationAttributes = {
      title,
      notes: notes || {},
      testGroupId,
      scope: 'global',
      createdById,
      decimals: decimals || 0
    };

    const newTest = await models.tests.create(testData, { transaction: t });

    if (fillables && Array.isArray(fillables)) {
        for (const fillable of fillables) {
        const fillableData: testFillablesCreationAttributes = {
            testId: newTest.id,
            unitId: fillable.unitId,
            title: fillable.title
        };
        await models.testFillables.create(fillableData, { transaction: t });
        }
    }

    return newTest;
  });

  const fullTest = await models.tests.findByPk(createdTest.id, {
    include: [{ model: models.testFillables, as: 'testFillables', include: [{ model: models.units, as: 'unit' }] }]
  });

  return res.status(201).json({
    success: true,
    message: 'Global test created successfully',
    data: fullTest
  });
});

// PUT /test/admin/:id - Update global test
router.put('/admin/:id', requireSignedIn, requireSuperAdmin, async (req: Request, res: Response) => {
    const id = req.params['id'];
    if (!id) throw new AppError('Invalid ID', 400, 'validation_error');
    const testId = parseInt(id, 10);
    const { title, notes, testGroupId, fillables, decimals } = req.body;

    if (isNaN(testId)) throw new AppError('Invalid ID', 400, 'validation_error');

    const test = await models.tests.findOne({ where: { id: testId, deletedAt: null } });
    if (!test) throw new AppError('Test not found', 404, 'not_found');

    const testData = test.get({ plain: true });
    if (testData.scope !== 'global') throw new AppError('Not a global test', 400, 'invalid_scope');

    await sequelize.transaction(async (t) => {
        const updates: any = {};
        if (title) updates.title = title;
        if (notes) updates.notes = notes;
        if (testGroupId) updates.testGroupId = testGroupId;
        if (decimals !== undefined) updates.decimals = decimals;
        await test.update(updates, { transaction: t });

        if (fillables && Array.isArray(fillables)) {
            const keepIds: number[] = [];
            const records = fillables.map(f => {
                const fId = f.id ? parseInt(String(f.id), 10) : undefined;
                const validId = (fId && !isNaN(fId)) ? fId : undefined;
                if (validId) keepIds.push(validId);

                return {
                    id: validId,
                    testId,
                    unitId: f.unitId,
                    title: f.title
                };
            });

            // Soft delete removed fillables
            await models.testFillables.update({ deletedAt: new Date() }, {
                where: {
                    testId,
                    id: { [Op.notIn]: keepIds },
                    deletedAt: null
                },
                transaction: t
            });

            // Upsert (Update existing, Create new)
            // For upsert, we need to handle bulkCreate carefully or do manual loop
            // Since we're soft deleting, we should probably not re-activate deleted ones unless explicit logic
            // But here we are syncing the list.
            // Let's just create new ones and update existing ones.
            for (const record of records) {
                if (record.id) {
                    await models.testFillables.update(
                        { title: record.title, unitId: record.unitId },
                        { where: { id: record.id, deletedAt: null }, transaction: t }
                    );
                } else {
                    await models.testFillables.create(
                        {
                            testId: record.testId,
                            unitId: record.unitId,
                            title: record.title
                        },
                        { transaction: t }
                    );
                }
            }
        }
    });

    const updatedTest = await models.tests.findByPk(testId, {
        include: [
            {
                model: models.testFillables,
                as: 'testFillables',
                where: { deletedAt: null },
                required: false,
                include: [{ model: models.units, as: 'unit' }]
            },
            { model: models.testGroups, as: 'testGroup' }
        ]
    });

    return res.status(200).json({ success: true, data: updatedTest });
});

// DELETE /test/admin/:id - Delete global test
router.delete('/admin/:id', requireSignedIn, requireSuperAdmin, async (req: Request, res: Response) => {
  const id = req.params['id'];
  if (!id) throw new AppError('Invalid test ID', 400, 'invalid_request');
  const testId = parseInt(id, 10);
  if (isNaN(testId)) throw new AppError('Invalid test ID', 400, 'invalid_request');

  const test = await models.tests.findOne({ where: { id: testId, deletedAt: null } });
  if (!test) throw new AppError('Test not found', 404, 'test_not_found');

  const testData = test.get({ plain: true });
  if (testData.scope !== 'global') throw new AppError('Not a global test', 400, 'invalid_scope');

  // Soft delete everything associated
  const now = new Date();

  // Results & Values
  const results = await models.testResults.findAll({ where: { testId, deletedAt: null } });
  if (results.length > 0) {
      const resultIds = results.map(r => r.id);
      await models.testResultValues.update({ deletedAt: now }, { where: { testResultId: resultIds, deletedAt: null } });
      await models.testResults.update({ deletedAt: now }, { where: { id: resultIds, deletedAt: null } });
  }

  // Fillables
  await models.testFillables.update({ deletedAt: now }, { where: { testId, deletedAt: null } });

  // Event Tests links
  await models.testEventTests.update({ deletedAt: now }, { where: { testId, deletedAt: null } });

  // Test
  await test.update({ deletedAt: now });

  return res.status(200).json({ success: true, message: 'Global test deleted successfully' });
});

// --- ROUTES ---

// GET /test/groups - List all test groups
router.get('/groups', requireSignedIn, async (req: Request, res: Response) => {
  const groups = await models.testGroups.findAll({
    where: { deletedAt: null },
    order: [['sort_order', 'ASC'], ['id', 'ASC']]
  });
  return res.status(200).json({
    success: true,
    data: groups
  });
});

// GET /test/results - Get results
router.get('/results', requireSignedIn, async (req: Request, res: Response) => {
  const { userId, teamId, testId, testEventId, startDate, endDate, excludeEventResults } = req.query;
  const user = req.user;

  const where: any = { deletedAt: null };

  if (teamId) {
      const teamRole = user?.teams?.find(t => String(t.teamId) === String(teamId));
      if (!teamRole) {
          return res.status(403).json({ success: false, message: 'Not in team' });
      }

      const isStaff = teamRole.roles.some(r => ['owner', 'admin', 'coach'].includes(r.role));
      if (!isStaff) {
          const guardianRoles = teamRole.roles.filter(r => r.role === 'guardian');
          const isAthlete = teamRole.roles.some(r => r.role === 'athlete');

          const allowedUserIds: string[] = [];
          if (isAthlete && user?.sub) allowedUserIds.push(user.sub);
          guardianRoles.forEach(r => {
              if (r.guardianOf) allowedUserIds.push(r.guardianOf);
          });

          // If querying for specific userId, validate it
          if (userId) {
              if (!allowedUserIds.includes(String(userId))) {
                  return res.status(200).json({ success: true, data: [] });
              }
              where.userId = userId;
          } else {
              // Restrict to allowed IDs
              if (allowedUserIds.length > 0) {
                  where.userId = { [Op.in]: allowedUserIds };
              } else {
                  return res.status(200).json({ success: true, data: [] });
              }
          }
      } else {
          // Staff can see all, so if userId is provided, use it
          if (userId) where.userId = userId;
      }
      where.teamId = teamId;
  } else {
      // No team context? Restrict to own results to be safe
      if (userId && String(userId) !== user?.sub) {
           return res.status(200).json({ success: true, data: [] });
      }
      if (user?.sub) where.userId = user.sub;
  }

  if (testEventId) where.testEventId = testEventId;
  if (testId) where.testId = testId;
  if (excludeEventResults === 'true') {
      where.testEventId = null;
  }
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date[Op.gte] = startDate;
    if (endDate) where.date[Op.lte] = endDate;
  }

  const results = await models.testResults.findAll({
    where,
    include: [
        {
            model: models.testResultValues,
            as: 'testResultValues',
            where: { deletedAt: null },
            required: false,
            include: [
                {
                    model: models.testFillables,
                    as: 'testFillable',
                    where: { deletedAt: null }, // Only include active fillables? Or keep historical context? Usually we want to see value even if fillable deleted?
                    // Actually if fillable is soft deleted, we might still want to see the value.
                    // But if the fillable was deleted from the test definition, maybe not?
                    // Let's assume we want to see it if the result value exists.
                    // But if we enforce deletedAt: null on fillable include, we hide values for deleted fillables.
                    required: false,
                    include: [{ model: models.units, as: 'unit' }]
                }
            ]
        },
        {
            model: models.tests,
            as: 'test',
            where: { deletedAt: null },
            required: false
        },
        {
            model: models.testEvents,
            as: 'testEvent',
            where: { deletedAt: null },
            required: false
        },
        {
            model: models.users,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email']
        }
    ],
    order: [['date', 'DESC']]
  });

  return res.status(200).json({
    success: true,
    data: results
  });
});

// POST /test/results - Record results (Batch or Individual)
router.post('/results', requireSignedIn, async (req: Request, res: Response) => {
  const { testId, testEventId, date, teamId, results } = req.body;
  const createdById = req.user?.sub;

  if (!createdById) {
    throw new AppError('User not found', 404, 'user_not_found');
  }

  if (!testId || !date || !results || !Array.isArray(results)) {
    throw new AppError('Invalid payload', 400, 'validation_error');
  }

  // If teamId is provided, user must belong to that team (prevents cross-team writes)
  if (teamId) {
      const inTeam = req.user?.teams?.some(t => String(t.teamId) === String(teamId));
      if (!inTeam) {
          throw new AppError('Not in team', 403, 'unauthorized');
      }
  }

  const checkPermission = () => {
      const userTeams = req.user?.teams || [];
      const currentTeam = userTeams.find(t => String(t.teamId) === String(teamId));

      if (!currentTeam) {
          return 'individual';
      }

      const isStaff = currentTeam.roles.some(r => ['owner', 'admin', 'coach'].includes(r.role));
      if (isStaff) return 'staff';

      return 'individual';
  };

  const permissionLevel = checkPermission();

  if (permissionLevel === 'individual') {
      for (const entry of results) {
          const targetUserId = entry.userId;
          if (targetUserId === createdById) continue;

          const userTeams = req.user?.teams || [];
          const currentTeam = userTeams.find(t => String(t.teamId) === String(teamId));
          const isGuardianOfTarget = currentTeam?.roles.some(r => r.role === 'guardian' && r.guardianOf === targetUserId);

          if (!isGuardianOfTarget) {
               throw new AppError('Unauthorized to add results for other users', 403, 'unauthorized');
          }
      }
  }

  const savedResults = await sequelize.transaction(async (t) => {
    const output = [];
    for (const entry of results) {
      const { userId, values } = entry;

      if (!userId || !values) continue;

      const tryOrder = entry.tryOrder || 1;
      const now = new Date();

      // Only do special merge logic for event results
      const isEvent = !!testEventId;
      let result: any = null;

      if (isEvent) {
          // If duplicates exist, keep newest active one and soft-delete older ones + their values
          const existingResults = await models.testResults.findAll({
              where: {
                  testId,
                  testEventId,
                  userId,
                  tryOrder,
                  deletedAt: null
              },
              order: [['id', 'DESC']],
              transaction: t
          });

          if (existingResults.length > 0) {
              result = existingResults[0];
              const extra = existingResults.slice(1);
              if (extra.length > 0) {
                  const extraIds = extra.map(r => r.getDataValue('id') || (r as any).id).filter(Boolean);
                  if (extraIds.length > 0) {
                      await models.testResultValues.update(
                          { deletedAt: now },
                          { where: { testResultId: { [Op.in]: extraIds }, deletedAt: null }, transaction: t }
                      );
                      await models.testResults.update(
                          { deletedAt: now },
                          { where: { id: { [Op.in]: extraIds }, deletedAt: null }, transaction: t }
                      );
                  }
              }
          }

          // If no active result exists yet, create one only if there's at least one numeric value
          const hasAnyRealValue = Array.isArray(values) && values.some(v => v && v.value !== null && v.value !== undefined && v.value !== '');
          if (!result) {
              if (!hasAnyRealValue) {
                  continue;
              }
              const resultData: testResultsCreationAttributes = {
                  userId,
                  testId,
                  testEventId: testEventId || null,
                  date,
                  createdById,
                  teamId: teamId || null,
                  tryOrder
              };
              result = await models.testResults.create(resultData, { transaction: t });
          } else {
              await result.update({ date }, { transaction: t });
          }

          const resultId = result.getDataValue('id') || result.id || (result as any).dataValues?.id;
          if (!resultId) continue;

          // Upsert per fillable:
          // - value === null means "delete this fillable value" (soft delete)
          // - numeric value means "upsert/update"
          for (const v of values) {
              const fillableId = v?.testFillableId ?? v?.fillableId;
              if (fillableId === undefined) continue;

              const incoming = v?.value;

              if (incoming === null) {
                  await models.testResultValues.update(
                      { deletedAt: now },
                      { where: { testResultId: resultId, testFillableId: fillableId, deletedAt: null }, transaction: t }
                  );
                  continue;
              }

              if (incoming === undefined || incoming === '') {
                  // Missing/invalid -> don't touch existing value
                  continue;
              }

              const existingValue = await models.testResultValues.findOne({
                  where: { testResultId: resultId, testFillableId: fillableId, deletedAt: null },
                  transaction: t
              });

              if (existingValue) {
                  await existingValue.update({ value: incoming }, { transaction: t });
              } else {
                  const valueData: testResultValuesCreationAttributes = {
                      testResultId: resultId,
                      testFillableId: fillableId,
                      value: incoming
                  };
                  await models.testResultValues.create(valueData, { transaction: t });
              }
          }

          // If after deletes we have no active values left, soft-delete the result row too
          const remaining = await models.testResultValues.count({
              where: { testResultId: resultId, deletedAt: null },
              transaction: t
          });
          if (remaining === 0) {
              await models.testResults.update(
                  { deletedAt: now },
                  { where: { id: resultId, deletedAt: null }, transaction: t }
              );
          }

          output.push(result);
          continue;
      }

      // Non-event (individual) fallback: keep existing behavior (create new values, etc.)

      if (!values || values.length === 0) {
          continue;
      }

      const resultData: testResultsCreationAttributes = {
          userId,
          testId,
          date,
          createdById,
          ...(teamId ? { teamId } : {}),
          tryOrder: entry.tryOrder || 1
      };
      result = await models.testResults.create(resultData, { transaction: t });

      // Use a safe ID accessor
      const resultId = result.id || result.dataValues?.id;

      if (result && resultId) {
          for (const val of values) {
            const fillableId = val.testFillableId || val.fillableId;

            if (fillableId !== undefined && val.value !== undefined && val.value !== '' && val.value !== null) {
                 const valueData: testResultValuesCreationAttributes = {
                    testResultId: resultId,
                    testFillableId: fillableId,
                    value: val.value
                };
                await models.testResultValues.create(valueData, { transaction: t });
            }
          }
      }
      output.push(result);
    }
    return output;
  });

  return res.status(201).json({
    success: true,
    message: 'Results recorded successfully',
    data: savedResults
  });
});

// DELETE /test/results/try - Delete a specific try for an event test
router.delete('/results/try', requireSignedIn, validateBasedOnScope('test-result:delete'), async (req: Request, res: Response) => {
    const { testEventId, testId, tryOrder, teamId, scope } = req.query;

    if (!testEventId || !testId || !tryOrder) throw new AppError('Missing required fields', 400, 'validation_error');

    // Find results first to delete values manually
    const where: any = {
        testEventId: parseInt(testEventId as string, 10),
        testId: parseInt(testId as string, 10),
        tryOrder: parseInt(tryOrder as string, 10),
        deletedAt: null
    };

    // For individual scope, restrict deletion to own results (or guardian wards) only
    if (scope === 'user') {
        const allowedUserIds: string[] = [];
        if (req.user?.sub) allowedUserIds.push(String(req.user.sub));

        if (teamId) {
            const teamRole = req.user?.teams?.find(t => String(t.teamId) === String(teamId));
            const guardianRoles = teamRole?.roles?.filter((r: any) => r.role === 'guardian') || [];
            guardianRoles.forEach((r: any) => {
                if (r.guardianOf) allowedUserIds.push(String(r.guardianOf));
            });
        }

        where.userId = { [Op.in]: allowedUserIds };
    }

    const results = await models.testResults.findAll({ where });

    if (results.length > 0) {
        const now = new Date();
        // Use dataValues or getDataValue because class fields might shadow the getter
        const resultIds = results.map(r => r.getDataValue('id') || (r as any).id);

        await models.testResultValues.update({ deletedAt: now }, {
            where: {
                testResultId: { [Op.in]: resultIds },
                deletedAt: null
            }
        });
        await models.testResults.update({ deletedAt: now }, {
            where: {
                id: { [Op.in]: resultIds }
            }
        });
    }

    return res.status(200).json({
        success: true,
        message: 'Try deleted'
    });
});

// DELETE /test/results/:id - Delete a test result
router.delete('/results/:id', requireSignedIn, validateBasedOnScope('test-result:delete'), async (req: Request, res: Response) => {
    const id = req.params['id'];
    if (!id) throw new AppError('Invalid ID', 400, 'validation_error');
    const resultId = parseInt(id, 10);
    const { teamId, scope } = req.query;

    if (isNaN(resultId)) throw new AppError('Invalid ID', 400, 'validation_error');

    const result = await models.testResults.findOne({ where: { id: resultId, deletedAt: null } });
    if (!result) throw new AppError('Result not found', 404, 'not_found');

    // For individual scope, verify ownership/guardian access before deleting
    if (scope === 'user') {
        const resultData: any = (result as any).get ? (result as any).get({ plain: true }) : (result as any);
        const resultUserId = String(resultData.userId);

        const allowedUserIds: string[] = [];
        if (req.user?.sub) allowedUserIds.push(String(req.user.sub));

        if (teamId) {
            const teamRole = req.user?.teams?.find(t => String(t.teamId) === String(teamId));
            const guardianRoles = teamRole?.roles?.filter((r: any) => r.role === 'guardian') || [];
            guardianRoles.forEach((r: any) => {
                if (r.guardianOf) allowedUserIds.push(String(r.guardianOf));
            });
        }

        if (!allowedUserIds.includes(resultUserId)) {
            throw new AppError('Unauthorized', 403, 'unauthorized');
        }
    }

    const now = new Date();
    await models.testResultValues.update({ deletedAt: now }, { where: { testResultId: resultId, deletedAt: null } });
    await result.update({ deletedAt: now });

    return res.status(200).json({
        success: true,
        message: 'Result deleted'
    });
});


// GET /test/events - List test events
router.get('/events', requireSignedIn, requireScope('test-event:read', 'team'), async (req: Request, res: Response) => {
  const { teamId, startDate, endDate } = req.query;

  const where: any = { deletedAt: null };
  if (teamId) where.teamId = teamId;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date[Op.gte] = startDate;
    if (endDate) where.date[Op.lte] = endDate;
  }

  const events = await models.testEvents.findAll({
    where,
    include: [
        {
            model: models.testEventTests,
            as: 'testEventTests',
            where: { deletedAt: null },
            required: false,
            include: [
                {
                    model: models.tests,
                    as: 'test',
                    where: { deletedAt: null },
                    required: false,
                    include: [
                        {
                            model: models.testFillables,
                            as: 'testFillables',
                            where: { deletedAt: null },
                            required: false,
                            include: [{ model: models.units, as: 'unit' }]
                        }
                    ]
                }
            ]
        }
    ],
    order: [['date', 'DESC']]
  });

  const plainEvents = events.map((event: any) => {
      const e = event.get({ plain: true });
      e.tests = e.testEventTests ? e.testEventTests.map((tet: any) => tet.test).filter((t: any) => t) : [];
      delete e.testEventTests;
      return e;
  });

  return res.status(200).json({
    success: true,
    data: plainEvents
  });
});

// POST /test/events - Create test event
router.post('/events', requireSignedIn, requireScope('test-event:create', 'team'), async (req: Request, res: Response) => {
    const { teamId, date, name, testIds } = req.body;
    const createdById = req.user?.sub;

    if (!createdById) throw new AppError('User not found', 404, 'user_not_found');
    if (!teamId || !date) throw new AppError('Missing required fields', 400, 'validation_error');

    const result = await sequelize.transaction(async (t) => {
        const eventData: testEventsCreationAttributes = {
            teamId,
            date,
            ...(name ? { name: { fi: name, en: name } } : {}),
            createdById
        };

        const event = await models.testEvents.create(eventData, { transaction: t });

        if (testIds && Array.isArray(testIds)) {
            for (const tId of testIds) {
                const linkData: testEventTestsCreationAttributes = {
                    testEventId: event.id,
                    testId: tId
                };
                await models.testEventTests.create(linkData, { transaction: t });
            }
        }
        return event;
    });

    return res.status(201).json({
        success: true,
        data: result
    });
});

// PUT /test/events/:id - Update test event
router.put('/events/:id', requireSignedIn, requireScope('test-event:update', 'team'), async (req: Request, res: Response) => {
    const id = req.params['id'];
    if (!id) throw new AppError('Invalid ID', 400, 'validation_error');
    const eventId = parseInt(id, 10);
    const { name, date, testIds } = req.body;

    if (isNaN(eventId)) throw new AppError('Invalid ID', 400, 'validation_error');

    const event = await models.testEvents.findOne({ where: { id: eventId, deletedAt: null } });
    if (!event) throw new AppError('Event not found', 404, 'not_found');

    await sequelize.transaction(async (t) => {
        const updates: any = {};
        if (name) updates.name = { fi: name, en: name };
        if (date) updates.date = date;
        await event.update(updates, { transaction: t });

        if (testIds && Array.isArray(testIds)) {
            // Replace linked tests (Soft delete)
            await models.testEventTests.update({ deletedAt: new Date() }, { where: { testEventId: eventId, deletedAt: null }, transaction: t });

            // Or really just destroy? Soft delete links is safer.
            // If we re-add same test, we should check if it exists and restore it or create new?
            // To keep simple, let's create new ones. Old ones stay deleted.
            for (const tId of testIds) {
                await models.testEventTests.create({
                    testEventId: eventId,
                    testId: tId
                }, { transaction: t });
            }
        }
    });

    // Refetch to return full object
    const updatedEvent = await models.testEvents.findByPk(eventId, {
        include: [
            {
                model: models.testEventTests,
                as: 'testEventTests',
                where: { deletedAt: null },
                required: false,
                include: [
                    {
                        model: models.tests,
                        as: 'test',
                        where: { deletedAt: null },
                        required: false,
                        include: [
                            {
                                model: models.testFillables,
                                as: 'testFillables',
                                where: { deletedAt: null },
                                required: false,
                                include: [{ model: models.units, as: 'unit' }]
                            }
                        ]
                    }
                ]
            }
        ]
    });

    const plainEvent = (updatedEvent?.get({ plain: true }) as any) || null;
    const data = plainEvent
        ? {
              ...plainEvent,
              tests: plainEvent.testEventTests ? plainEvent.testEventTests.map((tet: any) => tet.test).filter((t: any) => t) : []
          }
        : null;
    if (data) delete (data as any).testEventTests;

    return res.status(200).json({ success: true, data });
});

// DELETE /test/events/:id - Delete test event (and associated results/values)
router.delete('/events/:id', requireSignedIn, requireScope('test-event:delete', 'team'), async (req: Request, res: Response) => {
    const id = req.params['id'];
    if (!id) throw new AppError('Invalid ID', 400, 'validation_error');
    const eventId = parseInt(id, 10);
    if (isNaN(eventId)) throw new AppError('Invalid ID', 400, 'validation_error');

    const event = await models.testEvents.findOne({ where: { id: eventId, deletedAt: null } });
    if (!event) throw new AppError('Event not found', 404, 'not_found');

    const now = new Date();
    const transaction = await sequelize.transaction();

    try {
        // Soft delete links to tests
        await models.testEventTests.update(
            { deletedAt: now },
            { where: { testEventId: eventId, deletedAt: null }, transaction }
        );

        // Soft delete results and their values tied to this event
        const existingResults = await models.testResults.findAll({
            where: { testEventId: eventId, deletedAt: null },
            transaction
        });

        if (existingResults.length > 0) {
            const resultIds = existingResults.map(r => r.getDataValue('id') || (r as any).id).filter(Boolean);

            if (resultIds.length > 0) {
                await models.testResultValues.update(
                    { deletedAt: now },
                    { where: { testResultId: { [Op.in]: resultIds }, deletedAt: null }, transaction }
                );
            }

            await models.testResults.update(
                { deletedAt: now },
                { where: { id: { [Op.in]: resultIds }, deletedAt: null }, transaction }
            );
        }

        // Soft delete the event
        await event.update({ deletedAt: now }, { transaction });

        await transaction.commit();
    } catch (err) {
        await transaction.rollback();
        throw err;
    }

    return res.status(200).json({ success: true });
});


// GET /test - List all tests (basic info)
router.get('/', requireSignedIn, async (req: Request, res: Response) => {
  const { teamId } = req.query;
  const where: any = { deletedAt: null };

  if (teamId) {
      // Prevent leaking other teams' tests
      const inTeam = req.user?.teams?.some(t => String(t.teamId) === String(teamId));
      if (!inTeam) {
          return res.status(403).json({ success: false, message: 'Not in team' });
      }
      where[Op.or] = [
          { teamId },
          { scope: 'global' }
      ];
  } else {
      // Default to global only to avoid leaking other teams' tests
      where.scope = 'global';
  }

  const tests = await models.tests.findAll({
    where,
    include: [
      {
        model: models.testGroups,
        as: 'testGroup',
        attributes: ['title'],
        where: { deletedAt: null },
        required: false
      },
      {
        model: models.testFillables,
        as: 'testFillables',
        where: { deletedAt: null },
        required: false,
        include: [{ model: models.units, as: 'unit' }]
      }
    ],
    order: [['updatedAt', 'DESC']]
  });

  return res.status(200).json({
    success: true,
    data: tests
  });
});

// GET /test/:id - Get full test details
router.get('/:id', requireSignedIn, async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const testId = parseInt(id, 10);
  if (isNaN(testId)) {
    throw new AppError('Invalid test ID', 400, 'invalid_request');
  }

  const test = await models.tests.findOne({
    where: { id: testId, deletedAt: null },
    include: [
      {
        model: models.testFillables,
        as: 'testFillables',
        where: { deletedAt: null },
        required: false,
        include: [
          {
            model: models.units,
            as: 'unit'
          }
        ]
      },
      {
        model: models.testGroups,
        as: 'testGroup',
        where: { deletedAt: null },
        required: false
      }
    ]
  });

  if (!test) {
    throw new AppError('Test not found', 404, 'test_not_found');
  }

  // Prevent leaking other teams' tests
  const testPlain: any = (test as any).get ? (test as any).get({ plain: true }) : (test as any);
  if (testPlain?.scope !== 'global') {
      const inTeam = req.user?.teams?.some(t => String(t.teamId) === String(testPlain.teamId));
      if (!inTeam) {
          return res.status(403).json({ success: false, message: 'Not in team' });
      }
  }

  return res.status(200).json({
    success: true,
    data: test
  });
});

// POST /test - Create a new test
router.post('/', requireSignedIn, requireScope('test:create', 'team'), async (req: Request, res: Response) => {
  const { title, notes, testGroupId, scope, teamId, fillables, decimals } = req.body;
  const createdById = req.user?.sub;

  if (!createdById) {
    throw new AppError('User not found', 404, 'user_not_found');
  }

  if (!title || !testGroupId) {
    throw new AppError('Missing required fields', 400, 'validation_error');
  }

  // Prevent creating global tests via team-scoped endpoint
  if (scope === 'global') {
    throw new AppError('Cannot create global test', 403, 'forbidden');
  }

  if (!teamId) {
    throw new AppError('Missing teamId', 400, 'validation_error');
  }

  const createdTest = await sequelize.transaction(async (t) => {
    const testData: testsCreationAttributes = {
      title,
      notes: notes || {},
      testGroupId,
      scope: scope || 'team',
      teamId,
      createdById,
      decimals: decimals || 0
    };

    const newTest = await models.tests.create(testData, { transaction: t });

    if (fillables && Array.isArray(fillables)) {
        for (const fillable of fillables) {
        const fillableData: testFillablesCreationAttributes = {
            testId: newTest.id,
            unitId: fillable.unitId,
            title: fillable.title
        };
        await models.testFillables.create(fillableData, { transaction: t });
        }
    }

    return newTest;
  });

  const fullTest = await models.tests.findByPk(createdTest.id, {
    include: [
      {
        model: models.testFillables,
        as: 'testFillables'
      }
    ]
  });

  return res.status(201).json({
    success: true,
    message: 'Test created successfully',
    data: fullTest
  });
});

// PUT /test/:id - Update test
router.put('/:id', requireSignedIn, requireScope('test:update', 'team'), async (req: Request, res: Response) => {
    const id = req.params['id'];
    if (!id) throw new AppError('Invalid ID', 400, 'validation_error');
    const testId = parseInt(id, 10);
    const { title, notes, testGroupId, fillables, decimals } = req.body;

    if (isNaN(testId)) throw new AppError('Invalid ID', 400, 'validation_error');

    const test = await models.tests.findOne({ where: { id: testId, deletedAt: null } });
    if (!test) throw new AppError('Test not found', 404, 'not_found');

    const testData = test.get({ plain: true });
    if (testData.scope === 'global') throw new AppError('Cannot modify global test', 403, 'forbidden');

    // Check ownership or staff role
    const userTeams = req.user?.teams || [];
    // We assume the test belongs to the team context of the request, or we can check test.teamId
    // If the test has teamId, we check against that.
    // If not, it might be weird (scope=team but no teamId?), but we can check createdBy.

    // For requireScope middleware to work, it checked roles.
    // But we expanded roles to include athlete/guardian.
    // So now we must restrict them to their own tests.

    const isOwner = testData.createdById === req.user?.sub;

    // Check if user is staff in the team this test belongs to
    let isStaff = false;
    if (testData.teamId) {
        const team = userTeams.find(t => String(t.teamId) === String(testData.teamId));
        if (team) {
            isStaff = team.roles.some(r => ['owner', 'admin', 'coach'].includes(r.role));
        }
    }

    // Prevent cross-team modifications (even for owners who are no longer in the team)
    if (testData.teamId) {
        const inTeam = userTeams.some(t => String(t.teamId) === String(testData.teamId));
        if (!inTeam) {
            throw new AppError('Not in team', 403, 'unauthorized');
        }
    }

    if (!isStaff && !isOwner) {
        throw new AppError('Unauthorized to update this test', 403, 'unauthorized');
    }

    await sequelize.transaction(async (t) => {
        const updates: any = {};
        if (title) updates.title = title;
        if (notes) updates.notes = notes;
        if (testGroupId) updates.testGroupId = testGroupId;
        if (decimals !== undefined) updates.decimals = decimals;
        await test.update(updates, { transaction: t });

        if (fillables && Array.isArray(fillables)) {
            const keepIds: number[] = [];
            const records = fillables.map(f => {
                const fId = f.id ? parseInt(String(f.id), 10) : undefined;
                const validId = (fId && !isNaN(fId)) ? fId : undefined;
                if (validId) keepIds.push(validId);

                return {
                    id: validId,
                    testId,
                    unitId: f.unitId,
                    title: f.title
                };
            });

            // Soft delete removed fillables
            await models.testFillables.update({ deletedAt: new Date() }, {
                where: {
                    testId,
                    id: { [Op.notIn]: keepIds },
                    deletedAt: null
                },
                transaction: t
            });

            // Upsert (Update existing, Create new)
            for (const record of records) {
                if (record.id) {
                    await models.testFillables.update(
                        { title: record.title, unitId: record.unitId },
                        { where: { id: record.id, deletedAt: null }, transaction: t }
                    );
                } else {
                    await models.testFillables.create(
                        {
                            testId: record.testId,
                            unitId: record.unitId,
                            title: record.title
                        },
                        { transaction: t }
                    );
                }
            }
        }
    });

    // Refetch to return full object
    const updatedTest = await models.tests.findByPk(testId, {
        include: [
            {
                model: models.testFillables,
                as: 'testFillables',
                where: { deletedAt: null },
                required: false,
                include: [{ model: models.units, as: 'unit' }]
            },
            {
                model: models.testGroups,
                as: 'testGroup',
                where: { deletedAt: null },
                required: false
            }
        ]
    });

    return res.status(200).json({ success: true, data: updatedTest });
});

// DELETE /test/:id - Delete a test
router.delete('/:id', requireSignedIn, requireScope('test:delete', 'team'), async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const testId = parseInt(id, 10);
  if (isNaN(testId)) throw new AppError('Invalid test ID', 400, 'invalid_request');

  const test = await models.tests.findOne({ where: { id: testId, deletedAt: null } });
  if (!test) throw new AppError('Test not found', 404, 'test_not_found');

  const testData = test.get({ plain: true });
  if (testData.scope === 'global') throw new AppError('Cannot delete global test', 403, 'forbidden');

  // Check ownership or staff role
  const userTeams = req.user?.teams || [];
  const isOwner = testData.createdById === req.user?.sub;

  let isStaff = false;
  if (testData.teamId) {
      const team = userTeams.find(t => String(t.teamId) === String(testData.teamId));
      if (team) {
          isStaff = team.roles.some(r => ['owner', 'admin', 'coach'].includes(r.role));
      }
  }

  // Prevent cross-team deletions (even for owners who are no longer in the team)
  if (testData.teamId) {
      const inTeam = userTeams.some(t => String(t.teamId) === String(testData.teamId));
      if (!inTeam) {
          throw new AppError('Not in team', 403, 'unauthorized');
      }
  }

  if (!isStaff && !isOwner) {
      throw new AppError('Unauthorized to delete this test', 403, 'unauthorized');
  }

  const now = new Date();

  // Manual cleanup (Soft Delete)
  // 1. Delete result values for any results associated with this test
  // (Requires 2 steps or complex query, but we can just delete results and let values cascade if we trust that part,
  // or do it fully manually)

  // Find results for this test
  const results = await models.testResults.findAll({ where: { testId, deletedAt: null } });
  if (results.length > 0) {
      const resultIds = results.map(r => r.id);
      await models.testResultValues.update({ deletedAt: now }, { where: { testResultId: resultIds, deletedAt: null } });
      await models.testResults.update({ deletedAt: now }, { where: { id: resultIds, deletedAt: null } });
  }

  // 2. Delete test fillables
  await models.testFillables.update({ deletedAt: now }, { where: { testId, deletedAt: null } });

  // 3. Delete links to events
  await models.testEventTests.update({ deletedAt: now }, { where: { testId, deletedAt: null } });

  await test.update({ deletedAt: now });

  return res.status(200).json({
    success: true,
    message: 'Test deleted successfully'
  });
});

export default router;
