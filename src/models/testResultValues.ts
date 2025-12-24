import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { testFillables, testFillablesId } from './testFillables';
import type { testResults, testResultsId } from './testResults';

export interface testResultValuesAttributes {
  id: number;
  testResultId: number;
  testFillableId: number;
  value: number;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type testResultValuesPk = "id";
export type testResultValuesId = testResultValues[testResultValuesPk];
export type testResultValuesOptionalAttributes = "id" | "deletedAt" | "createdAt" | "updatedAt";
export type testResultValuesCreationAttributes = Optional<testResultValuesAttributes, testResultValuesOptionalAttributes>;

export class testResultValues extends Model<testResultValuesAttributes, testResultValuesCreationAttributes> implements testResultValuesAttributes {
  id!: number;
  testResultId!: number;
  testFillableId!: number;
  value!: number;
  deletedAt?: Date | null;
  createdAt!: Date;
  updatedAt!: Date;

  // testResultValues belongsTo testFillables via testFillableId
  testFillable!: testFillables;
  getTestFillable!: Sequelize.BelongsToGetAssociationMixin<testFillables>;
  setTestFillable!: Sequelize.BelongsToSetAssociationMixin<testFillables, testFillablesId>;
  createTestFillable!: Sequelize.BelongsToCreateAssociationMixin<testFillables>;
  // testResultValues belongsTo testResults via testResultId
  testResult!: testResults;
  getTestResult!: Sequelize.BelongsToGetAssociationMixin<testResults>;
  setTestResult!: Sequelize.BelongsToSetAssociationMixin<testResults, testResultsId>;
  createTestResult!: Sequelize.BelongsToCreateAssociationMixin<testResults>;

  static initModel(sequelize: Sequelize.Sequelize): typeof testResultValues {
    return testResultValues.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    testResultId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'test_results',
        key: 'id'
      }
    },
    testFillableId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'test_fillables',
        key: 'id'
      }
    },
    value: {
      type: DataTypes.DECIMAL(10,4),
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
    tableName: 'test_result_values',
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
        name: "fk_test_result_values_result",
        using: "BTREE",
        fields: [
          { name: "testResultId" },
        ]
      },
      {
        name: "fk_test_result_values_fillable",
        using: "BTREE",
        fields: [
          { name: "testFillableId" },
        ]
      },
    ]
  });
  }
}



