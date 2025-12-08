import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { testVariants, testVariantsId } from './testVariants';
import type { units, unitsId } from './units';

export interface testVariantFillablesAttributes {
  id: number;
  testVariantId: number;
  unitId: number;
  title: object;
  createdAt: Date;
  updatedAt: Date;
}

export type testVariantFillablesPk = "id";
export type testVariantFillablesId = testVariantFillables[testVariantFillablesPk];
export type testVariantFillablesOptionalAttributes = "id" | "createdAt" | "updatedAt";
export type testVariantFillablesCreationAttributes = Optional<testVariantFillablesAttributes, testVariantFillablesOptionalAttributes>;

export class testVariantFillables extends Model<testVariantFillablesAttributes, testVariantFillablesCreationAttributes> implements testVariantFillablesAttributes {
  id!: number;
  testVariantId!: number;
  unitId!: number;
  title!: object;
  createdAt!: Date;
  updatedAt!: Date;

  // testVariantFillables belongsTo testVariants via testVariantId
  testVariant!: testVariants;
  getTestVariant!: Sequelize.BelongsToGetAssociationMixin<testVariants>;
  setTestVariant!: Sequelize.BelongsToSetAssociationMixin<testVariants, testVariantsId>;
  createTestVariant!: Sequelize.BelongsToCreateAssociationMixin<testVariants>;
  // testVariantFillables belongsTo units via unitId
  unit!: units;
  getUnit!: Sequelize.BelongsToGetAssociationMixin<units>;
  setUnit!: Sequelize.BelongsToSetAssociationMixin<units, unitsId>;
  createUnit!: Sequelize.BelongsToCreateAssociationMixin<units>;

  static initModel(sequelize: Sequelize.Sequelize): typeof testVariantFillables {
    return testVariantFillables.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    testVariantId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'test_variants',
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
    tableName: 'test_variant_fillables',
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
        name: "fk_test_variant_fillables_test_variant",
        using: "BTREE",
        fields: [
          { name: "testVariantId" },
        ]
      },
      {
        name: "fk_test_variant_fillables_unit",
        using: "BTREE",
        fields: [
          { name: "unitId" },
        ]
      },
    ]
  });
  }
}
