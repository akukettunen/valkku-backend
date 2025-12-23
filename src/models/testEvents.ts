import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { teams, teamsId } from './teams';
import type { testEventTests, testEventTestsId } from './testEventTests';
import type { testResults, testResultsId } from './testResults';
import type { users, usersId } from './users';

export interface testEventsAttributes {
  id: number;
  teamId: string;
  date: string;
  name?: object | null;
  createdById: string;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type testEventsPk = "id";
export type testEventsId = testEvents[testEventsPk];
export type testEventsOptionalAttributes = "id" | "name" | "deletedAt" | "createdAt" | "updatedAt";
export type testEventsCreationAttributes = Optional<testEventsAttributes, testEventsOptionalAttributes>;

export class testEvents extends Model<testEventsAttributes, testEventsCreationAttributes> implements testEventsAttributes {
  id!: number;
  teamId!: string;
  date!: string;
  name?: object | null;
  createdById!: string;
  deletedAt?: Date | null;
  createdAt!: Date;
  updatedAt!: Date;

  // testEvents belongsTo teams via teamId
  team!: teams;
  getTeam!: Sequelize.BelongsToGetAssociationMixin<teams>;
  setTeam!: Sequelize.BelongsToSetAssociationMixin<teams, teamsId>;
  createTeam!: Sequelize.BelongsToCreateAssociationMixin<teams>;
  // testEvents hasMany testEventTests via testEventId
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
  // testEvents hasMany testResults via testEventId
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
  // testEvents belongsTo users via createdById
  createdBy!: users;
  getCreatedBy!: Sequelize.BelongsToGetAssociationMixin<users>;
  setCreatedBy!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createCreatedBy!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof testEvents {
    return testEvents.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    teamId: {
      type: DataTypes.STRING(21),
      allowNull: false,
      references: {
        model: 'teams',
        key: 'id'
      }
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    name: {
      type: DataTypes.JSON,
      allowNull: true
    },
    createdById: {
      type: DataTypes.STRING(21),
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
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
    tableName: 'test_events',
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
        name: "fk_test_events_team",
        using: "BTREE",
        fields: [
          { name: "teamId" },
        ]
      },
      {
        name: "fk_test_events_created_by",
        using: "BTREE",
        fields: [
          { name: "createdById" },
        ]
      },
    ]
  });
  }
}


