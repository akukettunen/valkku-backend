import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { teams, teamsId } from './teams';
import type { testEvents, testEventsId } from './testEvents';
import type { testResultValues, testResultValuesId } from './testResultValues';
import type { tests, testsId } from './tests';
import type { users, usersId } from './users';

export interface testResultsAttributes {
  id: number;
  userId: string;
  testId: number;
  testEventId?: number | null;
  date: string;
  createdById: string;
  teamId?: string | null;
  tryOrder: number;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type testResultsPk = "id";
export type testResultsId = testResults[testResultsPk];
export type testResultsOptionalAttributes = "id" | "testEventId" | "teamId" | "tryOrder" | "deletedAt" | "createdAt" | "updatedAt";
export type testResultsCreationAttributes = Optional<testResultsAttributes, testResultsOptionalAttributes>;

export class testResults extends Model<testResultsAttributes, testResultsCreationAttributes> implements testResultsAttributes {
  id!: number;
  userId!: string;
  testId!: number;
  testEventId?: number | null;
  date!: string;
  createdById!: string;
  teamId?: string | null;
  tryOrder!: number;
  deletedAt?: Date | null;
  createdAt!: Date;
  updatedAt!: Date;

  // testResults belongsTo teams via teamId
  team!: teams;
  getTeam!: Sequelize.BelongsToGetAssociationMixin<teams>;
  setTeam!: Sequelize.BelongsToSetAssociationMixin<teams, teamsId>;
  createTeam!: Sequelize.BelongsToCreateAssociationMixin<teams>;
  // testResults belongsTo testEvents via testEventId
  testEvent!: testEvents;
  getTestEvent!: Sequelize.BelongsToGetAssociationMixin<testEvents>;
  setTestEvent!: Sequelize.BelongsToSetAssociationMixin<testEvents, testEventsId>;
  createTestEvent!: Sequelize.BelongsToCreateAssociationMixin<testEvents>;
  // testResults hasMany testResultValues via testResultId
  testResultValues!: testResultValues[];
  getTestResultValues!: Sequelize.HasManyGetAssociationsMixin<testResultValues>;
  setTestResultValues!: Sequelize.HasManySetAssociationsMixin<testResultValues, testResultValuesId>;
  addTestResultValue!: Sequelize.HasManyAddAssociationMixin<testResultValues, testResultValuesId>;
  addTestResultValues!: Sequelize.HasManyAddAssociationsMixin<testResultValues, testResultValuesId>;
  createTestResultValue!: Sequelize.HasManyCreateAssociationMixin<testResultValues>;
  removeTestResultValue!: Sequelize.HasManyRemoveAssociationMixin<testResultValues, testResultValuesId>;
  removeTestResultValues!: Sequelize.HasManyRemoveAssociationsMixin<testResultValues, testResultValuesId>;
  hasTestResultValue!: Sequelize.HasManyHasAssociationMixin<testResultValues, testResultValuesId>;
  hasTestResultValues!: Sequelize.HasManyHasAssociationsMixin<testResultValues, testResultValuesId>;
  countTestResultValues!: Sequelize.HasManyCountAssociationsMixin;
  // testResults belongsTo tests via testId
  test!: tests;
  getTest!: Sequelize.BelongsToGetAssociationMixin<tests>;
  setTest!: Sequelize.BelongsToSetAssociationMixin<tests, testsId>;
  createTest!: Sequelize.BelongsToCreateAssociationMixin<tests>;
  // testResults belongsTo users via createdById
  createdBy!: users;
  getCreatedBy!: Sequelize.BelongsToGetAssociationMixin<users>;
  setCreatedBy!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createCreatedBy!: Sequelize.BelongsToCreateAssociationMixin<users>;
  // testResults belongsTo users via userId
  user!: users;
  getUser!: Sequelize.BelongsToGetAssociationMixin<users>;
  setUser!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createUser!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof testResults {
    return testResults.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    userId: {
      type: DataTypes.STRING(21),
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    testId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'tests',
        key: 'id'
      }
    },
    testEventId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'test_events',
        key: 'id'
      }
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    createdById: {
      type: DataTypes.STRING(21),
      allowNull: false,
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
    tryOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
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
    tableName: 'test_results',
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
        name: "fk_test_results_user",
        using: "BTREE",
        fields: [
          { name: "userId" },
        ]
      },
      {
        name: "fk_test_results_test",
        using: "BTREE",
        fields: [
          { name: "testId" },
        ]
      },
      {
        name: "fk_test_results_test_event",
        using: "BTREE",
        fields: [
          { name: "testEventId" },
        ]
      },
      {
        name: "fk_test_results_created_by",
        using: "BTREE",
        fields: [
          { name: "createdById" },
        ]
      },
      {
        name: "fk_test_results_team",
        using: "BTREE",
        fields: [
          { name: "teamId" },
        ]
      },
    ]
  });
  }
}


