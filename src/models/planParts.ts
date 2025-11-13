import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { folders, foldersId } from './folders';
import type { planPartItems, planPartItemsId } from './planPartItems';
import type { planPartTypes, planPartTypesId } from './planPartTypes';
import type { planPlanParts, planPlanPartsId } from './planPlanParts';
import type { teams, teamsId } from './teams';
import type { users, usersId } from './users';

export interface planPartsAttributes {
  id: string;
  teamId?: string;
  title?: string;
  description?: string;
  durationInMinutes: number;
  typeId: number;
  createdById?: string;
  position?: number;
  createdAt?: Date;
  scope: 'global' | 'club' | 'team' | 'user';
  updatedAt?: Date;
  showInLibrary: number;
  folderId?: number;
}

export type planPartsPk = "id";
export type planPartsId = planParts[planPartsPk];
export type planPartsOptionalAttributes = "teamId" | "title" | "description" | "createdById" | "position" | "createdAt" | "scope" | "updatedAt" | "showInLibrary" | "folderId";
export type planPartsCreationAttributes = Optional<planPartsAttributes, planPartsOptionalAttributes>;

export class planParts extends Model<planPartsAttributes, planPartsCreationAttributes> implements planPartsAttributes {
  id!: string;
  teamId?: string;
  title?: string;
  description?: string;
  durationInMinutes!: number;
  typeId!: number;
  createdById?: string;
  position?: number;
  createdAt?: Date;
  scope!: 'global' | 'club' | 'team' | 'user';
  updatedAt?: Date;
  showInLibrary!: number;
  folderId?: number;

  // planParts belongsTo folders via folderId
  folder!: folders;
  getFolder!: Sequelize.BelongsToGetAssociationMixin<folders>;
  setFolder!: Sequelize.BelongsToSetAssociationMixin<folders, foldersId>;
  createFolder!: Sequelize.BelongsToCreateAssociationMixin<folders>;
  // planParts belongsTo planPartTypes via typeId
  type!: planPartTypes;
  getType!: Sequelize.BelongsToGetAssociationMixin<planPartTypes>;
  setType!: Sequelize.BelongsToSetAssociationMixin<planPartTypes, planPartTypesId>;
  createType!: Sequelize.BelongsToCreateAssociationMixin<planPartTypes>;
  // planParts hasMany planPartItems via partId
  planPartItems!: planPartItems[];
  getPlanPartItems!: Sequelize.HasManyGetAssociationsMixin<planPartItems>;
  setPlanPartItems!: Sequelize.HasManySetAssociationsMixin<planPartItems, planPartItemsId>;
  addPlanPartItem!: Sequelize.HasManyAddAssociationMixin<planPartItems, planPartItemsId>;
  addPlanPartItems!: Sequelize.HasManyAddAssociationsMixin<planPartItems, planPartItemsId>;
  createPlanPartItem!: Sequelize.HasManyCreateAssociationMixin<planPartItems>;
  removePlanPartItem!: Sequelize.HasManyRemoveAssociationMixin<planPartItems, planPartItemsId>;
  removePlanPartItems!: Sequelize.HasManyRemoveAssociationsMixin<planPartItems, planPartItemsId>;
  hasPlanPartItem!: Sequelize.HasManyHasAssociationMixin<planPartItems, planPartItemsId>;
  hasPlanPartItems!: Sequelize.HasManyHasAssociationsMixin<planPartItems, planPartItemsId>;
  countPlanPartItems!: Sequelize.HasManyCountAssociationsMixin;
  // planParts hasMany planPlanParts via planPartId
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
  // planParts belongsTo teams via teamId
  team!: teams;
  getTeam!: Sequelize.BelongsToGetAssociationMixin<teams>;
  setTeam!: Sequelize.BelongsToSetAssociationMixin<teams, teamsId>;
  createTeam!: Sequelize.BelongsToCreateAssociationMixin<teams>;
  // planParts belongsTo users via createdById
  createdBy!: users;
  getCreatedBy!: Sequelize.BelongsToGetAssociationMixin<users>;
  setCreatedBy!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createCreatedBy!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof planParts {
    return planParts.init({
    id: {
      type: DataTypes.STRING(21),
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
    title: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    durationInMinutes: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    typeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'plan_part_types',
        key: 'id'
      }
    },
    createdById: {
      type: DataTypes.STRING(21),
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    scope: {
      type: DataTypes.ENUM('global','club','team','user'),
      allowNull: false,
      defaultValue: "team"
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    showInLibrary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0
    },
    folderId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'folders',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'plan_parts',
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
        name: "typeId",
        using: "BTREE",
        fields: [
          { name: "typeId" },
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
        name: "teamId",
        using: "BTREE",
        fields: [
          { name: "teamId" },
        ]
      },
      {
        name: "fk_plan_part_folder",
        using: "BTREE",
        fields: [
          { name: "folderId" },
        ]
      },
    ]
  });
  }
}
