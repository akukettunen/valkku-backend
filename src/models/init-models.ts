import type { Sequelize } from "sequelize";
import { sequelizeMeta as _sequelizeMeta } from "./sequelizeMeta";
import type { sequelizeMetaAttributes, sequelizeMetaCreationAttributes } from "./sequelizeMeta";
import { calSubscriptions as _calSubscriptions } from "./calSubscriptions";
import type { calSubscriptionsAttributes, calSubscriptionsCreationAttributes } from "./calSubscriptions";
import { eventUsers as _eventUsers } from "./eventUsers";
import type { eventUsersAttributes, eventUsersCreationAttributes } from "./eventUsers";
import { events as _events } from "./events";
import type { eventsAttributes, eventsCreationAttributes } from "./events";
import { folders as _folders } from "./folders";
import type { foldersAttributes, foldersCreationAttributes } from "./folders";
import { locations as _locations } from "./locations";
import type { locationsAttributes, locationsCreationAttributes } from "./locations";
import { passwordResets as _passwordResets } from "./passwordResets";
import type { passwordResetsAttributes, passwordResetsCreationAttributes } from "./passwordResets";
import { periods as _periods } from "./periods";
import type { periodsAttributes, periodsCreationAttributes } from "./periods";
import { planPartItemTexts as _planPartItemTexts } from "./planPartItemTexts";
import type { planPartItemTextsAttributes, planPartItemTextsCreationAttributes } from "./planPartItemTexts";
import { planPartItems as _planPartItems } from "./planPartItems";
import type { planPartItemsAttributes, planPartItemsCreationAttributes } from "./planPartItems";
import { planPartTypes as _planPartTypes } from "./planPartTypes";
import type { planPartTypesAttributes, planPartTypesCreationAttributes } from "./planPartTypes";
import { planParts as _planParts } from "./planParts";
import type { planPartsAttributes, planPartsCreationAttributes } from "./planParts";
import { planPlanParts as _planPlanParts } from "./planPlanParts";
import type { planPlanPartsAttributes, planPlanPartsCreationAttributes } from "./planPlanParts";
import { plans as _plans } from "./plans";
import type { plansAttributes, plansCreationAttributes } from "./plans";
import { sessions as _sessions } from "./sessions";
import type { sessionsAttributes, sessionsCreationAttributes } from "./sessions";
import { teamUserRoles as _teamUserRoles } from "./teamUserRoles";
import type { teamUserRolesAttributes, teamUserRolesCreationAttributes } from "./teamUserRoles";
import { teamUsers as _teamUsers } from "./teamUsers";
import type { teamUsersAttributes, teamUsersCreationAttributes } from "./teamUsers";
import { teams as _teams } from "./teams";
import type { teamsAttributes, teamsCreationAttributes } from "./teams";
import { userEventAttendances as _userEventAttendances } from "./userEventAttendances";
import type { userEventAttendancesAttributes, userEventAttendancesCreationAttributes } from "./userEventAttendances";
import { users as _users } from "./users";
import type { usersAttributes, usersCreationAttributes } from "./users";

export {
  _sequelizeMeta as sequelizeMeta,
  _calSubscriptions as calSubscriptions,
  _eventUsers as eventUsers,
  _events as events,
  _folders as folders,
  _locations as locations,
  _passwordResets as passwordResets,
  _periods as periods,
  _planPartItemTexts as planPartItemTexts,
  _planPartItems as planPartItems,
  _planPartTypes as planPartTypes,
  _planParts as planParts,
  _planPlanParts as planPlanParts,
  _plans as plans,
  _sessions as sessions,
  _teamUserRoles as teamUserRoles,
  _teamUsers as teamUsers,
  _teams as teams,
  _userEventAttendances as userEventAttendances,
  _users as users,
};

export type {
  sequelizeMetaAttributes,
  sequelizeMetaCreationAttributes,
  calSubscriptionsAttributes,
  calSubscriptionsCreationAttributes,
  eventUsersAttributes,
  eventUsersCreationAttributes,
  eventsAttributes,
  eventsCreationAttributes,
  foldersAttributes,
  foldersCreationAttributes,
  locationsAttributes,
  locationsCreationAttributes,
  passwordResetsAttributes,
  passwordResetsCreationAttributes,
  periodsAttributes,
  periodsCreationAttributes,
  planPartItemTextsAttributes,
  planPartItemTextsCreationAttributes,
  planPartItemsAttributes,
  planPartItemsCreationAttributes,
  planPartTypesAttributes,
  planPartTypesCreationAttributes,
  planPartsAttributes,
  planPartsCreationAttributes,
  planPlanPartsAttributes,
  planPlanPartsCreationAttributes,
  plansAttributes,
  plansCreationAttributes,
  sessionsAttributes,
  sessionsCreationAttributes,
  teamUserRolesAttributes,
  teamUserRolesCreationAttributes,
  teamUsersAttributes,
  teamUsersCreationAttributes,
  teamsAttributes,
  teamsCreationAttributes,
  userEventAttendancesAttributes,
  userEventAttendancesCreationAttributes,
  usersAttributes,
  usersCreationAttributes,
};

export function initModels(sequelize: Sequelize) {
  const sequelizeMeta = _sequelizeMeta.initModel(sequelize);
  const calSubscriptions = _calSubscriptions.initModel(sequelize);
  const eventUsers = _eventUsers.initModel(sequelize);
  const events = _events.initModel(sequelize);
  const folders = _folders.initModel(sequelize);
  const locations = _locations.initModel(sequelize);
  const passwordResets = _passwordResets.initModel(sequelize);
  const periods = _periods.initModel(sequelize);
  const planPartItemTexts = _planPartItemTexts.initModel(sequelize);
  const planPartItems = _planPartItems.initModel(sequelize);
  const planPartTypes = _planPartTypes.initModel(sequelize);
  const planParts = _planParts.initModel(sequelize);
  const planPlanParts = _planPlanParts.initModel(sequelize);
  const plans = _plans.initModel(sequelize);
  const sessions = _sessions.initModel(sequelize);
  const teamUserRoles = _teamUserRoles.initModel(sequelize);
  const teamUsers = _teamUsers.initModel(sequelize);
  const teams = _teams.initModel(sequelize);
  const userEventAttendances = _userEventAttendances.initModel(sequelize);
  const users = _users.initModel(sequelize);

  events.belongsToMany(users, { as: 'userIdUsersUserEventAttendances', through: userEventAttendances, foreignKey: "eventId", otherKey: "userId" });
  teams.belongsToMany(users, { as: 'userIdUsers', through: teamUsers, foreignKey: "teamId", otherKey: "userId" });
  users.belongsToMany(events, { as: 'eventIdEvents', through: userEventAttendances, foreignKey: "userId", otherKey: "eventId" });
  users.belongsToMany(teams, { as: 'teamIdTeams', through: teamUsers, foreignKey: "userId", otherKey: "teamId" });
  eventUsers.belongsTo(events, { foreignKey: "eventId"});
  events.hasMany(eventUsers, { foreignKey: "eventId"});
  events.belongsTo(events, { foreignKey: "baseEventId"});
  events.hasMany(events, { foreignKey: "baseEventId"});
  userEventAttendances.belongsTo(events, { foreignKey: "eventId"});
  events.hasMany(userEventAttendances, { foreignKey: "eventId"});
  folders.belongsTo(folders, { foreignKey: "parentId"});
  folders.hasMany(folders, { foreignKey: "parentId"});
  planPartTypes.belongsTo(folders, { foreignKey: "folderId"});
  folders.hasMany(planPartTypes, { foreignKey: "folderId"});
  planParts.belongsTo(folders, { foreignKey: "folderId"});
  folders.hasMany(planParts, { foreignKey: "folderId"});
  events.belongsTo(locations, { foreignKey: "locationId"});
  locations.hasMany(events, { foreignKey: "locationId"});
  planPartItemTexts.belongsTo(planPartItems, { foreignKey: "planPartItemId"});
  planPartItems.hasOne(planPartItemTexts, { foreignKey: "planPartItemId"});
  planParts.belongsTo(planPartTypes, { foreignKey: "typeId"});
  planPartTypes.hasMany(planParts, { foreignKey: "typeId"});
  planPartItems.belongsTo(planParts, { foreignKey: "partId"});
  planParts.hasMany(planPartItems, { foreignKey: "partId"});
  planPlanParts.belongsTo(planParts, { foreignKey: "planPartId"});
  planParts.hasMany(planPlanParts, { foreignKey: "planPartId"});
  events.belongsTo(plans, { foreignKey: "planId"});
  plans.hasMany(events, { foreignKey: "planId"});
  planPlanParts.belongsTo(plans, { foreignKey: "planId"});
  plans.hasMany(planPlanParts, { foreignKey: "planId"});
  plans.belongsTo(plans, { foreignKey: "copyOfPlanId"});
  plans.hasMany(plans, { foreignKey: "copyOfPlanId"});
  calSubscriptions.belongsTo(teams, { foreignKey: "teamId"});
  teams.hasMany(calSubscriptions, { foreignKey: "teamId"});
  events.belongsTo(teams, { foreignKey: "teamId"});
  teams.hasMany(events, { foreignKey: "teamId"});
  locations.belongsTo(teams, { foreignKey: "teamId"});
  teams.hasMany(locations, { foreignKey: "teamId"});
  periods.belongsTo(teams, { foreignKey: "teamId"});
  teams.hasMany(periods, { foreignKey: "teamId"});
  planPartTypes.belongsTo(teams, { foreignKey: "teamId"});
  teams.hasMany(planPartTypes, { foreignKey: "teamId"});
  planParts.belongsTo(teams, { foreignKey: "teamId"});
  teams.hasMany(planParts, { foreignKey: "teamId"});
  plans.belongsTo(teams, { foreignKey: "teamId"});
  teams.hasMany(plans, { foreignKey: "teamId"});
  teamUserRoles.belongsTo(teams, { foreignKey: "teamId"});
  teams.hasMany(teamUserRoles, { foreignKey: "teamId"});
  teamUsers.belongsTo(teams, { foreignKey: "teamId"});
  teams.hasMany(teamUsers, { foreignKey: "teamId"});
  calSubscriptions.belongsTo(users, { foreignKey: "userId"});
  users.hasMany(calSubscriptions, { foreignKey: "userId"});
  calSubscriptions.belongsTo(users, { foreignKey: "guardianOfId"});
  users.hasMany(calSubscriptions, { foreignKey: "guardianOfId"});
  eventUsers.belongsTo(users, { foreignKey: "userId"});
  users.hasMany(eventUsers, { foreignKey: "userId"});
  events.belongsTo(users, { foreignKey: "createdById"});
  users.hasMany(events, { foreignKey: "createdById"});
  passwordResets.belongsTo(users, { foreignKey: "userId"});
  users.hasMany(passwordResets, { foreignKey: "userId"});
  periods.belongsTo(users, { foreignKey: "createdById"});
  users.hasMany(periods, { foreignKey: "createdById"});
  planPartTypes.belongsTo(users, { foreignKey: "createdById"});
  users.hasMany(planPartTypes, { foreignKey: "createdById"});
  planPartTypes.belongsTo(users, { foreignKey: "userId"});
  users.hasMany(planPartTypes, { foreignKey: "userId"});
  planParts.belongsTo(users, { foreignKey: "createdById"});
  users.hasMany(planParts, { foreignKey: "createdById"});
  plans.belongsTo(users, { foreignKey: "createdById"});
  users.hasMany(plans, { foreignKey: "createdById"});
  teamUserRoles.belongsTo(users, { foreignKey: "guardianOf"});
  users.hasMany(teamUserRoles, { foreignKey: "guardianOf"});
  teamUserRoles.belongsTo(users, { foreignKey: "userId"});
  users.hasMany(teamUserRoles, { foreignKey: "userId"});
  teamUsers.belongsTo(users, { foreignKey: "userId"});
  users.hasMany(teamUsers, { foreignKey: "userId"});
  userEventAttendances.belongsTo(users, { foreignKey: "userId"});
  users.hasMany(userEventAttendances, { foreignKey: "userId"});

  return {
    sequelizeMeta: sequelizeMeta,
    calSubscriptions: calSubscriptions,
    eventUsers: eventUsers,
    events: events,
    folders: folders,
    locations: locations,
    passwordResets: passwordResets,
    periods: periods,
    planPartItemTexts: planPartItemTexts,
    planPartItems: planPartItems,
    planPartTypes: planPartTypes,
    planParts: planParts,
    planPlanParts: planPlanParts,
    plans: plans,
    sessions: sessions,
    teamUserRoles: teamUserRoles,
    teamUsers: teamUsers,
    teams: teams,
    userEventAttendances: userEventAttendances,
    users: users,
  };
}
