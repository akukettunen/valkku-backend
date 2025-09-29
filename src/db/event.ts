import { query } from '@/db/index';
import { OBJECT_SCOPE } from '@/types/general';
import { LocalizationObject } from '@/types/event';
import { EVENT_PLAN_PART_SCOPE, EventPlanPartType } from '@/types/event';

export const getEventPlanPartTypeById = async (id: string) => {
  const result = await query(`
    SELECT * FROM plan_part_types WHERE id = ?
  `, [id]);
  return result;
};

export const getEventPlanPartTypes = async (scope: OBJECT_SCOPE, teamId?: string | null, userId?: string | null, includeArchived: boolean = false) => {
  console.log("includeArchived", includeArchived);
  const result = await query(`
    SELECT * FROM plan_part_types
    WHERE scope = ?
    AND (teamId = ? OR (? IS NULL AND teamId IS NULL))
    AND (userId = ? OR (? IS NULL AND userId IS NULL))
    AND (archived = ? || archived = 0)
    ORDER BY scope, position ASC
  `, [scope, teamId, teamId, userId, userId, includeArchived]);
  return result as EventPlanPartType[];
};

export const deleteEventPlanPartType = async (id: string) => {
  const result = await query(`
    DELETE FROM plan_part_types WHERE id = ?
  `, [id]);
  return result;
};

export const updateEventPlanPartType = async (id: string, titleObject: LocalizationObject, color: string, scope: EVENT_PLAN_PART_SCOPE, archived: boolean = false, teamId?: string | null, userId?: string | null) => {
  // we auth against scope teamId and userId

  const result = await query(`
    UPDATE plan_part_types
    SET titleObject = ?, color = ?, archived = ?
    WHERE id = ? AND scope = ?
    AND (teamId = ? OR (? IS NULL AND teamId IS NULL))
    AND (userId = ? OR (? IS NULL AND userId IS NULL))
  `, [titleObject, color, archived, id, scope, teamId, teamId, userId, userId]);
  return result;
};

export const createEventPlanPartType = async (titleObject: LocalizationObject, color: string, scope: EVENT_PLAN_PART_SCOPE, createdById: string, position: number, teamId: string | null, userId: string | null) => {
  const result = await query(`
    INSERT INTO plan_part_types (titleObject, color, scope, createdById, position, teamId, userId) VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [titleObject, color, scope, createdById, position, teamId, userId]);
  return result;
};

export const updateEventPlanPartTypePosition = async (id: string, position: number, scope: OBJECT_SCOPE) => {
  // user is verified against scope

  const result = await query(`
    UPDATE plan_part_types SET position = ? WHERE id = ? AND scope = ?
  `, [position, id, scope]);
  return result;
};