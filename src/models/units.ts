import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { testFillables, testFillablesId } from './testFillables';
import type { unitGroups, unitGroupsId } from './unitGroups';

export interface unitsAttributes {
  id: number;
  name: object;
  symbol: string;
  code: string;
  unitGroupId: number;
  baseUnitId?: number;
  factorToBase: number;
  offsetToBase?: number;
  displayMode: string;
  isDefault: number;
  createdAt: Date;
  updatedAt: Date;
}

export type unitsPk = "id";
export type unitsId = units[unitsPk];
export type unitsOptionalAttributes = "id" | "baseUnitId" | "factorToBase" | "offsetToBase" | "displayMode" | "isDefault" | "createdAt" | "updatedAt";
export type unitsCreationAttributes = Optional<unitsAttributes, unitsOptionalAttributes>;

export class units extends Model<unitsAttributes, unitsCreationAttributes> implements unitsAttributes {
  id!: number;
  name!: object;
  symbol!: string;
  code!: string;
  unitGroupId!: number;
  baseUnitId?: number;
  factorToBase!: number;
  offsetToBase?: number;
  displayMode!: string;
  isDefault!: number;
  createdAt!: Date;
  updatedAt!: Date;

  // units belongsTo unitGroups via unitGroupId
  unitGroup!: unitGroups;
  getUnitGroup!: Sequelize.BelongsToGetAssociationMixin<unitGroups>;
  setUnitGroup!: Sequelize.BelongsToSetAssociationMixin<unitGroups, unitGroupsId>;
  createUnitGroup!: Sequelize.BelongsToCreateAssociationMixin<unitGroups>;
  // units hasMany testFillables via unitId
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
    unitGroupId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'unit_groups',
        key: 'id'
      },
      field: 'unit_group_id'
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
    displayMode: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: "decimal",
      field: 'display_mode'
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
      {
        name: "fk_units_group",
        using: "BTREE",
        fields: [
          { name: "unit_group_id" },
        ]
      },
    ]
  });
  }
}
