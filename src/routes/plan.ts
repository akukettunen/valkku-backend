import { Router, Request, Response, NextFunction } from 'express';
import { AppError } from '@/middleware/errors';
import { z } from 'zod';
import { validate } from '@/middleware/validation';
import { requireSignedIn, validateBasedOnScope, requireSuperAdmin } from '@/middleware/auth';
import { createEventPlanPartTypeSchema } from '@/schemas/event';
import { OBJECT_SCOPE } from '@/types/general';
import { EVENT_PLAN_PART_SCOPE, PlanPartType, LocalizationObject, Plan, PlanPartItem, PlanPart } from '@/types/event';
import { updatePlanPartType, deletePlanPartType, getPlanPartTypes, getPlanPartTypeById, createPlanPartType, updatePlanPartTypePosition } from '@/db/event';
import { createPlanSchema, createPlanPartSchema, updatePlanPartSchema } from '@/schemas/plan';
import { sequelize, models } from '@/db/index';
import { getPlanById, getPlanByEventId, getPlansWithParts, savePlanPartItems, updatePlanPart } from '@/utils/planHelper';
import { requireScope } from '@/middleware/auth';

const router: Router = Router();

const updateEventPlanPartTypePositionsSchema = z.object({
  scope: z.enum([ 'global', 'club', 'team', 'user' ]),
  positions: z.array(z.object({
    id: z.number(),
    pos: z.number()
  }))
});

// CHECK
router.post('/', requireSignedIn, validate(createPlanSchema), validateBasedOnScope('plan:create'), async (req: Request, res: Response) => {
  const {
    title,
    description,
    teamId,
    copyOfPlanId,
    scope,
    showInLibrary,
    parts,
    items
  } = req.body as {
    title?: string | null;
    description?: string | null;
    teamId: string;
    copyOfPlanId?: number | null;
    scope: OBJECT_SCOPE;
    showInLibrary?: boolean;
    parts: Array<{
      id: string;
      title?: string | null;
      description?: string | null;
      durationInMinutes: number;
      typeId: number;
      position: number;
    }>;
    items: Array<{
      id: string;
      partId: string;
      position: number;
      type: 'audio' | 'video' | 'text' | 'image' | 'file' | 'rest';
      item?: { text?: string };
    }>;
  };

  const planId = await sequelize.transaction(async (t) => {
    // Create the plan
    const plan = await models.plans.create({
      title: title ?? null,
      description: description ?? null,
      teamId,
      copyOfPlanId: copyOfPlanId ?? null,
      scope,
      showInLibrary: showInLibrary ? 1 : 0,
      createdById: req.user?.sub
    } as any, { transaction: t });

    const newPlanId = plan.id;

    // Track which parts are newly created vs reused
    const newlyCreatedPartIds = new Set<string>();

    // Create each part
    for (const part of parts) {
      // Check if the part already exists (reusing from library)
      const existingPart = await models.planParts.findByPk(part.id, { transaction: t });

      if (!existingPart) {
        // Create new part
        await models.planParts.create({
          id: part.id,
          teamId,
          title: part.title ?? null,
          description: part.description ?? null,
          durationInMinutes: part.durationInMinutes,
          typeId: part.typeId,
          position: part.position,
          scope,
          showInLibrary: 0,
          createdById: req.user?.sub
        } as any, { transaction: t });
        newlyCreatedPartIds.add(part.id);
      }

      // Create plan-part relationship
      await models.planPlanParts.create({
        planId: newPlanId,
        planPartId: part.id,
        position: part.position
      } as any, { transaction: t });
    }

    // Create items ONLY for newly created parts
    const itemsToCreate = items.filter(item => newlyCreatedPartIds.has(item.partId));

    for (const item of itemsToCreate) {
      // Create the item
      await models.planPartItems.create({
        id: item.id,
        partId: item.partId,
        position: item.position,
        type: item.type
      } as any, { transaction: t });

      // If it's a text item, create the text entry
      if (item.type === 'text' && item.item?.text) {
        await models.planPartItemTexts.create({
          planPartItemId: item.id,
          text: item.item.text
        } as any, { transaction: t });
      }
    }

    return newPlanId;
  });

  const plan = await getPlanById(planId, teamId);

  if (!plan) {
    throw new AppError('Plan not found', 404, 'plan_not_found');
  }

  res.status(201).json({
    success: true,
    message: 'Plan created successfully',
    data: plan as any
  });
});

router.put('/:planId/team/:teamId', requireSignedIn, requireScope('plan:update', 'team'), async (req: Request, res: Response, next: NextFunction) => {
  const { planId, teamId } = req.params as { planId: string, teamId: string };
  const { title, description, showInLibrary, parts, items } = req.body as {
    title?: string | null;
    description?: string | null;
    showInLibrary?: boolean;
    parts: Array<{
      id: string;
      title?: string | null;
      description?: string | null;
      durationInMinutes: number;
      typeId: number;
      position: number;
    }>;
    items: Array<{
      id: string;
      partId: string;
      position: number;
      type: 'audio' | 'video' | 'text' | 'image' | 'file' | 'rest';
      item?: { text?: string };
    }>;
  };

  await sequelize.transaction(async (t) => {
    // Find and verify the plan
    const plan = await models.plans.findOne({
      where: { id: parseInt(planId), teamId },
      transaction: t
    });

    if (!plan) {
      throw new AppError('Plan not found', 404, 'plan_not_found');
    }

    // Update plan metadata
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (showInLibrary !== undefined) updateData.showInLibrary = showInLibrary ? 1 : 0;

    if (Object.keys(updateData).length > 0) {
      await plan.update(updateData, { transaction: t });
    }

    // Get current plan-part relationships
    const currentRelationships = await models.planPlanParts.findAll({
      where: { planId: parseInt(planId) },
      transaction: t
    });

    const newPartIds = new Set(parts.map(p => p.id));

    // Remove relationships for parts no longer in the plan
    const partsToRemove = currentRelationships.filter(r => !newPartIds.has(r.planPartId));
    for (const rel of partsToRemove) {
      await rel.destroy({ transaction: t });
    }

    // Process each part in the new list
    for (const part of parts) {
      // Check if part exists in database
      const existingPart = await models.planParts.findByPk(part.id, { transaction: t });

      if (!existingPart) {
        // Create new part
        await models.planParts.create({
          id: part.id,
          teamId,
          title: part.title ?? null,
          description: part.description ?? null,
          durationInMinutes: part.durationInMinutes,
          typeId: part.typeId,
          position: part.position,
          scope: plan.scope,
          showInLibrary: 0,
          createdById: req.user?.sub
        } as any, { transaction: t });

        // Handle items for new parts
        const partItems = items.filter(item => item.partId === part.id);
        if (partItems.length > 0) {
          await savePlanPartItems(partItems as any, t);
        }
      } else {
        // Update existing part
        const partItems = items.filter(item => item.partId === part.id);
        await updatePlanPart(
          part.id,
          {
            title: part.title,
            description: part.description,
            durationInMinutes: part.durationInMinutes,
            typeId: part.typeId,
            position: part.position
          },
          partItems as any,
          t
        );
      }

      // Create or update the plan-part relationship
      const existingRelationship = currentRelationships.find(r => r.planPartId === part.id);

      if (existingRelationship) {
        // Update position if needed
        if (existingRelationship.position !== part.position) {
          await existingRelationship.update({ position: part.position }, { transaction: t });
        }
      } else {
        // Create new relationship
        await models.planPlanParts.create({
          planId: parseInt(planId),
          planPartId: part.id,
          position: part.position
        } as any, { transaction: t });
      }
    }
  });

  // Fetch and return the updated plan
  const updatedPlan = await getPlanById(parseInt(planId), teamId);

  res.status(200).json({
    success: true,
    message: 'Plan updated successfully',
    data: updatedPlan
  });
});

// CHECK
router.post('/part', requireSignedIn, validate(createPlanPartSchema), validateBasedOnScope('plan-part:create'), async (req: Request, res: Response, next: NextFunction) => {
  const { id, items, teamId, scope, title, description, durationInMinutes, typeId, position, showInLibrary } = req.body as PlanPart & { items?: PlanPartItem[], teamId: string, scope: OBJECT_SCOPE, showInLibrary: boolean };

  await sequelize.transaction(async (t) => {
    await models.planParts.create({
      id,
      teamId,
      title: title ?? null,
      description: description ?? null,
      durationInMinutes,
      typeId,
      position: position ?? 0,
      scope,
      showInLibrary: showInLibrary ? 1 : 0,
      createdById: req.user?.sub
    } as any, { transaction: t });

    // Add plan part items if provided
    const itemsWithPartId = items?.map(item => ({
      ...item,
      partId: id
    })) || [];
    await savePlanPartItems(itemsWithPartId, t);
  });

  // Fetch the created part with its items
  const createdPart = await models.planParts.findOne({
    where: { id },
    include: [
      {
        model: models.users,
        required: false,
        attributes: ['id', 'firstName', 'lastName', 'email']
      },
      {
        model: models.planPartTypes,
        required: false
      },
      {
        model: models.planPartItems,
        required: false,
        include: [
          {
            model: models.planPartItemTexts,
            required: false
          }
        ]
      }
    ],
    order: [
      [models.planPartItems, 'position', 'ASC']
    ]
  });

  // Transform the data
  const rawPart = createdPart?.get({ plain: true }) as any;

  // Rename user to createdBy
  if (rawPart.user) {
    rawPart.createdBy = rawPart.user;
    delete rawPart.user;
  }

  const items_transformed = (rawPart.planPartItems || []).map((item: any) => {
    const transformedItem = { ...item };
    if (item.type === 'text' && item.planPartItemText) {
      transformedItem.item = item.planPartItemText;
    }
    delete transformedItem.planPartItemText;
    return transformedItem;
  });

  if (rawPart.planPartType) {
    rawPart.type = rawPart.planPartType;
    delete rawPart.planPartType;
  }

  const finalPart = {
    ...rawPart,
    items: items_transformed
  };
  delete finalPart.planPartItems;

  res.status(201).json({
    success: true,
    message: 'Plan part created successfully',
    data: finalPart
  });
});

// CHECK
router.put('/part/:partId/team/:teamId', requireSignedIn, requireScope('plan-part:update', 'team'), validate(updatePlanPartSchema), async (req: Request, res: Response, next: NextFunction) => {
  const { partId, teamId } = req.params as { partId: string, teamId: string };
  const { items, title, description, durationInMinutes, typeId, position, showInLibrary } = req.body as {
    items?: PlanPartItem[];
    title?: string | null;
    description?: string | null;
    durationInMinutes?: number;
    typeId?: number;
    position?: number;
    showInLibrary?: boolean;
  };

  const existingPart = await models.planParts.findOne({
    where: { id: partId, teamId } as any
  });

  if (!existingPart) {
    throw new AppError('Plan part not found', 404, 'plan_part_not_found');
  }

  // Update the part using the helper
  const updatedPart = await updatePlanPart(
    partId,
    {
      title,
      description,
      durationInMinutes,
      typeId,
      position,
      showInLibrary: showInLibrary !== undefined ? (showInLibrary ? 1 : 0) : undefined
    },
    items
  );

  if (!updatedPart) {
    throw new AppError('Failed to update plan part', 500, 'update_failed');
  }

  // Transform the data
  const rawPart = updatedPart.get({ plain: true }) as any;

  // Rename user to createdBy
  if (rawPart.user) {
    rawPart.createdBy = rawPart.user;
    delete rawPart.user;
  }

  const items_transformed = (rawPart.planPartItems || []).map((item: any) => {
    const transformedItem = { ...item };
    if (item.type === 'text' && item.planPartItemText) {
      transformedItem.item = item.planPartItemText;
    }
    delete transformedItem.planPartItemText;
    return transformedItem;
  });

  if (rawPart.planPartType) {
    rawPart.type = rawPart.planPartType;
    delete rawPart.planPartType;
  }

  const finalPart = {
    ...rawPart,
    items: items_transformed
  };
  delete finalPart.planPartItems;

  res.status(200).json({
    success: true,
    message: 'Plan part updated successfully',
    data: finalPart
  });
});

// PATCH - Update showInLibrary for a plan part
router.patch('/part/:partId/team/:teamId/show-in-library', requireSignedIn, requireScope('plan-part:update', 'team'), async (req: Request, res: Response, next: NextFunction) => {
  const { partId, teamId } = req.params as { partId: string, teamId: string };
  const { showInLibrary } = req.body as { showInLibrary: boolean };

  const part = await models.planParts.findOne({
    where: { id: partId, teamId } as any
  });

  if (!part) {
    throw new AppError('Plan part not found', 404, 'plan_part_not_found');
  }

  await part.update({ showInLibrary: showInLibrary ? 1 : 0 });

  res.status(200).json({
    success: true,
    message: 'Plan part visibility updated successfully',
    data: { showInLibrary }
  });
});

// CHECK
router.delete('/part/:partId/team/:teamId', requireSignedIn, requireScope('plan-part:delete', 'team'), async (req: Request, res: Response, next: NextFunction) => {
  const { partId, teamId } = req.params as { partId: string, teamId: string };

  const part = await models.planParts.findOne({
    where: { id: partId, teamId } as any
  });

  if (!part) {
    throw new AppError('Plan part not found', 404, 'plan_part_not_found');
  }

  await part.destroy();

  res.status(200).json({
    success: true,
    message: 'Plan part deleted successfully'
  });
});

router.delete('/team/:teamId/event/:eventId', requireSignedIn, requireScope('plan:delete', 'team'), async (req: Request, res: Response, next: NextFunction) => {
  const { teamId, eventId } = req.params as { teamId: string, eventId: string };

  // Find the event first
  const event = await models.events.findOne({
    where: {
      id: parseInt(eventId),
      teamId
    }
  });

  if (!event) {
    throw new AppError('Event not found', 404, 'event_not_found');
  }

  const rawEvent = event.get({ plain: true });

  if (!rawEvent.planId) {
    throw new AppError('Event has no plan', 404, 'plan_not_found');
  }

  // Find and delete the plan
  const plan = await models.plans.findByPk(rawEvent.planId);
  if (plan) {
    await plan.destroy();
  }

  res.status(200).json({
    success: true,
    message: 'Plan deleted successfully'
  });
});

// PATCH - Update showInLibrary for a plan
router.patch('/:planId/team/:teamId/show-in-library', requireSignedIn, requireScope('plan:update', 'team'), async (req: Request, res: Response, next: NextFunction) => {
  const { planId, teamId } = req.params as { planId: string, teamId: string };
  const { showInLibrary } = req.body as { showInLibrary: boolean };

  const plan = await models.plans.findOne({
    where: { id: parseInt(planId), teamId }
  });

  if (!plan) {
    throw new AppError('Plan not found', 404, 'plan_not_found');
  }

  await plan.update({ showInLibrary: showInLibrary ? 1 : 0 });

  res.status(200).json({
    success: true,
    message: 'Plan visibility updated successfully',
    data: { showInLibrary }
  });
});

// CHECK
router.delete('/:planId/team/:teamId', requireSignedIn, requireScope('plan:delete', 'team'), async (req: Request, res: Response, next: NextFunction) => {
  const { planId, teamId } = req.params as { planId: string, teamId: string };
  const plan = await models.plans.findByPk(parseInt(planId));
  if(!plan) {
    throw new AppError('Plan not found', 404, 'plan_not_found');
  }
  const rawPlan = plan?.get({ plain: true });

  if(rawPlan?.teamId !== teamId) {
    throw new AppError('Plan not found', 404, 'plan_not_found');
  }

  await plan.destroy();
  res.status(200).json({
    success: true,
    message: 'Plan deleted successfully'
  });
});

// CHECK
router.get('/part/:partId/team/:teamId', requireSignedIn, requireScope('plan-part:read', 'team'), async (req: Request, res: Response, next: NextFunction) => {
  const { partId, teamId } = req.params as { partId: string, teamId: string };

  const part = await models.planParts.findOne({
    where: { id: partId, teamId } as any,
    include: [
      {
        model: models.users,
        required: false,
        attributes: ['id', 'firstName', 'lastName', 'email']
      },
      {
        model: models.planPartTypes,
        required: false
      },
      {
        model: models.planPartItems,
        required: false,
        include: [
          {
            model: models.planPartItemTexts,
            required: false
          }
        ]
      }
    ],
    order: [
      [models.planPartItems, 'position', 'ASC']
    ]
  });

  if(!part) {
    throw new AppError('Plan part not found', 404, 'plan_part_not_found');
  }

  // Transform the data to match expected format
  const rawPart = part.get({ plain: true }) as any;

  // Rename user to createdBy
  if (rawPart.user) {
    rawPart.createdBy = rawPart.user;
    delete rawPart.user;
  }

  // Transform nested items
  const items = (rawPart.planPartItems || []).map((item: any) => {
    const transformedItem = { ...item };
    if (item.type === 'text' && item.planPartItemText) {
      transformedItem.item = item.planPartItemText;
    }
    delete transformedItem.planPartItemText;
    return transformedItem;
  });

  // Rename planPartType to type for consistency
  if (rawPart.planPartType) {
    rawPart.type = rawPart.planPartType;
    delete rawPart.planPartType;
  }

  const finalPart = {
    ...rawPart,
    items
  };

  // Clean up
  delete finalPart.planPartItems;

  res.status(200).json({
    success: true,
    message: 'Plan part fetched successfully',
    data: finalPart
  });
});

// CHECK
router.get('/part/team/:teamId', requireSignedIn, requireScope('plan-part:read', 'team'), async (req: Request, res: Response, next: NextFunction) => {
  const { teamId } = req.params as { teamId: string };
  const { showInLibrary } = req.query as { showInLibrary?: 'true' | 'false' };
  const showInLibraryBoolean = showInLibrary === 'true' ? 1 : showInLibrary === 'false' ? 0 : undefined;

  // Build where clause
  const whereClause: any = { teamId };

  // Filter by showInLibrary if specified
  if (showInLibraryBoolean !== undefined) {
    whereClause.showInLibrary = showInLibraryBoolean;
  }

  const parts = await models.planParts.findAll({
    where: whereClause,
    include: [
      {
        model: models.users,
        required: false,
        attributes: ['id', 'firstName', 'lastName', 'email']
      },
      {
        model: models.planPartTypes,
        required: false
      },
      {
        model: models.planPartItems,
        required: false,
        include: [
          {
            model: models.planPartItemTexts,
            required: false
          }
        ]
      }
    ],
    order: [
      ['createdAt', 'DESC'],
      [models.planPartItems, 'position', 'ASC']
    ]
  });

  // Transform the data to match expected format
  const transformedParts = parts.map(part => {
    const rawPart = part.get({ plain: true }) as any;

    // Rename user to createdBy
    if (rawPart.user) {
      rawPart.createdBy = rawPart.user;
      delete rawPart.user;
    }

    // Transform nested items
    const items = (rawPart.planPartItems || []).map((item: any) => {
      const transformedItem = { ...item };
      if (item.type === 'text' && item.planPartItemText) {
        transformedItem.item = item.planPartItemText;
      }
      delete transformedItem.planPartItemText;
      return transformedItem;
    });

    // Rename planPartType to type for consistency
    if (rawPart.planPartType) {
      rawPart.type = rawPart.planPartType;
      delete rawPart.planPartType;
    }

    const finalPart = {
      ...rawPart,
      items
    };

    // Clean up
    delete finalPart.planPartItems;

    return finalPart;
  });

  res.status(200).json({
    success: true,
    message: 'Plan parts fetched successfully',
    data: transformedParts
  });
});

// CHECK

router.get('/plan-part-type/global', requireSignedIn, requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  const eventPlanPartTypes = await getPlanPartTypes('global', null, null, true);

  res.status(200).json({
    success: true,
    message: 'Event plan part types fetched successfully',
    data: eventPlanPartTypes
  });
});

// OK
router.get('/plan-part-type/all/:teamId', requireSignedIn, async (req: Request, res: Response, next: NextFunction) => {
  const { teamId } = req.params as { teamId: string, userId: string };
  const globalTypes = await getPlanPartTypes('global', null, null, false);
  const teamTypes = await getPlanPartTypes('team', teamId, null, false);
  const userTypes = await getPlanPartTypes('user', null, req.user?.sub!, false);
  const eventPlanPartTypes = [ ...globalTypes, ...teamTypes, ...userTypes ]

  res.status(200).json({
    success: true,
    message: 'Event plan part types fetched successfully',
    data: eventPlanPartTypes
  });
});

// OK
router.get('/plan-part-type/team/:teamId', requireSignedIn, async (req: Request, res: Response, next: NextFunction) => {
  const { teamId } = req.params as { teamId: string };
  const eventPlanPartTypes = await getPlanPartTypes('team', teamId, null, false);
  res.status(200).json({
    success: true,
    message: 'Event plan part types fetched successfully',
    data: eventPlanPartTypes
  });
});

// OK
router.get('/plan-part-type/me', requireSignedIn, async (req: Request, res: Response, next: NextFunction) => {
  const includeArchived: boolean = req.query['includeArchived'] === 'true' ? true : false;

  const eventPlanPartTypes = await getPlanPartTypes('user', null, req.user?.sub!, includeArchived);
  res.status(200).json({
    success: true,
    message: 'Event plan part types fetched successfully',
    data: eventPlanPartTypes
  });
});

// OK
router.put('/plan-part-type/:id', requireSignedIn, validateBasedOnScope('plan-part-type:update'), async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params as { id: string };
  let { titleObject, color, scope, archived, teamId, userId } = req.body as { titleObject: LocalizationObject, color: string, scope: EVENT_PLAN_PART_SCOPE, teamId: string | null | undefined, userId: string | null | undefined, archived: boolean };
  console.log('scope', scope);
  console.log('teamId', teamId);
  console.log('userId', userId);
  console.log('archived', archived);

  if(scope === 'team') {
    userId = null;
  } else if(scope === 'user') {
    teamId = null;
  }

  await updatePlanPartType(id, titleObject, color, scope, archived, teamId || null, userId || null);
  const [ eventPlanPartType ] = await getPlanPartTypeById(id) as PlanPartType[];
  console.log('eventPlanPartType', eventPlanPartType);
  res.status(200).json({
    success: true,
    message: 'Event plan part type updated successfully',
    data: eventPlanPartType
  });
});

// OK
router.delete('/plan-part-type/:id', requireSignedIn, requireSuperAdmin, async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params as { id: string };

  const [ eventPlanPartType ] = await getPlanPartTypeById(id) as PlanPartType[];

  if(!eventPlanPartType) {
    throw new AppError('Event plan part type not found', 404, 'event_plan_part_type_not_found');
  }

  switch(eventPlanPartType.scope) {
    case 'global':
      if(!req.user?.superAdmin) {
        throw new AppError('User not authorized to delete event plan part type', 403, 'not_authorized');
      }
      break;
    case 'team':
      if(!req.user?.teams.some(team => team.teamId === eventPlanPartType.teamId)) {
        throw new AppError('User not authorized to delete event plan part type', 403, 'not_authorized');
      }
      break;
    case 'user':
      if(eventPlanPartType.userId !== req.user?.sub) {
        throw new AppError('User not authorized to delete event plan part type', 403, 'not_authorized');
      }
      break;
    case 'club':
      throw new AppError('Club scope is not supported yet', 403, 'unauthorized');
  }

  await deletePlanPartType(id);

  res.status(200).json(eventPlanPartType);
});

// OK
router.post('/plan-part-type/:teamId', requireSignedIn, validateBasedOnScope('plan-part-type:create'), validate(createEventPlanPartTypeSchema), async (req: Request, res: Response, next: NextFunction) => {
  const { titleObject, color, scope, teamId, userId } = req.body as { titleObject: LocalizationObject, color: string, clubId: string, scope: EVENT_PLAN_PART_SCOPE, teamId: string, userId: string, position: number };

  const planPartTypes = await getPlanPartTypes(scope, teamId, userId, false);

  const { insertId: id } = await createPlanPartType(titleObject, color, scope, req.user?.sub!, planPartTypes.length + 1, teamId || null, userId || null) as any;
  const [ eventPlanPartType ] = await getPlanPartTypeById(id) as PlanPartType[];

  res.status(201).json({
    success: true,
    message: 'Event plan part type created successfully',
    data: eventPlanPartType
  });
});

// OK
router.patch('/plan-part-type/positions/:teamId', requireSignedIn, validate(updateEventPlanPartTypePositionsSchema), validateBasedOnScope('plan-part-type:update'), async (req: Request, res: Response, next: NextFunction) => {
  const { positions, scope } = req.body as { positions: { id: number, pos: number }[], scope: OBJECT_SCOPE };

  for (const { id, pos } of positions) {
    await updatePlanPartTypePosition(id.toString(), pos, scope);
  }

  res.status(200).json({
    success: true,
    message: 'Event plan part type positions updated successfully'
  });
});

// CHECK
router.get('/:planId/team/:teamId', requireSignedIn, requireScope('plan:read', 'team'), async (req: Request, res: Response, next: NextFunction) => {
  const { planId, teamId } = req.params as { planId: string, teamId: string };

  const plan = await getPlanById(parseInt(planId), teamId);

  if (!plan) {
    throw new AppError('Plan not found', 404, 'plan_not_found');
  }

  res.status(200).json({
    success: true,
    message: 'Plan fetched successfully',
    data: plan
  });
});

// CHECK
router.get('/event/:eventId/team/:teamId', requireSignedIn, requireScope('plan:read', 'team'), async (req: Request, res: Response, next: NextFunction) => {
  const { eventId, teamId } = req.params as { eventId: string, teamId: string };
  const eventIdNumber = parseInt(eventId);
  const plan = await getPlanByEventId(eventIdNumber, teamId);

  res.status(200).json({
    success: true,
    message: 'Plan fetched successfully',
    data: plan
  });
});

// CHECK
router.get('/team/:teamId', requireSignedIn, requireScope('plan:read', 'team'), async (req: Request, res: Response, next: NextFunction) => {
  const { teamId } = req.params as { teamId: string };
  const { showInLibrary } = req.query as { showInLibrary?: 'true' | 'false' };
  const showInLibraryBoolean = showInLibrary === 'true' ? 1 : showInLibrary === 'false' ? 0 : undefined;

  // Build where clause
  const whereClause: any = {
    teamId
  };

  // Filter by showInLibrary if specified
  if (showInLibraryBoolean !== undefined) {
    whereClause.showInLibrary = showInLibraryBoolean;
  }

  const plans = await getPlansWithParts(whereClause);

  res.status(200).json({
    success: true,
    message: 'Plans fetched successfully',
    data: plans
  });
});

// CHECK


export default router;