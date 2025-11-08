import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { calSubscriptions, calSubscriptionsId } from './calSubscriptions';
import type { events, eventsId } from './events';
import type { locations, locationsId } from './locations';
import type { planPartTypes, planPartTypesId } from './planPartTypes';
import type { planParts, planPartsId } from './planParts';
import type { plans, plansId } from './plans';
import type { teamUserRoles, teamUserRolesId } from './teamUserRoles';
import type { teamUsers, teamUsersId } from './teamUsers';
import type { users, usersId } from './users';

export interface teamsAttributes {
  id: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type teamsPk = "id";
export type teamsId = teams[teamsPk];
export type teamsOptionalAttributes = "createdAt" | "updatedAt";
export type teamsCreationAttributes = Optional<teamsAttributes, teamsOptionalAttributes>;

export class teams extends Model<teamsAttributes, teamsCreationAttributes> implements teamsAttributes {
  id!: string;
  name!: string;
  createdAt?: Date;
  updatedAt?: Date;

  // teams hasMany calSubscriptions via teamId
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
  // teams hasMany events via teamId
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
  // teams hasMany locations via teamId
  locations!: locations[];
  getLocations!: Sequelize.HasManyGetAssociationsMixin<locations>;
  setLocations!: Sequelize.HasManySetAssociationsMixin<locations, locationsId>;
  addLocation!: Sequelize.HasManyAddAssociationMixin<locations, locationsId>;
  addLocations!: Sequelize.HasManyAddAssociationsMixin<locations, locationsId>;
  createLocation!: Sequelize.HasManyCreateAssociationMixin<locations>;
  removeLocation!: Sequelize.HasManyRemoveAssociationMixin<locations, locationsId>;
  removeLocations!: Sequelize.HasManyRemoveAssociationsMixin<locations, locationsId>;
  hasLocation!: Sequelize.HasManyHasAssociationMixin<locations, locationsId>;
  hasLocations!: Sequelize.HasManyHasAssociationsMixin<locations, locationsId>;
  countLocations!: Sequelize.HasManyCountAssociationsMixin;
  // teams hasMany planPartTypes via teamId
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
  // teams hasMany planParts via teamId
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
  // teams hasMany plans via teamId
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
  // teams hasMany teamUserRoles via teamId
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
  // teams hasMany teamUsers via teamId
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
  // teams belongsToMany users via teamId and userId
  userIdUsers!: users[];
  getUserIdUsers!: Sequelize.BelongsToManyGetAssociationsMixin<users>;
  setUserIdUsers!: Sequelize.BelongsToManySetAssociationsMixin<users, usersId>;
  addUserIdUser!: Sequelize.BelongsToManyAddAssociationMixin<users, usersId>;
  addUserIdUsers!: Sequelize.BelongsToManyAddAssociationsMixin<users, usersId>;
  createUserIdUser!: Sequelize.BelongsToManyCreateAssociationMixin<users>;
  removeUserIdUser!: Sequelize.BelongsToManyRemoveAssociationMixin<users, usersId>;
  removeUserIdUsers!: Sequelize.BelongsToManyRemoveAssociationsMixin<users, usersId>;
  hasUserIdUser!: Sequelize.BelongsToManyHasAssociationMixin<users, usersId>;
  hasUserIdUsers!: Sequelize.BelongsToManyHasAssociationsMixin<users, usersId>;
  countUserIdUsers!: Sequelize.BelongsToManyCountAssociationsMixin;

  static initModel(sequelize: Sequelize.Sequelize): typeof teams {
    return teams.init({
    id: {
      type: DataTypes.STRING(21),
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(300),
      allowNull: false
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
    }
  }, {
    sequelize,
    tableName: 'teams',
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
    ]
  });
  }
}
