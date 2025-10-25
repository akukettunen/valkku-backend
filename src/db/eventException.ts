import { query, Transaction } from './index';

export interface EventException {
  eventId: number;
  recurrenceDate: string; // YYYY-MM-DD
  replacementEventId: number | null;
  isCancelled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get all exceptions for a recurring event
 */
export const getEventExceptions = async (eventId: number): Promise<EventException[]> => {
  const results = await query(
    `SELECT * FROM event_exceptions WHERE eventId = ? ORDER BY recurrenceDate`,
    [eventId]
  );
  return results as EventException[];
};

/**
 * Get exception for a specific occurrence
 */
export const getEventException = async (
  eventId: number,
  recurrenceDate: string
): Promise<EventException | null> => {
  const results = await query(
    `SELECT * FROM event_exceptions
     WHERE eventId = ? AND recurrenceDate = ?`,
    [eventId, recurrenceDate]
  ) as EventException[];
  return results[0] || null;
};

/**
 * Create an exception (cancellation or replacement)
 */
export const createEventException = async (
  eventId: number,
  recurrenceDate: string,
  isCancelled: boolean,
  replacementEventId: number | null = null,
  trx?: Transaction
): Promise<EventException> => {
  const executor = trx || { query };

  // Upsert to avoid duplicate key errors when an exception already exists for this occurrence
  await executor.query(
    `INSERT INTO event_exceptions
       (eventId, recurrenceDate, isCancelled, replacementEventId)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       isCancelled = VALUES(isCancelled),
       replacementEventId = VALUES(replacementEventId)`,
    [eventId, recurrenceDate, isCancelled, replacementEventId]
  );

  return {
    eventId,
    recurrenceDate,
    replacementEventId,
    isCancelled,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

/**
 * Delete an exception (restore original occurrence)
 */
export const deleteEventException = async (
  eventId: number,
  recurrenceDate: string,
  trx?: Transaction
): Promise<void> => {
  const executor = trx || { query };

  await executor.query(
    `DELETE FROM event_exceptions
     WHERE eventId = ? AND recurrenceDate = ?`,
    [eventId, recurrenceDate]
  );
};

/**
 * Get all exceptions in a date range (for filtering expanded events)
 */
export const getEventExceptionsInRange = async (
  eventId: number,
  startDate: string,
  endDate: string
): Promise<EventException[]> => {
  const results = await query(
    `SELECT * FROM event_exceptions
     WHERE eventId = ? AND recurrenceDate BETWEEN ? AND ?
     ORDER BY recurrenceDate`,
    [eventId, startDate, endDate]
  );
  return results as EventException[];
};
