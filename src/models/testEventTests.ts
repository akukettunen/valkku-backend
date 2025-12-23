import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { testEvents, testEventsId } from './testEvents';
import type { tests, testsId } from './tests';

export interface testEventTestsAttributes {
  id: number;
  testEventId: number;
  testId: number;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type testEventTestsPk = "id";
export type testEventTestsId = testEventTests[testEventTestsPk];
export type testEventTestsOptionalAttributes = "id" | "deletedAt" | "createdAt" | "updatedAt";
export type testEventTestsCreationAttributes = Optional<testEventTestsAttributes, testEventTestsOptionalAttributes>;

export class testEventTests extends Model<testEventTestsAttributes, testEventTestsCreationAttributes> implements testEventTestsAttributes {
  id!: number;
  testEventId!: number;
  testId!: number;
  deletedAt?: Date | null;
  createdAt!: Date;
  updatedAt!: Date;

  // testEventTests belongsTo testEvents via testEventId
  testEvent!: testEvents;
  getTestEvent!: Sequelize.BelongsToGetAssociationMixin<testEvents>;
  setTestEvent!: Sequelize.BelongsToSetAssociationMixin<testEvents, testEventsId>;
  createTestEvent!: Sequelize.BelongsToCreateAssociationMixin<testEvents>;
  // testEventTests belongsTo tests via testId
  test!: tests;
  getTest!: Sequelize.BelongsToGetAssociationMixin<tests>;
  setTest!: Sequelize.BelongsToSetAssociationMixin<tests, testsId>;
  createTest!: Sequelize.BelongsToCreateAssociationMixin<tests>;

  static initModel(sequelize: Sequelize.Sequelize): typeof testEventTests {
    return testEventTests.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    testEventId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'test_events',
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
    tableName: 'test_event_tests',
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
        name: "fk_test_event_tests_event",
        using: "BTREE",
        fields: [
          { name: "testEventId" },
        ]
      },
      {
        name: "fk_test_event_tests_test",
        using: "BTREE",
        fields: [
          { name: "testId" },
        ]
      },
    ]
  });
  }
}


