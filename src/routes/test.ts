import { Router, Request, Response } from 'express';
import { models, sequelize } from '@/db/index';
import { requireSignedIn } from '@/middleware/auth';
import { AppError } from '@/middleware/errors';
import { testsCreationAttributes } from '@/models/tests';
import { testVariantsCreationAttributes } from '@/models/testVariants';
import { testVariantFillablesCreationAttributes } from '@/models/testVariantFillables';
import { testGroups } from '@/models/testGroups';

const router: Router = Router();

// --- ROUTES ---
// GET /test/groups - List all test groups
router.get('/groups', requireSignedIn, async (req: Request, res: Response) => {
  const groups = await models.testGroups.findAll();
  return res.status(200).json({
    success: true,
    data: groups
  });
});

// GET /test - List all tests (basic info)
router.get('/', requireSignedIn, async (req: Request, res: Response) => {
  // Optional filters from query params could be added here
  const tests = await models.tests.findAll({
    include: [
      {
        model: models.testGroups,
        as: 'testGroup',
        attributes: ['title']
      }
    ],
    order: [['updatedAt', 'DESC']]
  });

  // Flatten structure if needed, or return as nested
  const flattened = tests.map(t => {
    const plain = t.get({ plain: true }) as any;
    return {
      ...plain,
      groupTitle: plain.testGroup?.title
    };
  });

  return res.status(200).json({
    success: true,
    data: flattened
  });
});

// GET /test/:id - Get full test details
router.get('/:id', requireSignedIn, async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const testId = parseInt(id, 10);
  if (isNaN(testId)) {
    throw new AppError('Invalid test ID', 400, 'invalid_request');
  }

  const test = await models.tests.findByPk(testId, {
    include: [
      {
        model: models.testVariants,
        as: 'testVariants',
        include: [
          {
            model: models.testVariantFillables,
            as: 'testVariantFillables',
            include: [
              {
                model: models.units,
                as: 'unit'
              }
            ]
          }
        ]
      },
      {
        model: models.testGroups,
        as: 'testGroup'
      }
    ]
  });

  if (!test) {
    throw new AppError('Test not found', 404, 'test_not_found');
  }

  return res.status(200).json({
    success: true,
    data: test
  });
});

// POST /test - Create a new test
router.post('/', requireSignedIn, async (req: Request, res: Response) => {
  const { title, notes, testGroupId, scope, teamId, variants } = req.body;
  const createdById = req.user?.sub;

  if (!createdById) {
    throw new AppError('User not found', 404, 'user_not_found');
  }

  // Validation (basic)
  if (!title || !testGroupId) {
    throw new AppError('Missing required fields', 400, 'validation_error');
  }

  // Use managed transaction
  const createdTest = await sequelize.transaction(async (t) => {
    // 1. Create Test
    const testData: testsCreationAttributes = {
      title, // Sequelize handles JSON serialization if dialect supports it or if using object
      notes: notes || {},
      testGroupId,
      scope: scope || 'global',
      teamId: teamId || null,
      createdById
    };

    const newTest = await models.tests.create(testData, { transaction: t });

    // 2. Create Variants
    if (variants && Array.isArray(variants)) {
      for (const variant of variants) {
        const variantData: testVariantsCreationAttributes = {
          testId: newTest.id,
          title: variant.title,
          createdById
        };

        const newVariant = await models.testVariants.create(variantData, { transaction: t });

        // 3. Create Fillables
        if (variant.fillables && Array.isArray(variant.fillables)) {
          for (const fillable of variant.fillables) {
            const fillableData: testVariantFillablesCreationAttributes = {
              testVariantId: newVariant.id,
              unitId: fillable.unitId,
              title: fillable.title
            };
            await models.testVariantFillables.create(fillableData, { transaction: t });
          }
        }
      }
    }

    return newTest;
  });

  // Fetch the fully created test to return it
  const fullTest = await models.tests.findByPk(createdTest.id, {
    include: [
      {
        model: models.testVariants,
        as: 'testVariants',
        include: [
          {
            model: models.testVariantFillables,
            as: 'testVariantFillables'
          }
        ]
      }
    ]
  });

  return res.status(201).json({
    success: true,
    message: 'Test created successfully',
    data: fullTest
  });
});

// DELETE /test/:id - Delete a test
router.delete('/:id', requireSignedIn, async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const testId = parseInt(id, 10);
  if (isNaN(testId)) {
    throw new AppError('Invalid test ID', 400, 'invalid_request');
  }

  const test = await models.tests.findByPk(testId);
  if (!test) {
    throw new AppError('Test not found', 404, 'test_not_found');
  }

  // DB constraints (ON DELETE CASCADE) should handle children
  await test.destroy();

  return res.status(200).json({
    success: true,
    message: 'Test deleted successfully'
  });
});

export default router;
