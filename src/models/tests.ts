import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { teams, teamsId } from './teams';
import type { testVariants, testVariantsId } from './testVariants';
import type { users, usersId } from './users';

export interface testsAttributes {
  id: number;
  title: object;
  notes: object;
  teamId?: string;
  createdById: string;
  scope: 'global' | 'club' | 'team';
  testGroupId: number;
  createdAt: Date;
  updatedAt: Date;
}

export type testsPk = "id";
export type testsId = tests[testsPk];
export type testsOptionalAttributes = "id" | "teamId" | "scope" | "createdAt" | "updatedAt";
export type testsCreationAttributes = Optional<testsAttributes, testsOptionalAttributes>;

export class tests extends Model<testsAttributes, testsCreationAttributes> implements testsAttributes {
  id!: number;
  title!: object;
  notes!: object;
  teamId?: string;
  createdById!: string;
  scope!: 'global' | 'club' | 'team';
  testGroupId!: number;
  createdAt!: Date;
  updatedAt!: Date;

  // tests belongsTo testGroups via testGroupId
  testGroup!: import('./testGroups').testGroups;
  getTestGroup!: Sequelize.BelongsToGetAssociationMixin<import('./testGroups').testGroups>;
  setTestGroup!: Sequelize.BelongsToSetAssociationMixin<import('./testGroups').testGroups, import('./testGroups').testGroupsId>;
  createTestGroup!: Sequelize.BelongsToCreateAssociationMixin<import('./testGroups').testGroups>;

  // tests belongsTo teams via teamId
  team!: teams;
  getTeam!: Sequelize.BelongsToGetAssociationMixin<teams>;
  setTeam!: Sequelize.BelongsToSetAssociationMixin<teams, teamsId>;
  createTeam!: Sequelize.BelongsToCreateAssociationMixin<teams>;
  // tests hasMany testVariants via testId
  testVariants!: testVariants[];
  getTestVariants!: Sequelize.HasManyGetAssociationsMixin<testVariants>;
  setTestVariants!: Sequelize.HasManySetAssociationsMixin<testVariants, testVariantsId>;
  addTestVariant!: Sequelize.HasManyAddAssociationMixin<testVariants, testVariantsId>;
  addTestVariants!: Sequelize.HasManyAddAssociationsMixin<testVariants, testVariantsId>;
  createTestVariant!: Sequelize.HasManyCreateAssociationMixin<testVariants>;
  removeTestVariant!: Sequelize.HasManyRemoveAssociationMixin<testVariants, testVariantsId>;
  removeTestVariants!: Sequelize.HasManyRemoveAssociationsMixin<testVariants, testVariantsId>;
  hasTestVariant!: Sequelize.HasManyHasAssociationMixin<testVariants, testVariantsId>;
  hasTestVariants!: Sequelize.HasManyHasAssociationsMixin<testVariants, testVariantsId>;
  countTestVariants!: Sequelize.HasManyCountAssociationsMixin;
  // tests belongsTo users via createdById
  createdBy!: users;
  getCreatedBy!: Sequelize.BelongsToGetAssociationMixin<users>;
  setCreatedBy!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createCreatedBy!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof tests {
    return tests.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    title: {
      type: DataTypes.JSON,
      allowNull: false
    },
    notes: {
      type: DataTypes.JSON,
      allowNull: false
    },
    teamId: {
      type: DataTypes.STRING(21),
      allowNull: true,
      references: {
        model: 'teams',
        key: 'id'
      }
    },
    createdById: {
      type: DataTypes.STRING(21),
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    scope: {
      type: DataTypes.ENUM('global','club','team'),
      allowNull: false,
      defaultValue: "global"
    },
    testGroupId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
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
    tableName: 'tests',
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
        name: "fk_tests_team",
        using: "BTREE",
        fields: [
          { name: "teamId" },
        ]
      },
      {
        name: "fk_tests_created_by",
        using: "BTREE",
        fields: [
          { name: "createdById" },
        ]
      },
    ]
  });
  }
}
