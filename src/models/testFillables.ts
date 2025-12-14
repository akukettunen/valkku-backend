import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { testResultValues, testResultValuesId } from './testResultValues';
import type { tests, testsId } from './tests';
import type { units, unitsId } from './units';

export interface testFillablesAttributes {
  id: number;
  testId: number;
  unitId: number;
  title: object;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type testFillablesPk = "id";
export type testFillablesId = testFillables[testFillablesPk];
export type testFillablesOptionalAttributes = "id" | "deletedAt" | "createdAt" | "updatedAt";
export type testFillablesCreationAttributes = Optional<testFillablesAttributes, testFillablesOptionalAttributes>;

export class testFillables extends Model<testFillablesAttributes, testFillablesCreationAttributes> implements testFillablesAttributes {
  id!: number;
  testId!: number;
  unitId!: number;
  title!: object;
  deletedAt?: Date | null;
  createdAt!: Date;
  updatedAt!: Date;

  // testFillables hasMany testResultValues via testFillableId
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
  // testFillables belongsTo tests via testId
  test!: tests;
  getTest!: Sequelize.BelongsToGetAssociationMixin<tests>;
  setTest!: Sequelize.BelongsToSetAssociationMixin<tests, testsId>;
  createTest!: Sequelize.BelongsToCreateAssociationMixin<tests>;
  // testFillables belongsTo units via unitId
  unit!: units;
  getUnit!: Sequelize.BelongsToGetAssociationMixin<units>;
  setUnit!: Sequelize.BelongsToSetAssociationMixin<units, unitsId>;
  createUnit!: Sequelize.BelongsToCreateAssociationMixin<units>;

  static initModel(sequelize: Sequelize.Sequelize): typeof testFillables {
    return testFillables.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    testId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'tests',
        key: 'id'
      }
    },
    unitId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'units',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.JSON,
      allowNull: false
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
    tableName: 'test_fillables',
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
        name: "fk_test_fillables_test",
        using: "BTREE",
        fields: [
          { name: "testId" },
        ]
      },
      {
        name: "fk_test_fillables_unit",
        using: "BTREE",
        fields: [
          { name: "unitId" },
        ]
      },
    ]
  });
  }
}
