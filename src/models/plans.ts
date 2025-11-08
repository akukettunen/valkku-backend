import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { events, eventsId } from './events';
import type { planPlanParts, planPlanPartsId } from './planPlanParts';
import type { teams, teamsId } from './teams';
import type { users, usersId } from './users';

export interface plansAttributes {
  id: number;
  teamId?: string;
  copyOfPlanId?: number;
  createdAt?: Date;
  updatedAt?: Date;
  title?: string;
  description?: string;
  scope?: 'global' | 'club' | 'team' | 'user';
  showInLibrary: number;
  createdById?: string;
}

export type plansPk = "id";
export type plansId = plans[plansPk];
export type plansOptionalAttributes = "id" | "teamId" | "copyOfPlanId" | "createdAt" | "updatedAt" | "title" | "description" | "scope" | "showInLibrary" | "createdById";
export type plansCreationAttributes = Optional<plansAttributes, plansOptionalAttributes>;

export class plans extends Model<plansAttributes, plansCreationAttributes> implements plansAttributes {
  id!: number;
  teamId?: string;
  copyOfPlanId?: number;
  createdAt?: Date;
  updatedAt?: Date;
  title?: string;
  description?: string;
  scope?: 'global' | 'club' | 'team' | 'user';
  showInLibrary!: number;
  createdById?: string;

  // plans hasMany events via planId
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
  // plans hasMany planPlanParts via planId
  planPlanParts!: planPlanParts[];
  getPlanPlanParts!: Sequelize.HasManyGetAssociationsMixin<planPlanParts>;
  setPlanPlanParts!: Sequelize.HasManySetAssociationsMixin<planPlanParts, planPlanPartsId>;
  addPlanPlanPart!: Sequelize.HasManyAddAssociationMixin<planPlanParts, planPlanPartsId>;
  addPlanPlanParts!: Sequelize.HasManyAddAssociationsMixin<planPlanParts, planPlanPartsId>;
  createPlanPlanPart!: Sequelize.HasManyCreateAssociationMixin<planPlanParts>;
  removePlanPlanPart!: Sequelize.HasManyRemoveAssociationMixin<planPlanParts, planPlanPartsId>;
  removePlanPlanParts!: Sequelize.HasManyRemoveAssociationsMixin<planPlanParts, planPlanPartsId>;
  hasPlanPlanPart!: Sequelize.HasManyHasAssociationMixin<planPlanParts, planPlanPartsId>;
  hasPlanPlanParts!: Sequelize.HasManyHasAssociationsMixin<planPlanParts, planPlanPartsId>;
  countPlanPlanParts!: Sequelize.HasManyCountAssociationsMixin;
  // plans belongsTo plans via copyOfPlanId
  copyOfPlan!: plans;
  getCopyOfPlan!: Sequelize.BelongsToGetAssociationMixin<plans>;
  setCopyOfPlan!: Sequelize.BelongsToSetAssociationMixin<plans, plansId>;
  createCopyOfPlan!: Sequelize.BelongsToCreateAssociationMixin<plans>;
  // plans belongsTo teams via teamId
  team!: teams;
  getTeam!: Sequelize.BelongsToGetAssociationMixin<teams>;
  setTeam!: Sequelize.BelongsToSetAssociationMixin<teams, teamsId>;
  createTeam!: Sequelize.BelongsToCreateAssociationMixin<teams>;
  // plans belongsTo users via createdById
  createdBy!: users;
  getCreatedBy!: Sequelize.BelongsToGetAssociationMixin<users>;
  setCreatedBy!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createCreatedBy!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof plans {
    return plans.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    teamId: {
      type: DataTypes.STRING(21),
      allowNull: true,
      references: {
        model: 'teams',
        key: 'id'
      }
    },
    copyOfPlanId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'plans',
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
    title: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    description: {
      type: DataTypes.STRING(1000),
      allowNull: true
    },
    scope: {
      type: DataTypes.ENUM('global','club','team','user'),
      allowNull: true
    },
    showInLibrary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0
    },
    createdById: {
      type: DataTypes.STRING(21),
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'plans',
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
        name: "copyOfPlanId",
        using: "BTREE",
        fields: [
          { name: "copyOfPlanId" },
        ]
      },
      {
        name: "createdById",
        using: "BTREE",
        fields: [
          { name: "createdById" },
        ]
      },
    ]
  });
  }
}
