import { Location } from "@/routes/location";
import { OBJECT_SCOPE } from "./general";

export type EVENT_PLAN_PART_SCOPE = 'global' | 'club' | 'team' | 'user';
export type EVENT_REPEATS = null | 'daily' | 'weekly' | 'monthly';
export type EVENT_TYPE = 'practise' | 'match' | 'meeting' | 'self_training' | 'other_event';
export type EVENT_STATUS = 'draft' | 'published' | 'archived';
export type LocalizationObject = {
  [key: string]: string;
}

export interface Event {
  id: string; // check
  title: string; // check
  teamId?: string | null; // check
  userId?: string | null; // check
  type: EVENT_TYPE; // check
  status: EVENT_STATUS; // check

  notes: string; // check
  ownNotes: string; // check
  coachesNotes: string; // check

  eventDate: string; // format: YYYY-MM-DD (mysql DATE)
  startTimeUnixSec: number;
  endTimeUnixSec: number;
  durationInMinutes: number | null; // for independent and mental events
  repeats: EVENT_REPEATS;
  repeatsOn: string | null; // '1001010' = every monday, thursday and sunday - only if repeats daily
  repeatsUntilUnixSec: string | null; // format: YYYY-MM-DD (mysql DATE) - repeats until the end of this date so this day is included in repeat

  locationId: number;

  createdById: string;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type PublicEvent = Omit<Event, 'ownNotes' | 'coachesNotes'> & {
  ownNotes?: string;
  coachesNotes?: string;
  location?: Location | null;
  createdByName?: string;
}

export interface EventSettings {
  eventId: number;
  teamId: string;
  published: boolean;
  athletesInByDefault: boolean;
  athletesCanChangeTime: boolean;
  publishEventPlanToAthletes: boolean;
  gatherAttendanceInformation: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventUserAttendance {
  userId: string;
  eventId: number;
  attendance: 'in' | 'out';
  attendanceSetBy: string; // userId of the coach, guardian or athlete who set this
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Plan {
  id: string;
  title: string | null;
  description: string | null;
  scope: OBJECT_SCOPE;
  teamId: string;
  eventId?: number | null;
  copyOfPlanId?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanPart {
  id: string;
  planId: number;
  position: number;
  durationInMinutes?: number | null;
  typeId?: number | null;
  createdAt: Date;
  updatedAt: Date;
  items: PlanPartItem[];
  nodeType?: 'part';
  type?: PlanPartType | null | undefined;
}

export interface PlanPartItem {
  id: string;
  eventId: number;
  partId: string; // can be atached to part or staraight into event
  planId: number;
  type: 'audio' | 'video' | 'text' | 'image' | 'file' | 'rest'; // movement
  position: number; // either in part or in event
  createdAt: Date;
  updatedAt: Date;
  item: PlanPartItemText;
}

export interface PlanPartItemText {
  planPartItemId: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

// own type for all EventPlanPartItem types
// example for rest
export interface PlanPartItemRest {
  eventPlanPartItemId: number;
  timeInSeconds: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanPartItemAudio {
  eventPlanPartItemId: number;
  voiceId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Audio {
  id: number;
  url: string;
  uploadedBy: string;
  scope: 'club' | 'team' | 'athlete';
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanPartType {
  id: string;
  titleObject: string | LocalizationObject;
  scope: 'global' | 'club' | 'team' | 'user';
  position: number;
  userId?: string | null;
  teamId?: string | null;
  clubId?: string | null;
  color: string;
  createdBy: string; // userId of creator
  createdAt: Date;
  updatedAt: Date;
  archived: boolean;
}