import { PlanPartItem } from "@/types/event";
import { models, sequelize } from "@/db/index";
import { WhereOptions, Transaction } from "sequelize";
import type { plansAttributes } from "@/models/plans";

export const getPlanByEventId = async (eventId: number, teamId?: string) => {
  // Fetch the event to get its planId
  const whereClause: any = { id: eventId };
  if (teamId) {
    whereClause.teamId = teamId;
  }

  const event = await models.events.findOne({
    where: whereClause,
    attributes: ['planId']
  });

  if (!event) {
    return null;
  }

  const planId = event.get('planId') as number | null;

  if (!planId) {
    return null;
  }

  // Don't filter by teamId when fetching the plan - the plan might have a different teamId
  // (e.g., global or club scope) but still be attached to this event
  const plan = await getPlanById(planId);

  return plan;
};

export const getPlanById = async (planId: number, teamId?: string) => {
  const whereClause: any = { id: planId };
  if (teamId) {
    whereClause.teamId = teamId;
  }

  return getPlanWithParts(whereClause);
};

/**
 * Transform raw Sequelize plan data to the expected format
 */
const transformPlanData = (rawPlan: any) => {
  // Rename user to createdBy for consistency (Sequelize uses default alias 'user')
  if (rawPlan.user) {
    rawPlan.createdBy = rawPlan.user;
    delete rawPlan.user;
  }

  // Process plan parts through planPlanParts join table
  const planParts = (rawPlan.planPlanParts || []).map((ppp: any) => {
    const part = ppp.planPart || {};

    // Transform nested items
    const items = (part.planPartItems || []).map((item: any) => {
      const transformedItem = { ...item };
      if (item.type === 'text' && item.planPartItemText) {
        transformedItem.item = item.planPartItemText;
      }
      delete transformedItem.planPartItemText;
      return transformedItem;
    });

    const transformedPart = { ...part };
    // Rename planPartType to type for consistency with the helper
    if (transformedPart.planPartType) {
      transformedPart.type = transformedPart.planPartType;
      delete transformedPart.planPartType;
    }
    delete transformedPart.planPartItems;

    // Use position from plan_plan_parts
    transformedPart.position = ppp.position;

    return {
      ...transformedPart,
      items,
      nodeType: 'part'
    };
  });

  const finalPlan = {
    ...rawPlan,
    parts: planParts,
    items: planParts.flatMap((part: any) => part.items || [])
  };

  // Clean up duplicate fields from the root
  delete finalPlan.planPlanParts;

  return finalPlan;
};

/**
 * Build common query options for fetching plans with all parts
 */
const buildPlanQueryOptions = (whereClause: WhereOptions<plansAttributes>) => ({
  where: whereClause,
  include: [
    {
      model: models.users,
      required: false,
      attributes: ['id', 'firstName', 'lastName', 'email']
    },
    {
      model: models.planPlanParts,
      required: false,
      include: [
        {
          model: models.planParts,
          required: false,
          include: [
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
          ]
        }
      ]
    }
  ],
  order: [
    ['createdAt', 'DESC'],
    [models.planPlanParts, 'position', 'ASC'],
    [models.planPlanParts, models.planParts, models.planPartItems, 'position', 'ASC']
  ]
});

/**
 * Get plans with all parts using Sequelize
 */
export const getPlansWithParts = async (whereClause: WhereOptions<plansAttributes>) => {
  const plans = await models.plans.findAll(buildPlanQueryOptions(whereClause) as any);
  return plans.map(plan => transformPlanData(plan.get({ plain: true })));
};

/**
 * Get a single plan with all parts using Sequelize
 */
export const getPlanWithParts = async (whereClause: WhereOptions<plansAttributes>) => {
  const plan = await models.plans.findOne(buildPlanQueryOptions(whereClause) as any);

  if (!plan) {
    return null;
  }

  return transformPlanData(plan.get({ plain: true }));
};

/**
 * Save plan part items and their associated text content
 */
export const savePlanPartItems = async (items: PlanPartItem[], transaction: Transaction) => {
  if (!items?.length) {
    return;
  }

  for (const item of items) {
    const planPartItem: any = {
      id: item.id,
      type: item.type,
      position: item.position,
      partId: item.partId
    };

    await models.planPartItems.create(planPartItem, { transaction });

    if (item.type === 'text') {
      await models.planPartItemTexts.create(
        {
          planPartItemId: item.id,
          text: item.item?.text ?? undefined
        } as any,
        { transaction }
      );
    }
  }
};

/**
 * Update a plan part with its items
 */
export const updatePlanPart = async (
  partId: string,
  partData: {
    title?: string | null | undefined;
    description?: string | null | undefined;
    durationInMinutes?: number | undefined;
    typeId?: number | undefined;
    position?: number | undefined;
    showInLibrary?: number | undefined;
  },
  items?: PlanPartItem[],
  existingTransaction?: Transaction
) => {
  const executeUpdate = async (t: Transaction) => {
    // Find the part
    const part = await models.planParts.findByPk(partId, { transaction: t });

    if (!part) {
      return null;
    }

    // Build update object with only defined fields
    const updateData: any = {};
    if (partData.title !== undefined) {
      updateData.title = partData.title;
    }
    if (partData.description !== undefined) {
      updateData.description = partData.description;
    }
    if (partData.durationInMinutes !== undefined) {
      updateData.durationInMinutes = partData.durationInMinutes;
    }
    if (partData.typeId !== undefined) {
      updateData.typeId = partData.typeId;
    }
    if (partData.position !== undefined) {
      updateData.position = partData.position;
    }
    if (partData.showInLibrary !== undefined) {
      updateData.showInLibrary = partData.showInLibrary;
    }

    // Use update method instead of save
    await part.update(updateData, { transaction: t });

    // Reload to get fresh data from DB
    await part.reload({ transaction: t });

    // If items are provided (even as empty array), replace them
    if (items !== undefined) {
      // Delete existing items (cascades to texts)
      await models.planPartItems.destroy({
        where: { partId },
        transaction: t
      });

      // Create new items if any provided
      if (items.length > 0) {
        const itemsWithPartId = items.map(item => ({
          ...item,
          partId
        }));
        await savePlanPartItems(itemsWithPartId, t);
      }
    }

    // Fetch and return the updated part with all relationships
    const updatedPart = await models.planParts.findOne({
      where: { id: partId },
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
      ],
      transaction: t
    });

    return updatedPart;
  };

  // If transaction is provided, use it; otherwise create a new one
  if (existingTransaction) {
    return executeUpdate(existingTransaction);
  } else {
    return sequelize.transaction(executeUpdate);
  }
};