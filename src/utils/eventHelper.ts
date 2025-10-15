import { getEventsByTeamIdDate, getEventsByTeamIdRange, getTeamEvents } from "@/db/event";
import { AppError } from "@/middleware/errors";

export const fetchTeamEvents = async (teamId: string, date: string, startDate: string, endDate: string) => {
  let events;
  if(date) {
    events = await getEventsByTeamIdDate(teamId, date);
  } else if(startDate && endDate) {
    events = await getEventsByTeamIdRange(teamId, startDate, endDate);
  }

  return events;
}