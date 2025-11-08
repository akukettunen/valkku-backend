import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { planParts, planPartsId } from './planParts';
import type { teams, teamsId } from './teams';
import type { users, usersId } from './users';

export interface planPartTypesAttributes {
  id: number;
  titleObject: object;
  scope: 'global' | 'club' | 'team' | 'user';
  userId?: string;
  teamId?: string;
  color: string;
  createdById?: string;
  archived: number;
  createdAt: Date;
  updatedAt: Date;
  position?: number;
}

export type planPartTypesPk = "id";
export type planPartTypesId = planPartTypes[planPartTypesPk];
export type planPartTypesOptionalAttributes = "id" | "userId" | "teamId" | "createdById" | "archived" | "createdAt" | "updatedAt" | "position";
export type planPartTypesCreationAttributes = Optional<planPartTypesAttributes, planPartTypesOptionalAttributes>;

export class planPartTypes extends Model<planPartTypesAttributes, planPartTypesCreationAttributes> implements planPartTypesAttributes {
  id!: number;
  titleObject!: object;
  scope!: 'global' | 'club' | 'team' | 'user';
  userId?: string;
  teamId?: string;
  color!: string;
  createdById?: string;
  archived!: number;
  createdAt!: Date;
  updatedAt!: Date;
  position?: number;

  // planPartTypes hasMany planParts via typeId
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
  // planPartTypes belongsTo teams via teamId
  team!: teams;
  getTeam!: Sequelize.BelongsToGetAssociationMixin<teams>;
  setTeam!: Sequelize.BelongsToSetAssociationMixin<teams, teamsId>;
  createTeam!: Sequelize.BelongsToCreateAssociationMixin<teams>;
  // planPartTypes belongsTo users via createdById
  createdBy!: users;
  getCreatedBy!: Sequelize.BelongsToGetAssociationMixin<users>;
  setCreatedBy!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createCreatedBy!: Sequelize.BelongsToCreateAssociationMixin<users>;
  // planPartTypes belongsTo users via userId
  user!: users;
  getUser!: Sequelize.BelongsToGetAssociationMixin<users>;
  setUser!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createUser!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof planPartTypes {
    return planPartTypes.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    titleObject: {
      type: DataTypes.JSON,
      allowNull: false
    },
    scope: {
      type: DataTypes.ENUM('global','club','team','user'),
      allowNull: false
    },
    userId: {
      type: DataTypes.STRING(21),
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    teamId: {
      type: DataTypes.STRING(21),
      allowNull: true,
      references: {
        model: 'teams',
        key: 'id'
      }
    },
    color: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    createdById: {
      type: DataTypes.STRING(21),
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    archived: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0
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
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'plan_part_types',
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
        name: "fk_team",
        using: "BTREE",
        fields: [
          { name: "teamId" },
        ]
      },
      {
        name: "fk_user",
        using: "BTREE",
        fields: [
          { name: "userId" },
        ]
      },
      {
        name: "fk_created_by",
        using: "BTREE",
        fields: [
          { name: "createdById" },
        ]
      },
    ]
  });
  }
}
