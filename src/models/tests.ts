import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { teams, teamsId } from './teams';
import type { testEventTests, testEventTestsId } from './testEventTests';
import type { testFillables, testFillablesId } from './testFillables';
import type { testGroups, testGroupsId } from './testGroups';
import type { testResults, testResultsId } from './testResults';
import type { users, usersId } from './users';

export interface testsAttributes {
  id: number;
  title: object;
  notes: object;
  teamId?: string | null;
  createdById: string;
  scope: 'global' | 'club' | 'team';
  testGroupId: number;
  decimals: number;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type testsPk = "id";
export type testsId = tests[testsPk];
export type testsOptionalAttributes = "id" | "teamId" | "scope" | "decimals" | "deletedAt" | "createdAt" | "updatedAt";
export type testsCreationAttributes = Optional<testsAttributes, testsOptionalAttributes>;

export class tests extends Model<testsAttributes, testsCreationAttributes> implements testsAttributes {
  id!: number;
  title!: object;
  notes!: object;
  teamId?: string | null;
  createdById!: string;
  scope!: 'global' | 'club' | 'team';
  testGroupId!: number;
  decimals!: number;
  deletedAt?: Date | null;
  createdAt!: Date;
  updatedAt!: Date;

  // tests belongsTo teams via teamId
  team!: teams;
  getTeam!: Sequelize.BelongsToGetAssociationMixin<teams>;
  setTeam!: Sequelize.BelongsToSetAssociationMixin<teams, teamsId>;
  createTeam!: Sequelize.BelongsToCreateAssociationMixin<teams>;
  // tests belongsTo testGroups via testGroupId
  testGroup!: testGroups;
  getTestGroup!: Sequelize.BelongsToGetAssociationMixin<testGroups>;
  setTestGroup!: Sequelize.BelongsToSetAssociationMixin<testGroups, testGroupsId>;
  createTestGroup!: Sequelize.BelongsToCreateAssociationMixin<testGroups>;
  // tests hasMany testEventTests via testId
  testEventTests!: testEventTests[];
  getTestEventTests!: Sequelize.HasManyGetAssociationsMixin<testEventTests>;
  setTestEventTests!: Sequelize.HasManySetAssociationsMixin<testEventTests, testEventTestsId>;
  addTestEventTest!: Sequelize.HasManyAddAssociationMixin<testEventTests, testEventTestsId>;
  addTestEventTests!: Sequelize.HasManyAddAssociationsMixin<testEventTests, testEventTestsId>;
  createTestEventTest!: Sequelize.HasManyCreateAssociationMixin<testEventTests>;
  removeTestEventTest!: Sequelize.HasManyRemoveAssociationMixin<testEventTests, testEventTestsId>;
  removeTestEventTests!: Sequelize.HasManyRemoveAssociationsMixin<testEventTests, testEventTestsId>;
  hasTestEventTest!: Sequelize.HasManyHasAssociationMixin<testEventTests, testEventTestsId>;
  hasTestEventTests!: Sequelize.HasManyHasAssociationsMixin<testEventTests, testEventTestsId>;
  countTestEventTests!: Sequelize.HasManyCountAssociationsMixin;
  // tests hasMany testFillables via testId
  testFillables!: testFillables[];
  getTestFillables!: Sequelize.HasManyGetAssociationsMixin<testFillables>;
  setTestFillables!: Sequelize.HasManySetAssociationsMixin<testFillables, testFillablesId>;
  addTestFillable!: Sequelize.HasManyAddAssociationMixin<testFillables, testFillablesId>;
  addTestFillables!: Sequelize.HasManyAddAssociationsMixin<testFillables, testFillablesId>;
  createTestFillable!: Sequelize.HasManyCreateAssociationMixin<testFillables>;
  removeTestFillable!: Sequelize.HasManyRemoveAssociationMixin<testFillables, testFillablesId>;
  removeTestFillables!: Sequelize.HasManyRemoveAssociationsMixin<testFillables, testFillablesId>;
  hasTestFillable!: Sequelize.HasManyHasAssociationMixin<testFillables, testFillablesId>;
  hasTestFillables!: Sequelize.HasManyHasAssociationsMixin<testFillables, testFillablesId>;
  countTestFillables!: Sequelize.HasManyCountAssociationsMixin;
  // tests hasMany testResults via testId
  testResults!: testResults[];
  getTestResults!: Sequelize.HasManyGetAssociationsMixin<testResults>;
  setTestResults!: Sequelize.HasManySetAssociationsMixin<testResults, testResultsId>;
  addTestResult!: Sequelize.HasManyAddAssociationMixin<testResults, testResultsId>;
  addTestResults!: Sequelize.HasManyAddAssociationsMixin<testResults, testResultsId>;
  createTestResult!: Sequelize.HasManyCreateAssociationMixin<testResults>;
  removeTestResult!: Sequelize.HasManyRemoveAssociationMixin<testResults, testResultsId>;
  removeTestResults!: Sequelize.HasManyRemoveAssociationsMixin<testResults, testResultsId>;
  hasTestResult!: Sequelize.HasManyHasAssociationMixin<testResults, testResultsId>;
  hasTestResults!: Sequelize.HasManyHasAssociationsMixin<testResults, testResultsId>;
  countTestResults!: Sequelize.HasManyCountAssociationsMixin;
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
      allowNull: false,
      references: {
        model: 'test_groups',
        key: 'id'
      }
    },
    decimals: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at'
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
      {
        name: "fk_tests_group",
        using: "BTREE",
        fields: [
          { name: "testGroupId" },
        ]
      },
    ]
  });
  }
}
