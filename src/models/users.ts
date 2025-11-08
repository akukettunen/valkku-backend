import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { calSubscriptions, calSubscriptionsId } from './calSubscriptions';
import type { events, eventsId } from './events';
import type { passwordResets, passwordResetsId } from './passwordResets';
import type { planPartTypes, planPartTypesId } from './planPartTypes';
import type { planParts, planPartsId } from './planParts';
import type { plans, plansId } from './plans';
import type { teamUserRoles, teamUserRolesId } from './teamUserRoles';
import type { teamUsers, teamUsersId } from './teamUsers';
import type { teams, teamsId } from './teams';
import type { userEventAttendances, userEventAttendancesId } from './userEventAttendances';

export interface usersAttributes {
  id: string;
  email: string;
  emailLc?: string;
  passwordHash?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  emailConfirmed: number;
  profilePictureUrl?: string;
  preferredLanguage: string;
  forcePasswordChange: number;
  emojiClickedCount: number;
  createdAt?: Date;
  updatedAt?: Date;
  superAdmin: number;
}

export type usersPk = "id";
export type usersId = users[usersPk];
export type usersOptionalAttributes = "emailLc" | "passwordHash" | "firstName" | "lastName" | "fullName" | "emailConfirmed" | "profilePictureUrl" | "preferredLanguage" | "forcePasswordChange" | "emojiClickedCount" | "createdAt" | "updatedAt" | "superAdmin";
export type usersCreationAttributes = Optional<usersAttributes, usersOptionalAttributes>;

export class users extends Model<usersAttributes, usersCreationAttributes> implements usersAttributes {
  id!: string;
  email!: string;
  emailLc?: string;
  passwordHash?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  emailConfirmed!: number;
  profilePictureUrl?: string;
  preferredLanguage!: string;
  forcePasswordChange!: number;
  emojiClickedCount!: number;
  createdAt?: Date;
  updatedAt?: Date;
  superAdmin!: number;

  // users hasMany calSubscriptions via userId
  calSubscriptions!: calSubscriptions[];
  getCalSubscriptions!: Sequelize.HasManyGetAssociationsMixin<calSubscriptions>;
  setCalSubscriptions!: Sequelize.HasManySetAssociationsMixin<calSubscriptions, calSubscriptionsId>;
  addCalSubscription!: Sequelize.HasManyAddAssociationMixin<calSubscriptions, calSubscriptionsId>;
  addCalSubscriptions!: Sequelize.HasManyAddAssociationsMixin<calSubscriptions, calSubscriptionsId>;
  createCalSubscription!: Sequelize.HasManyCreateAssociationMixin<calSubscriptions>;
  removeCalSubscription!: Sequelize.HasManyRemoveAssociationMixin<calSubscriptions, calSubscriptionsId>;
  removeCalSubscriptions!: Sequelize.HasManyRemoveAssociationsMixin<calSubscriptions, calSubscriptionsId>;
  hasCalSubscription!: Sequelize.HasManyHasAssociationMixin<calSubscriptions, calSubscriptionsId>;
  hasCalSubscriptions!: Sequelize.HasManyHasAssociationsMixin<calSubscriptions, calSubscriptionsId>;
  countCalSubscriptions!: Sequelize.HasManyCountAssociationsMixin;
  // users hasMany calSubscriptions via guardianOfId
  guardianOfCalSubscriptions!: calSubscriptions[];
  getGuardianOfCalSubscriptions!: Sequelize.HasManyGetAssociationsMixin<calSubscriptions>;
  setGuardianOfCalSubscriptions!: Sequelize.HasManySetAssociationsMixin<calSubscriptions, calSubscriptionsId>;
  addGuardianOfCalSubscription!: Sequelize.HasManyAddAssociationMixin<calSubscriptions, calSubscriptionsId>;
  addGuardianOfCalSubscriptions!: Sequelize.HasManyAddAssociationsMixin<calSubscriptions, calSubscriptionsId>;
  createGuardianOfCalSubscription!: Sequelize.HasManyCreateAssociationMixin<calSubscriptions>;
  removeGuardianOfCalSubscription!: Sequelize.HasManyRemoveAssociationMixin<calSubscriptions, calSubscriptionsId>;
  removeGuardianOfCalSubscriptions!: Sequelize.HasManyRemoveAssociationsMixin<calSubscriptions, calSubscriptionsId>;
  hasGuardianOfCalSubscription!: Sequelize.HasManyHasAssociationMixin<calSubscriptions, calSubscriptionsId>;
  hasGuardianOfCalSubscriptions!: Sequelize.HasManyHasAssociationsMixin<calSubscriptions, calSubscriptionsId>;
  countGuardianOfCalSubscriptions!: Sequelize.HasManyCountAssociationsMixin;
  // users hasMany events via createdById
  events!: events[];
  getEvents!: Sequelize.HasManyGetAssociationsMixin<events>;
  setEvents!: Sequelize.HasManySetAssociationsMixin<events, eventsId>;
  addEvent!: Sequelize.HasManyAddAssociationMixin<events, eventsId>;
  addEvents!: Sequelize.HasManyAddAssociationsMixin<events, eventsId>;
  createEvent!: Sequelize.HasManyCreateAssociationMixin<events>;
  removeEvent!: Sequelize.HasManyRemoveAssociationMixin<events, eventsId>;
  removeEvents!: Sequelize.HasManyRemoveAssociationsMixin<events, eventsId>;
  hasEvent!: Sequelize.HasManyHasAssociationMixin<events, eventsId>;
  hasEvents!: Sequelize.HasManyHasAssociationsMixin<events, eventsId>;
  countEvents!: Sequelize.HasManyCountAssociationsMixin;
  // users belongsToMany events via userId and eventId
  eventIdEvents!: events[];
  getEventIdEvents!: Sequelize.BelongsToManyGetAssociationsMixin<events>;
  setEventIdEvents!: Sequelize.BelongsToManySetAssociationsMixin<events, eventsId>;
  addEventIdEvent!: Sequelize.BelongsToManyAddAssociationMixin<events, eventsId>;
  addEventIdEvents!: Sequelize.BelongsToManyAddAssociationsMixin<events, eventsId>;
  createEventIdEvent!: Sequelize.BelongsToManyCreateAssociationMixin<events>;
  removeEventIdEvent!: Sequelize.BelongsToManyRemoveAssociationMixin<events, eventsId>;
  removeEventIdEvents!: Sequelize.BelongsToManyRemoveAssociationsMixin<events, eventsId>;
  hasEventIdEvent!: Sequelize.BelongsToManyHasAssociationMixin<events, eventsId>;
  hasEventIdEvents!: Sequelize.BelongsToManyHasAssociationsMixin<events, eventsId>;
  countEventIdEvents!: Sequelize.BelongsToManyCountAssociationsMixin;
  // users hasMany passwordResets via userId
  passwordResets!: passwordResets[];
  getPasswordResets!: Sequelize.HasManyGetAssociationsMixin<passwordResets>;
  setPasswordResets!: Sequelize.HasManySetAssociationsMixin<passwordResets, passwordResetsId>;
  addPasswordReset!: Sequelize.HasManyAddAssociationMixin<passwordResets, passwordResetsId>;
  addPasswordResets!: Sequelize.HasManyAddAssociationsMixin<passwordResets, passwordResetsId>;
  createPasswordReset!: Sequelize.HasManyCreateAssociationMixin<passwordResets>;
  removePasswordReset!: Sequelize.HasManyRemoveAssociationMixin<passwordResets, passwordResetsId>;
  removePasswordResets!: Sequelize.HasManyRemoveAssociationsMixin<passwordResets, passwordResetsId>;
  hasPasswordReset!: Sequelize.HasManyHasAssociationMixin<passwordResets, passwordResetsId>;
  hasPasswordResets!: Sequelize.HasManyHasAssociationsMixin<passwordResets, passwordResetsId>;
  countPasswordResets!: Sequelize.HasManyCountAssociationsMixin;
  // users hasMany planPartTypes via createdById
  planPartTypes!: planPartTypes[];
  getPlanPartTypes!: Sequelize.HasManyGetAssociationsMixin<planPartTypes>;
  setPlanPartTypes!: Sequelize.HasManySetAssociationsMixin<planPartTypes, planPartTypesId>;
  addPlanPartType!: Sequelize.HasManyAddAssociationMixin<planPartTypes, planPartTypesId>;
  addPlanPartTypes!: Sequelize.HasManyAddAssociationsMixin<planPartTypes, planPartTypesId>;
  createPlanPartType!: Sequelize.HasManyCreateAssociationMixin<planPartTypes>;
  removePlanPartType!: Sequelize.HasManyRemoveAssociationMixin<planPartTypes, planPartTypesId>;
  removePlanPartTypes!: Sequelize.HasManyRemoveAssociationsMixin<planPartTypes, planPartTypesId>;
  hasPlanPartType!: Sequelize.HasManyHasAssociationMixin<planPartTypes, planPartTypesId>;
  hasPlanPartTypes!: Sequelize.HasManyHasAssociationsMixin<planPartTypes, planPartTypesId>;
  countPlanPartTypes!: Sequelize.HasManyCountAssociationsMixin;
  // users hasMany planPartTypes via userId
  userPlanPartTypes!: planPartTypes[];
  getUserPlanPartTypes!: Sequelize.HasManyGetAssociationsMixin<planPartTypes>;
  setUserPlanPartTypes!: Sequelize.HasManySetAssociationsMixin<planPartTypes, planPartTypesId>;
  addUserPlanPartType!: Sequelize.HasManyAddAssociationMixin<planPartTypes, planPartTypesId>;
  addUserPlanPartTypes!: Sequelize.HasManyAddAssociationsMixin<planPartTypes, planPartTypesId>;
  createUserPlanPartType!: Sequelize.HasManyCreateAssociationMixin<planPartTypes>;
  removeUserPlanPartType!: Sequelize.HasManyRemoveAssociationMixin<planPartTypes, planPartTypesId>;
  removeUserPlanPartTypes!: Sequelize.HasManyRemoveAssociationsMixin<planPartTypes, planPartTypesId>;
  hasUserPlanPartType!: Sequelize.HasManyHasAssociationMixin<planPartTypes, planPartTypesId>;
  hasUserPlanPartTypes!: Sequelize.HasManyHasAssociationsMixin<planPartTypes, planPartTypesId>;
  countUserPlanPartTypes!: Sequelize.HasManyCountAssociationsMixin;
  // users hasMany planParts via createdById
  planParts!: planParts[];
  getPlanParts!: Sequelize.HasManyGetAssociationsMixin<planParts>;
  setPlanParts!: Sequelize.HasManySetAssociationsMixin<planParts, planPartsId>;
  addPlanPart!: Sequelize.HasManyAddAssociationMixin<planParts, planPartsId>;
  addPlanParts!: Sequelize.HasManyAddAssociationsMixin<planParts, planPartsId>;
  createPlanPart!: Sequelize.HasManyCreateAssociationMixin<planParts>;
  removePlanPart!: Sequelize.HasManyRemoveAssociationMixin<planParts, planPartsId>;
  removePlanParts!: Sequelize.HasManyRemoveAssociationsMixin<planParts, planPartsId>;
  hasPlanPart!: Sequelize.HasManyHasAssociationMixin<planParts, planPartsId>;
  hasPlanParts!: Sequelize.HasManyHasAssociationsMixin<planParts, planPartsId>;
  countPlanParts!: Sequelize.HasManyCountAssociationsMixin;
  // users hasMany plans via createdById
  plans!: plans[];
  getPlans!: Sequelize.HasManyGetAssociationsMixin<plans>;
  setPlans!: Sequelize.HasManySetAssociationsMixin<plans, plansId>;
  addPlan!: Sequelize.HasManyAddAssociationMixin<plans, plansId>;
  addPlans!: Sequelize.HasManyAddAssociationsMixin<plans, plansId>;
  createPlan!: Sequelize.HasManyCreateAssociationMixin<plans>;
  removePlan!: Sequelize.HasManyRemoveAssociationMixin<plans, plansId>;
  removePlans!: Sequelize.HasManyRemoveAssociationsMixin<plans, plansId>;
  hasPlan!: Sequelize.HasManyHasAssociationMixin<plans, plansId>;
  hasPlans!: Sequelize.HasManyHasAssociationsMixin<plans, plansId>;
  countPlans!: Sequelize.HasManyCountAssociationsMixin;
  // users hasMany teamUserRoles via guardianOf
  teamUserRoles!: teamUserRoles[];
  getTeamUserRoles!: Sequelize.HasManyGetAssociationsMixin<teamUserRoles>;
  setTeamUserRoles!: Sequelize.HasManySetAssociationsMixin<teamUserRoles, teamUserRolesId>;
  addTeamUserRole!: Sequelize.HasManyAddAssociationMixin<teamUserRoles, teamUserRolesId>;
  addTeamUserRoles!: Sequelize.HasManyAddAssociationsMixin<teamUserRoles, teamUserRolesId>;
  createTeamUserRole!: Sequelize.HasManyCreateAssociationMixin<teamUserRoles>;
  removeTeamUserRole!: Sequelize.HasManyRemoveAssociationMixin<teamUserRoles, teamUserRolesId>;
  removeTeamUserRoles!: Sequelize.HasManyRemoveAssociationsMixin<teamUserRoles, teamUserRolesId>;
  hasTeamUserRole!: Sequelize.HasManyHasAssociationMixin<teamUserRoles, teamUserRolesId>;
  hasTeamUserRoles!: Sequelize.HasManyHasAssociationsMixin<teamUserRoles, teamUserRolesId>;
  countTeamUserRoles!: Sequelize.HasManyCountAssociationsMixin;
  // users hasMany teamUserRoles via userId
  userTeamUserRoles!: teamUserRoles[];
  getUserTeamUserRoles!: Sequelize.HasManyGetAssociationsMixin<teamUserRoles>;
  setUserTeamUserRoles!: Sequelize.HasManySetAssociationsMixin<teamUserRoles, teamUserRolesId>;
  addUserTeamUserRole!: Sequelize.HasManyAddAssociationMixin<teamUserRoles, teamUserRolesId>;
  addUserTeamUserRoles!: Sequelize.HasManyAddAssociationsMixin<teamUserRoles, teamUserRolesId>;
  createUserTeamUserRole!: Sequelize.HasManyCreateAssociationMixin<teamUserRoles>;
  removeUserTeamUserRole!: Sequelize.HasManyRemoveAssociationMixin<teamUserRoles, teamUserRolesId>;
  removeUserTeamUserRoles!: Sequelize.HasManyRemoveAssociationsMixin<teamUserRoles, teamUserRolesId>;
  hasUserTeamUserRole!: Sequelize.HasManyHasAssociationMixin<teamUserRoles, teamUserRolesId>;
  hasUserTeamUserRoles!: Sequelize.HasManyHasAssociationsMixin<teamUserRoles, teamUserRolesId>;
  countUserTeamUserRoles!: Sequelize.HasManyCountAssociationsMixin;
  // users hasMany teamUsers via userId
  teamUsers!: teamUsers[];
  getTeamUsers!: Sequelize.HasManyGetAssociationsMixin<teamUsers>;
  setTeamUsers!: Sequelize.HasManySetAssociationsMixin<teamUsers, teamUsersId>;
  addTeamUser!: Sequelize.HasManyAddAssociationMixin<teamUsers, teamUsersId>;
  addTeamUsers!: Sequelize.HasManyAddAssociationsMixin<teamUsers, teamUsersId>;
  createTeamUser!: Sequelize.HasManyCreateAssociationMixin<teamUsers>;
  removeTeamUser!: Sequelize.HasManyRemoveAssociationMixin<teamUsers, teamUsersId>;
  removeTeamUsers!: Sequelize.HasManyRemoveAssociationsMixin<teamUsers, teamUsersId>;
  hasTeamUser!: Sequelize.HasManyHasAssociationMixin<teamUsers, teamUsersId>;
  hasTeamUsers!: Sequelize.HasManyHasAssociationsMixin<teamUsers, teamUsersId>;
  countTeamUsers!: Sequelize.HasManyCountAssociationsMixin;
  // users belongsToMany teams via userId and teamId
  teamIdTeams!: teams[];
  getTeamIdTeams!: Sequelize.BelongsToManyGetAssociationsMixin<teams>;
  setTeamIdTeams!: Sequelize.BelongsToManySetAssociationsMixin<teams, teamsId>;
  addTeamIdTeam!: Sequelize.BelongsToManyAddAssociationMixin<teams, teamsId>;
  addTeamIdTeams!: Sequelize.BelongsToManyAddAssociationsMixin<teams, teamsId>;
  createTeamIdTeam!: Sequelize.BelongsToManyCreateAssociationMixin<teams>;
  removeTeamIdTeam!: Sequelize.BelongsToManyRemoveAssociationMixin<teams, teamsId>;
  removeTeamIdTeams!: Sequelize.BelongsToManyRemoveAssociationsMixin<teams, teamsId>;
  hasTeamIdTeam!: Sequelize.BelongsToManyHasAssociationMixin<teams, teamsId>;
  hasTeamIdTeams!: Sequelize.BelongsToManyHasAssociationsMixin<teams, teamsId>;
  countTeamIdTeams!: Sequelize.BelongsToManyCountAssociationsMixin;
  // users hasMany userEventAttendances via userId
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

  static initModel(sequelize: Sequelize.Sequelize): typeof users {
    return users.init({
    id: {
      type: DataTypes.STRING(21),
      allowNull: false,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    emailLc: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: "ux_users_emailLc"
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    firstName: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    lastName: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    fullName: {
      type: DataTypes.STRING(511),
      allowNull: true
    },
    emailConfirmed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0
    },
    profilePictureUrl: {
      type: DataTypes.STRING(1000),
      allowNull: true
    },
    preferredLanguage: {
      type: DataTypes.STRING(6),
      allowNull: false,
      defaultValue: "en"
    },
    forcePasswordChange: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0
    },
    emojiClickedCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
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
    superAdmin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    sequelize,
    tableName: 'users',
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
        name: "ux_users_emailLc",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "emailLc" },
        ]
      },
    ]
  });
  }
}
