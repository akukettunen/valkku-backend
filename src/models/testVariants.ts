import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { testVariantFillables, testVariantFillablesId } from './testVariantFillables';
import type { tests, testsId } from './tests';
import type { users, usersId } from './users';

export interface testVariantsAttributes {
  id: number;
  testId: number;
  title: object;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export type testVariantsPk = "id";
export type testVariantsId = testVariants[testVariantsPk];
export type testVariantsOptionalAttributes = "id" | "createdAt" | "updatedAt";
export type testVariantsCreationAttributes = Optional<testVariantsAttributes, testVariantsOptionalAttributes>;

export class testVariants extends Model<testVariantsAttributes, testVariantsCreationAttributes> implements testVariantsAttributes {
  id!: number;
  testId!: number;
  title!: object;
  createdById!: string;
  createdAt!: Date;
  updatedAt!: Date;

  // testVariants hasMany testVariantFillables via testVariantId
  testVariantFillables!: testVariantFillables[];
  getTestVariantFillables!: Sequelize.HasManyGetAssociationsMixin<testVariantFillables>;
  setTestVariantFillables!: Sequelize.HasManySetAssociationsMixin<testVariantFillables, testVariantFillablesId>;
  addTestVariantFillable!: Sequelize.HasManyAddAssociationMixin<testVariantFillables, testVariantFillablesId>;
  addTestVariantFillables!: Sequelize.HasManyAddAssociationsMixin<testVariantFillables, testVariantFillablesId>;
  createTestVariantFillable!: Sequelize.HasManyCreateAssociationMixin<testVariantFillables>;
  removeTestVariantFillable!: Sequelize.HasManyRemoveAssociationMixin<testVariantFillables, testVariantFillablesId>;
  removeTestVariantFillables!: Sequelize.HasManyRemoveAssociationsMixin<testVariantFillables, testVariantFillablesId>;
  hasTestVariantFillable!: Sequelize.HasManyHasAssociationMixin<testVariantFillables, testVariantFillablesId>;
  hasTestVariantFillables!: Sequelize.HasManyHasAssociationsMixin<testVariantFillables, testVariantFillablesId>;
  countTestVariantFillables!: Sequelize.HasManyCountAssociationsMixin;
  // testVariants belongsTo tests via testId
  test!: tests;
  getTest!: Sequelize.BelongsToGetAssociationMixin<tests>;
  setTest!: Sequelize.BelongsToSetAssociationMixin<tests, testsId>;
  createTest!: Sequelize.BelongsToCreateAssociationMixin<tests>;
  // testVariants belongsTo users via createdById
  createdBy!: users;
  getCreatedBy!: Sequelize.BelongsToGetAssociationMixin<users>;
  setCreatedBy!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createCreatedBy!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof testVariants {
    return testVariants.init({
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
    title: {
      type: DataTypes.JSON,
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
    tableName: 'test_variants',
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
        name: "fk_test_variants_test",
        using: "BTREE",
        fields: [
          { name: "testId" },
        ]
      },
      {
        name: "fk_test_variants_created_by",
        using: "BTREE",
        fields: [
          { name: "createdById" },
        ]
      },
    ]
  });
  }
}
