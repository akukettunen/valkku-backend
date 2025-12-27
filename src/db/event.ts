import { query, Transaction } from '@/db/index';
import { OBJECT_SCOPE } from '@/types/general';
import { LocalizationObject } from '@/types/event';
import { EVENT_PLAN_PART_SCOPE, PlanPartType } from '@/types/event';
import { Event, PublicEvent } from '@/types/event';

export const createEvent = async (event: Event, createdById: string, trx?: Transaction) => {
  const {
    id,
    teamId,
    title,
    notes,
    type,
    ownNotes,
    coachesNotes,
    athleteId,
    eventDate,
    startTimeUnixSec,
    endTimeUnixSec,
    locationId,
    timezone,
    repeats,
    repeatsOn,
    repeatsUntilUnixSec,
    status,
    durationInMinutes,
    baseEventId,
    planId,
    forAllAthletes,
    forAllStaff,
    registrationRequired
  } = event;

  const toNull = (v: any) => (v === undefined ? null : v);
  const exec = trx ? trx.query.bind(trx) : query;
  const result = await exec(`
    INSERT INTO events (id, teamId, title, notes, type, ownNotes, coachesNotes, eventDate, startTimeUnixSec, endTimeUnixSec, locationId, timezone, repeats, repeatsOn, repeatsUntilUnixSec, status, createdById, athleteId, durationInMinutes, baseEventId, planId, forAllAthletes, forAllStaff, registrationRequired) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    toNull(id),
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
    timezone || 'Europe/Helsinki',
    toNull(repeats),
    toNull(repeatsOn),
    toNull(repeatsUntilUnixSec),
    toNull(status) || 'published',
    createdById,
    toNull(athleteId),
    toNull(durationInMinutes),
    toNull(baseEventId),
    toNull(planId),
    forAllAthletes !== undefined ? forAllAthletes : true,
    forAllStaff !== undefined ? forAllStaff : true,
    registrationRequired !== undefined ? registrationRequired : true
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

export const getTeamEvents = async (teamId: string, userId?: string, isAthlete: boolean = false) => {
  let sql;
  let params;

  if (isAthlete) {
    // Athletes see events where forAllAthletes=1 OR they created it OR they're invited
    sql = `
      SELECT
        events.*,
        locations.*,
        events.id as id,
        locations.id as locationId,
        DATE_FORMAT(events.eventDate, '%Y-%m-%d') as eventDateYmd,
        user_event_attendances.attends
      FROM events
      LEFT JOIN locations ON events.locationId = locations.id
      LEFT JOIN user_event_attendances ON (user_event_attendances.eventId = events.id AND user_event_attendances.userId = ?)
      WHERE events.teamId = ?
        AND (
          events.forAllAthletes = 1
          OR events.createdById = ?
          OR EXISTS (
            SELECT 1 FROM event_users eu
            WHERE eu.eventId = events.id AND eu.userId = ?
          )
        )
      ORDER BY events.eventDate ASC, events.startTimeUnixSec ASC
    `;
    params = [userId, teamId, userId, userId];
  } else {
    // Staff see ALL events in the team
    sql = `
      SELECT
        events.*,
        locations.*,
        events.id as id,
        locations.id as locationId,
        DATE_FORMAT(events.eventDate, '%Y-%m-%d') as eventDateYmd,
        user_event_attendances.attends
      FROM events
      LEFT JOIN locations ON events.locationId = locations.id
      LEFT JOIN user_event_attendances ON (user_event_attendances.eventId = events.id AND user_event_attendances.userId = ?)
      WHERE events.teamId = ?
      ORDER BY events.eventDate ASC, events.startTimeUnixSec ASC
    `;
    params = [userId, teamId];
  }

  const result = await query(sql, params);
  return result as (Event & { attends: boolean })[];
};

export const getTeamEventsWithAttendanceCount = async (teamId: string, userId?: string, isAthlete: boolean = false) => {
  let sql;
  let params;

  if (isAthlete) {
    // Athletes see events where forAllAthletes=1 OR they created it OR they're invited
    sql = `
      SELECT
        events.*,
        locations.*,
        events.id as id,
        locations.id as locationId,
        DATE_FORMAT(events.eventDate, '%Y-%m-%d') as eventDateYmd,
        user_event_attendances.attends,
        (
          SELECT COUNT(*)
          FROM user_event_attendances uea
          WHERE uea.eventId = events.id AND uea.attends = 1
        ) as attendeeCount,
        (
          SELECT GROUP_CONCAT(eu.userId)
          FROM event_users eu
          WHERE eu.eventId = events.id
        ) as eventUserIds
      FROM events
      LEFT JOIN locations ON events.locationId = locations.id
      LEFT JOIN user_event_attendances ON (user_event_attendances.eventId = events.id AND user_event_attendances.userId = ?)
      WHERE events.teamId = ?
        AND (
          events.forAllAthletes = 1
          OR events.createdById = ?
          OR EXISTS (
            SELECT 1 FROM event_users eu2
            WHERE eu2.eventId = events.id AND eu2.userId = ?
          )
        )
      ORDER BY events.eventDate ASC, events.startTimeUnixSec ASC
    `;
    params = [userId, teamId, userId, userId];
  } else {
    // Staff see ALL events in the team
    sql = `
      SELECT
        events.*,
        locations.*,
        events.id as id,
        locations.id as locationId,
        DATE_FORMAT(events.eventDate, '%Y-%m-%d') as eventDateYmd,
        user_event_attendances.attends,
        (
          SELECT COUNT(*)
          FROM user_event_attendances uea
          WHERE uea.eventId = events.id AND uea.attends = 1
        ) as attendeeCount,
        (
          SELECT GROUP_CONCAT(eu.userId)
          FROM event_users eu
          WHERE eu.eventId = events.id
        ) as eventUserIds
      FROM events
      LEFT JOIN locations ON events.locationId = locations.id
      LEFT JOIN user_event_attendances ON (user_event_attendances.eventId = events.id AND user_event_attendances.userId = ?)
      WHERE events.teamId = ?
      ORDER BY events.eventDate ASC, events.startTimeUnixSec ASC
    `;
    params = [userId, teamId];
  }

  const result = await query(sql, params);
  return result as (Event & { attends: boolean; attendeeCount: number })[];
};

export const getPlanPartTypeById = async (id: string) => {
  const result = await query(`
    SELECT * FROM plan_part_types WHERE id = ?
  `, [id]);
  return result;
};

export const getPlanPartTypes = async (scope: OBJECT_SCOPE, teamId?: string | null, userId?: string | null, includeArchived: boolean = false) => {
  console.log("scope", scope);
  console.log("teamId", teamId);
  console.log("userId", userId);
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
  `, [JSON.stringify(titleObject), color, archived, id, scope, teamId, teamId, userId, userId]);
  return result;
};

export const createPlanPartType = async (titleObject: LocalizationObject, color: string, scope: EVENT_PLAN_PART_SCOPE, createdById: string, position: number, teamId: string | null, userId: string | null) => {
  const result = await query(`
    INSERT INTO plan_part_types (titleObject, color, scope, createdById, position, teamId, userId) VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [JSON.stringify(titleObject), color, scope, createdById, position, teamId, userId]);
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