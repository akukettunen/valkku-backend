import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { testVariantFillables, testVariantFillablesId } from './testVariantFillables';

export interface unitsAttributes {
  id: number;
  name: object;
  symbol: string;
  code: string;
  unitGroup: 'amount' | 'distance' | 'time' | 'mass' | 'temperature' | 'area' | 'volume' | 'speed' | 'angle';
  baseUnitId?: number;
  factorToBase: number;
  offsetToBase?: number;
  isDefault: number;
  createdAt: Date;
  updatedAt: Date;
}

export type unitsPk = "id";
export type unitsId = units[unitsPk];
export type unitsOptionalAttributes = "id" | "baseUnitId" | "factorToBase" | "offsetToBase" | "isDefault" | "createdAt" | "updatedAt";
export type unitsCreationAttributes = Optional<unitsAttributes, unitsOptionalAttributes>;

export class units extends Model<unitsAttributes, unitsCreationAttributes> implements unitsAttributes {
  id!: number;
  name!: object;
  symbol!: string;
  code!: string;
  unitGroup!: 'amount' | 'distance' | 'time' | 'mass' | 'temperature' | 'area' | 'volume' | 'speed' | 'angle';
  baseUnitId?: number;
  factorToBase!: number;
  offsetToBase?: number;
  isDefault!: number;
  createdAt!: Date;
  updatedAt!: Date;

  // units hasMany testVariantFillables via unitId
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
  // units belongsTo units via baseUnitId
  baseUnit!: units;
  getBaseUnit!: Sequelize.BelongsToGetAssociationMixin<units>;
  setBaseUnit!: Sequelize.BelongsToSetAssociationMixin<units, unitsId>;
  createBaseUnit!: Sequelize.BelongsToCreateAssociationMixin<units>;

  static initModel(sequelize: Sequelize.Sequelize): typeof units {
    return units.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.JSON,
      allowNull: false
    },
    symbol: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    code: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: "code"
    },
    unitGroup: {
      type: DataTypes.ENUM('amount','distance','time','mass','temperature','area','volume','speed','angle'),
      allowNull: false,
      field: 'unit_group'
    },
    baseUnitId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: 'units',
        key: 'id'
      },
      field: 'base_unit_id'
    },
    factorToBase: {
      type: DataTypes.DECIMAL(30,15),
      allowNull: false,
      defaultValue: 1.000000000000000,
      field: 'factor_to_base'
    },
    offsetToBase: {
      type: DataTypes.DECIMAL(30,15),
      allowNull: true,
      defaultValue: 0.000000000000000,
      field: 'offset_to_base'
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0,
      field: 'is_default'
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
    tableName: 'units',
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
        name: "code",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "code" },
        ]
      },
      {
        name: "fk_units_base_unit",
        using: "BTREE",
        fields: [
          { name: "base_unit_id" },
        ]
      },
    ]
  });
  }
}
