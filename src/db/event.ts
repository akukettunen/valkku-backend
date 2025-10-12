import { query, Transaction } from '@/db/index';
import { OBJECT_SCOPE } from '@/types/general';
import { LocalizationObject } from '@/types/event';
import { EVENT_PLAN_PART_SCOPE, PlanPartType } from '@/types/event';
import { Event, PublicEvent } from '@/types/event';

export const createEvent = async (event: Event, createdById: string, trx?: Transaction) => {
  const {
    teamId,
    title,
    notes,
    type,
    ownNotes,
    coachesNotes,
    eventDate,
    startTimeUnixSec,
    endTimeUnixSec,
    locationId,
    repeats,
    repeatsOn,
    repeatsUntilUnixSec,
    status,
    durationInMinutes
  } = event;

  const toNull = (v: any) => (v === undefined ? null : v);
  const exec = trx ? trx.query.bind(trx) : query;
  const result = await exec(`
    INSERT INTO events (teamId, title, notes, type, ownNotes, coachesNotes, eventDate, startTimeUnixSec, endTimeUnixSec, locationId, repeats, repeatsOn, repeatsUntilUnixSec, status, createdById, durationInMinutes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    teamId,
    title,
    toNull(notes),
    type,
    toNull(ownNotes),
    toNull(coachesNotes),
    eventDate,
    toNull(startTimeUnixSec),
    toNull(endTimeUnixSec),
    toNull(locationId),
    toNull(repeats),
    toNull(repeatsOn),
    toNull(repeatsUntilUnixSec),
    toNull(status) || 'published',
    createdById,
    toNull(durationInMinutes)
  ]);
  return result;
};

export const getEventsByTeamIdDate = async (teamId: string, date: string) => {
  const result = await query(`
    SELECT
      events.*,
      addedBy.fullName as addedByName,
      addedBy.email as addedByEmail,
      addedBy.id as addedById
    FROM events
    LEFT JOIN users as addedBy ON events.createdById = addedBy.id
    WHERE teamId = ? AND eventDate = ?
  `, [teamId, date]);
  return result as (PublicEvent & { addedByName: string, addedByEmail: string, addedById: string })[];
};

export const getEventsByTeamIdRange = async (teamId: string, startDate: string, endDate: string) => {
  const result = await query(`
    SELECT
      events.*,
      addedBy.fullName as addedByName,
      addedBy.email as addedByEmail,
      addedBy.id as addedById
    FROM events
    LEFT JOIN locations ON events.locationId = locations.id
    LEFT JOIN users as addedBy ON events.createdById = addedBy.id
    WHERE events.teamId = ? AND events.eventDate BETWEEN ? AND ?
  `, [teamId, startDate, endDate]);
  return result as (PublicEvent & { addedByName: string, addedByEmail: string, addedById: string })[];
};

export const getPlanPartTypeById = async (id: string) => {
  const result = await query(`
    SELECT * FROM plan_part_types WHERE id = ?
  `, [id]);
  return result;
};

export const getPlanPartTypes = async (scope: OBJECT_SCOPE, teamId?: string | null, userId?: string | null, includeArchived: boolean = false) => {
  console.log("includeArchived", includeArchived);
  const result = await query(`
    SELECT * FROM plan_part_types
    WHERE scope = ?
    AND (teamId = ? OR (? IS NULL AND teamId IS NULL))
    AND (userId = ? OR (? IS NULL AND userId IS NULL))
    AND (archived = ? || archived = 0)
    ORDER BY scope, position ASC
  `, [scope, teamId || null, teamId || null, userId || null, userId || null, includeArchived]);
  return result as PlanPartType[];
};

export const deletePlanPartType = async (id: string) => {
  const result = await query(`
    DELETE FROM plan_part_types WHERE id = ?
  `, [id]);
  return result;
};

export const updatePlanPartType = async (id: string, titleObject: LocalizationObject, color: string, scope: EVENT_PLAN_PART_SCOPE, archived: boolean = false, teamId?: string | null, userId?: string | null) => {
  const result = await query(`
    UPDATE plan_part_types
    SET titleObject = ?, color = ?, archived = ?
    WHERE id = ? AND scope = ?
    AND (teamId = ? OR (? IS NULL AND teamId IS NULL))
    AND (userId = ? OR (? IS NULL AND userId IS NULL))
  `, [titleObject, color, archived, id, scope, teamId, teamId, userId, userId]);
  return result;
};

export const createPlanPartType = async (titleObject: LocalizationObject, color: string, scope: EVENT_PLAN_PART_SCOPE, createdById: string, position: number, teamId: string | null, userId: string | null) => {
  const result = await query(`
    INSERT INTO plan_part_types (titleObject, color, scope, createdById, position, teamId, userId) VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [titleObject, color, scope, createdById, position, teamId, userId]);
  return result;
};

export const updatePlanPartTypePosition = async (id: string, position: number, scope: OBJECT_SCOPE) => {
  // user is verified against scope

  const result = await query(`
    UPDATE plan_part_types SET position = ? WHERE id = ? AND scope = ?
  `, [position, id, scope]);
  return result;
};

export const getEventById = async (eventId: string) => {
  const result = await query(`
    SELECT * FROM events WHERE id = ?
  `, [eventId]);
  return result as Event[];
};