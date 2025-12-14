import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { units, unitsId } from './units';

export interface unitGroupsAttributes {
  id: number;
  title: object;
  createdAt: Date;
  updatedAt: Date;
}

export type unitGroupsPk = "id";
export type unitGroupsId = unitGroups[unitGroupsPk];
export type unitGroupsOptionalAttributes = "id" | "createdAt" | "updatedAt";
export type unitGroupsCreationAttributes = Optional<unitGroupsAttributes, unitGroupsOptionalAttributes>;

export class unitGroups extends Model<unitGroupsAttributes, unitGroupsCreationAttributes> implements unitGroupsAttributes {
  id!: number;
  title!: object;
  createdAt!: Date;
  updatedAt!: Date;

  // unitGroups hasMany units via unitGroupId
  units!: units[];
  getUnits!: Sequelize.HasManyGetAssociationsMixin<units>;
  setUnits!: Sequelize.HasManySetAssociationsMixin<units, unitsId>;
  addUnit!: Sequelize.HasManyAddAssociationMixin<units, unitsId>;
  addUnits!: Sequelize.HasManyAddAssociationsMixin<units, unitsId>;
  createUnit!: Sequelize.HasManyCreateAssociationMixin<units>;
  removeUnit!: Sequelize.HasManyRemoveAssociationMixin<units, unitsId>;
  removeUnits!: Sequelize.HasManyRemoveAssociationsMixin<units, unitsId>;
  hasUnit!: Sequelize.HasManyHasAssociationMixin<units, unitsId>;
  hasUnits!: Sequelize.HasManyHasAssociationsMixin<units, unitsId>;
  countUnits!: Sequelize.HasManyCountAssociationsMixin;

  static initModel(sequelize: Sequelize.Sequelize): typeof unitGroups {
    return unitGroups.init({
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
    tableName: 'unit_groups',
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
    ]
  });
  }
}
