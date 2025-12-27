import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { eventUsers, eventUsersId } from './eventUsers';
import type { locations, locationsId } from './locations';
import type { plans, plansId } from './plans';
import type { teams, teamsId } from './teams';
import type { userEventAttendances, userEventAttendancesId } from './userEventAttendances';
import type { users, usersId } from './users';

export interface eventsAttributes {
  id: number;
  title: string;
  teamId: string;
  type: 'practise' | 'match' | 'meeting' | 'self_training' | 'other_event' | 'mental';
  status: 'draft' | 'published' | 'archived';
  createdById?: string;
  athleteId?: string;
  notes?: string;
  ownNotes?: string;
  coachesNotes?: string;
  eventDate: string;
  startTimeUnixSec?: number;
  endTimeUnixSec?: number;
  durationInMinutes?: number;
  repeats?: 'daily' | 'weekly' | 'monthly';
  repeatsOn?: string;
  repeatsUntilUnixSec?: number;
  planId?: number;
  locationId?: number;
  createdAt?: Date;
  updatedAt?: Date;
  timezone: string;
  baseEventId?: number;
  registrationRequired: number;
  forAllAthletes: number;
  forAllUsers: number;
  forAllStaff?: number;
}

export type eventsPk = "id";
export type eventsId = events[eventsPk];
export type eventsOptionalAttributes = "id" | "status" | "createdById" | "athleteId" | "notes" | "ownNotes" | "coachesNotes" | "startTimeUnixSec" | "endTimeUnixSec" | "durationInMinutes" | "repeats" | "repeatsOn" | "repeatsUntilUnixSec" | "planId" | "locationId" | "createdAt" | "updatedAt" | "timezone" | "baseEventId" | "registrationRequired" | "forAllAthletes" | "forAllUsers" | "forAllStaff";
export type eventsCreationAttributes = Optional<eventsAttributes, eventsOptionalAttributes>;

export class events extends Model<eventsAttributes, eventsCreationAttributes> implements eventsAttributes {
  id!: number;
  title!: string;
  teamId!: string;
  type!: 'practise' | 'match' | 'meeting' | 'self_training' | 'other_event' | 'mental';
  status!: 'draft' | 'published' | 'archived';
  createdById?: string;
  athleteId?: string;
  notes?: string;
  ownNotes?: string;
  coachesNotes?: string;
  eventDate!: string;
  startTimeUnixSec?: number;
  endTimeUnixSec?: number;
  durationInMinutes?: number;
  repeats?: 'daily' | 'weekly' | 'monthly';
  repeatsOn?: string;
  repeatsUntilUnixSec?: number;
  planId?: number;
  locationId?: number;
  createdAt?: Date;
  updatedAt?: Date;
  timezone!: string;
  baseEventId?: number;
  registrationRequired!: number;
  forAllAthletes!: number;
  forAllUsers!: number;
  forAllStaff?: number;

  // events hasMany eventUsers via eventId
  eventUsers!: eventUsers[];
  getEventUsers!: Sequelize.HasManyGetAssociationsMixin<eventUsers>;
  setEventUsers!: Sequelize.HasManySetAssociationsMixin<eventUsers, eventUsersId>;
  addEventUser!: Sequelize.HasManyAddAssociationMixin<eventUsers, eventUsersId>;
  addEventUsers!: Sequelize.HasManyAddAssociationsMixin<eventUsers, eventUsersId>;
  createEventUser!: Sequelize.HasManyCreateAssociationMixin<eventUsers>;
  removeEventUser!: Sequelize.HasManyRemoveAssociationMixin<eventUsers, eventUsersId>;
  removeEventUsers!: Sequelize.HasManyRemoveAssociationsMixin<eventUsers, eventUsersId>;
  hasEventUser!: Sequelize.HasManyHasAssociationMixin<eventUsers, eventUsersId>;
  hasEventUsers!: Sequelize.HasManyHasAssociationsMixin<eventUsers, eventUsersId>;
  countEventUsers!: Sequelize.HasManyCountAssociationsMixin;
  // events belongsTo events via baseEventId
  baseEvent!: events;
  getBaseEvent!: Sequelize.BelongsToGetAssociationMixin<events>;
  setBaseEvent!: Sequelize.BelongsToSetAssociationMixin<events, eventsId>;
  createBaseEvent!: Sequelize.BelongsToCreateAssociationMixin<events>;
  // events hasMany userEventAttendances via eventId
  userEventAttendances!: userEventAttendances[];
  getUserEventAttendances!: Sequelize.HasManyGetAssociationsMixin<userEventAttendances>;
  setUserEventAttendances!: Sequelize.HasManySetAssociationsMixin<userEventAttendances, userEventAttendancesId>;
  addUserEventAttendance!: Sequelize.HasManyAddAssociationMixin<userEventAttendances, userEventAttendancesId>;
  addUserEventAttendances!: Sequelize.HasManyAddAssociationsMixin<userEventAttendances, userEventAttendancesId>;
  createUserEventAttendance!: Sequelize.HasManyCreateAssociationMixin<userEventAttendances>;
  removeUserEventAttendance!: Sequelize.HasManyRemoveAssociationMixin<userEventAttendances, userEventAttendancesId>;
  removeUserEventAttendances!: Sequelize.HasManyRemoveAssociationsMixin<userEventAttendances, userEventAttendancesId>;
  hasUserEventAttendance!: Sequelize.HasManyHasAssociationMixin<userEventAttendances, userEventAttendancesId>;
  hasUserEventAttendances!: Sequelize.HasManyHasAssociationsMixin<userEventAttendances, userEventAttendancesId>;
  countUserEventAttendances!: Sequelize.HasManyCountAssociationsMixin;
  // events belongsToMany users via eventId and userId
  userIdUsersUserEventAttendances!: users[];
  getUserIdUsersUserEventAttendances!: Sequelize.BelongsToManyGetAssociationsMixin<users>;
  setUserIdUsersUserEventAttendances!: Sequelize.BelongsToManySetAssociationsMixin<users, usersId>;
  addUserIdUsersUserEventAttendance!: Sequelize.BelongsToManyAddAssociationMixin<users, usersId>;
  addUserIdUsersUserEventAttendances!: Sequelize.BelongsToManyAddAssociationsMixin<users, usersId>;
  createUserIdUsersUserEventAttendance!: Sequelize.BelongsToManyCreateAssociationMixin<users>;
  removeUserIdUsersUserEventAttendance!: Sequelize.BelongsToManyRemoveAssociationMixin<users, usersId>;
  removeUserIdUsersUserEventAttendances!: Sequelize.BelongsToManyRemoveAssociationsMixin<users, usersId>;
  hasUserIdUsersUserEventAttendance!: Sequelize.BelongsToManyHasAssociationMixin<users, usersId>;
  hasUserIdUsersUserEventAttendances!: Sequelize.BelongsToManyHasAssociationsMixin<users, usersId>;
  countUserIdUsersUserEventAttendances!: Sequelize.BelongsToManyCountAssociationsMixin;
  // events belongsTo locations via locationId
  location!: locations;
  getLocation!: Sequelize.BelongsToGetAssociationMixin<locations>;
  setLocation!: Sequelize.BelongsToSetAssociationMixin<locations, locationsId>;
  createLocation!: Sequelize.BelongsToCreateAssociationMixin<locations>;
  // events belongsTo plans via planId
  plan!: plans;
  getPlan!: Sequelize.BelongsToGetAssociationMixin<plans>;
  setPlan!: Sequelize.BelongsToSetAssociationMixin<plans, plansId>;
  createPlan!: Sequelize.BelongsToCreateAssociationMixin<plans>;
  // events belongsTo teams via teamId
  team!: teams;
  getTeam!: Sequelize.BelongsToGetAssociationMixin<teams>;
  setTeam!: Sequelize.BelongsToSetAssociationMixin<teams, teamsId>;
  createTeam!: Sequelize.BelongsToCreateAssociationMixin<teams>;
  // events belongsTo users via athleteId
  athlete!: users;
  getAthlete!: Sequelize.BelongsToGetAssociationMixin<users>;
  setAthlete!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createAthlete!: Sequelize.BelongsToCreateAssociationMixin<users>;
  // events belongsTo users via createdById
  createdBy!: users;
  getCreatedBy!: Sequelize.BelongsToGetAssociationMixin<users>;
  setCreatedBy!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createCreatedBy!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof events {
    return events.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(400),
      allowNull: false
    },
    teamId: {
      type: DataTypes.STRING(21),
      allowNull: false,
      references: {
        model: 'teams',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('practise','match','meeting','self_training','other_event','mental'),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('draft','published','archived'),
      allowNull: false,
      defaultValue: "published"
    },
    createdById: {
      type: DataTypes.STRING(21),
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    athleteId: {
      type: DataTypes.STRING(21),
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    notes: {
      type: DataTypes.STRING(1000),
      allowNull: true
    },
    ownNotes: {
      type: DataTypes.STRING(1000),
      allowNull: true
    },
    coachesNotes: {
      type: DataTypes.STRING(1000),
      allowNull: true
    },
    eventDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    startTimeUnixSec: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    endTimeUnixSec: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    durationInMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    repeats: {
      type: DataTypes.ENUM('daily','weekly','monthly'),
      allowNull: true
    },
    repeatsOn: {
      type: DataTypes.STRING(7),
      allowNull: true
    },
    repeatsUntilUnixSec: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    planId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'plans',
        key: 'id'
      }
    },
    locationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'locations',
        key: 'id'
      }
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    timezone: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "Europe\/Helsinki"
    },
    baseEventId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'events',
        key: 'id'
      }
    },
    registrationRequired: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 1
    },
    forAllAthletes: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 1
    },
    forAllUsers: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 1
    },
    forAllStaff: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: 1
    }
  }, {
    sequelize,
    tableName: 'events',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "teamId",
        using: "BTREE",
        fields: [
          { name: "teamId" },
        ]
      },
      {
        name: "locationId",
        using: "BTREE",
        fields: [
          { name: "locationId" },
        ]
      },
      {
        name: "createdById",
        using: "BTREE",
        fields: [
          { name: "createdById" },
        ]
      },
      {
        name: "planId",
        using: "BTREE",
        fields: [
          { name: "planId" },
        ]
      },
      {
        name: "events_baseEventId_foreign_idx",
        using: "BTREE",
        fields: [
          { name: "baseEventId" },
        ]
      },
      {
        name: "events_athleteId_idx",
        using: "BTREE",
        fields: [
          { name: "athleteId" },
        ]
      },
    ]
  });
  }
}
