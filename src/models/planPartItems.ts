import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { planPartItemTexts, planPartItemTextsCreationAttributes, planPartItemTextsId } from './planPartItemTexts';
import type { planParts, planPartsId } from './planParts';

export interface planPartItemsAttributes {
  id: string;
  partId?: string;
  position?: number;
  type: 'audio' | 'video' | 'text' | 'image' | 'file' | 'rest';
  createdAt?: Date;
  updatedAt?: Date;
}

export type planPartItemsPk = "id";
export type planPartItemsId = planPartItems[planPartItemsPk];
export type planPartItemsOptionalAttributes = "partId" | "position" | "createdAt" | "updatedAt";
export type planPartItemsCreationAttributes = Optional<planPartItemsAttributes, planPartItemsOptionalAttributes>;

export class planPartItems extends Model<planPartItemsAttributes, planPartItemsCreationAttributes> implements planPartItemsAttributes {
  id!: string;
  partId?: string;
  position?: number;
  type!: 'audio' | 'video' | 'text' | 'image' | 'file' | 'rest';
  createdAt?: Date;
  updatedAt?: Date;

  // planPartItems hasOne planPartItemTexts via planPartItemId
  planPartItemText!: planPartItemTexts;
  getPlanPartItemText!: Sequelize.HasOneGetAssociationMixin<planPartItemTexts>;
  setPlanPartItemText!: Sequelize.HasOneSetAssociationMixin<planPartItemTexts, planPartItemTextsId>;
  createPlanPartItemText!: Sequelize.HasOneCreateAssociationMixin<planPartItemTexts>;
  // planPartItems belongsTo planParts via partId
  part!: planParts;
  getPart!: Sequelize.BelongsToGetAssociationMixin<planParts>;
  setPart!: Sequelize.BelongsToSetAssociationMixin<planParts, planPartsId>;
  createPart!: Sequelize.BelongsToCreateAssociationMixin<planParts>;

  static initModel(sequelize: Sequelize.Sequelize): typeof planPartItems {
    return planPartItems.init({
    id: {
      type: DataTypes.STRING(21),
      allowNull: false,
      primaryKey: true
    },
    partId: {
      type: DataTypes.STRING(21),
      allowNull: true,
      references: {
        model: 'plan_parts',
        key: 'id'
      }
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    type: {
      type: DataTypes.BLOB,
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    }
  }, {
    sequelize,
    tableName: 'plan_part_items',
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
        name: "partId",
        using: "BTREE",
        fields: [
          { name: "partId" },
        ]
      },
    ]
  });
  }
}
