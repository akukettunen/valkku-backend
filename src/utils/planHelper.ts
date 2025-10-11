import { query } from "@/db";
import { Plan, PlanPart, PlanPartItem, PlanPartItemText, PlanPartType } from "@/types/event";

export const getPlanByEventId = async (eventId: number, teamId?: string) => {
  let fetchedPlan;
  console.log('teamId', teamId);
  console.log('eventId', eventId);
  if(teamId) {
    fetchedPlan = await query(`SELECT id FROM plans WHERE eventId = ? AND teamId = ?`, [eventId, teamId]) as Plan[];
  } else {
    fetchedPlan = await query(`SELECT id FROM plans WHERE eventId = ?`, [eventId]) as Plan[];
  }

  console.log('fetchedPlan', fetchedPlan);

  if(!fetchedPlan[0]) {
    return null;
  }

  const plan = await getPlanById(fetchedPlan[0].id, teamId);

  return plan;
};

// Fetch and hydrate items for either a specific part (by partId)
// or top-level items attached directly to a plan (when partId is undefined)
const getPlanItems = async (planId: string, partId?: string) => {
  const items = partId
    ? await query(`SELECT * FROM plan_part_items WHERE partId = ? ORDER BY position ASC`, [partId]) as PlanPartItem[]
    : await query(`SELECT * FROM plan_part_items WHERE planId = ? AND partId IS NULL ORDER BY position ASC`, [planId]) as PlanPartItem[];

  for (const item of items) {
    if (item.type === 'text') {
      const texts = await query(`SELECT * FROM plan_part_item_texts WHERE planPartItemId = ?`, [item.id]) as PlanPartItemText[];
      const firstText = texts[0];
      if (firstText) {
        item.item = firstText;
      }
    }
  }

  return items;
}

export const getPlanById = async (planId: string, teamId?: string) => {
  let plan;
  console.log('eventId')
  if(teamId) {
    plan = await query(`SELECT * FROM plans WHERE id = ? AND teamId = ?`, [planId, teamId]) as Plan[];
  } else {
    plan = await query(`SELECT * FROM plans WHERE id = ?`, [planId]) as Plan[];
  }
  plan = plan[0];

  if(!plan) {
    return null;
  }

  let planParts = await query(`SELECT * FROM plan_parts WHERE planId = ? ORDER BY position ASC`, [planId]) as PlanPart[];
  for (const planPart of planParts) {
    const [ type ] = await query('SELECT * FROM plan_part_types WHERE id = ?', [planPart.typeId]) as PlanPartType[];
    planPart.type = type ?? undefined;
    planPart.items = await getPlanItems(planId, planPart.id);
    planPart.nodeType = 'part';
  }

  let planPartItems = await getPlanItems(planId);
  planPartItems = planPartItems.map(i => ({ ...i, nodeType: 'item' }));

  let finalPlan = {
    ...plan,
    parts: [...planParts, ...planPartItems].sort((a, b) => a.position - b.position)
  }

  return finalPlan;
};