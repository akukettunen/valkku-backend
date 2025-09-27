export type EVENT_TYPE = 'training' | 'independent' | 'match' | 'mental' | 'other';

export type localizationObject = {
  [key: string]: string;
}

export interface Event {
  id: string;
  title: string;
  notes: string;
  coachesNotes: string;
  startTimeUnixMs: number;
  endTimeUnixMs: number;
  location: number;
  type: EVENT_TYPE;
  repeats: 'daily' | 'weekly' | 'monthly' | null;
  repeatsOn: string | null; // '1001010' = every monday, thursday and sunday - only if repeats daily
  repeatsUntilUnixMs: number | null;
  status: string;
  teamId: string;
  createdBy: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  durationInMinutes: number | null; // for independent and mental events
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

export interface EventSettings {
  eventId: number;
  athleteCanModifyTime: boolean;
}

export interface EventPlan {
  id: string;
  eventId: number;
  copyOfPlanId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventPlanPart {
  durationInMinutes?: number | null;
  typeId?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventPlanPartItem {
  partId: number; // can be atached to part or staraight into event
  type: 'audio' | 'video' | 'text' | 'image' | 'file' | 'rest'; // movement
  eventId: number;
  position: number; // either in part or in event
  createdAt: Date;
  updatedAt: Date;
}

// own type for all EventPlanPartItem types
// example for rest
export interface EventPlanPartItemRest {
  eventPlanPartItemId: number;
  timeInSeconds: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventPlanPartItemAudio {
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

export interface EventPlanPartType {
  titleObject: string | localizationObject;
  scope: 'global' | 'club' | 'team' | 'athlete';
  teamId?: string | null;
  clubId?: string | null;
  color: string;
  createdBy: string; // userId of creator
  createdAt: Date;
  updatedAt: Date;
}