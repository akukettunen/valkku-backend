import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { planPartTypes, planPartTypesId } from './planPartTypes';
import type { planParts, planPartsId } from './planParts';

export interface foldersAttributes {
  id: number;
  name: string;
  folderType: 'plan_part' | 'plan' | 'file' | 'folder';
  position: number;
  teamId?: string;
  userId?: string;
  parentId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export type foldersPk = "id";
export type foldersId = folders[foldersPk];
export type foldersOptionalAttributes = "id" | "folderType" | "teamId" | "userId" | "parentId" | "createdAt" | "updatedAt";
export type foldersCreationAttributes = Optional<foldersAttributes, foldersOptionalAttributes>;

export class folders extends Model<foldersAttributes, foldersCreationAttributes> implements foldersAttributes {
  id!: number;
  name!: string;
  folderType!: 'plan_part' | 'plan' | 'file' | 'folder';
  position!: number;
  teamId?: string;
  userId?: string;
  parentId?: number;
  createdAt!: Date;
  updatedAt!: Date;

  // folders belongsTo folders via parentId
  parent!: folders;
  getParent!: Sequelize.BelongsToGetAssociationMixin<folders>;
  setParent!: Sequelize.BelongsToSetAssociationMixin<folders, foldersId>;
  createParent!: Sequelize.BelongsToCreateAssociationMixin<folders>;
  // folders hasMany planPartTypes via folderId
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
  // folders hasMany planParts via folderId
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

  static initModel(sequelize: Sequelize.Sequelize): typeof folders {
    return folders.init({
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    folderType: {
      type: DataTypes.ENUM('plan_part','plan','file','folder'),
      allowNull: false,
      defaultValue: "folder"
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    teamId: {
      type: DataTypes.STRING(21),
      allowNull: true
    },
    userId: {
      type: DataTypes.STRING(21),
      allowNull: true
    },
    parentId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'folders',
        key: 'id'
      }
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'folders',
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
        name: "fk_folder_parent",
        using: "BTREE",
        fields: [
          { name: "parentId" },
        ]
      },
    ]
  });
  }
}
