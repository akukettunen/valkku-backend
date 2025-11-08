import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { planPartItems, planPartItemsId } from './planPartItems';

export interface planPartItemTextsAttributes {
  planPartItemId: string;
  text?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type planPartItemTextsPk = "planPartItemId";
export type planPartItemTextsId = planPartItemTexts[planPartItemTextsPk];
export type planPartItemTextsOptionalAttributes = "text" | "createdAt" | "updatedAt";
export type planPartItemTextsCreationAttributes = Optional<planPartItemTextsAttributes, planPartItemTextsOptionalAttributes>;

export class planPartItemTexts extends Model<planPartItemTextsAttributes, planPartItemTextsCreationAttributes> implements planPartItemTextsAttributes {
  planPartItemId!: string;
  text?: string;
  createdAt?: Date;
  updatedAt?: Date;

  // planPartItemTexts belongsTo planPartItems via planPartItemId
  planPartItem!: planPartItems;
  getPlanPartItem!: Sequelize.BelongsToGetAssociationMixin<planPartItems>;
  setPlanPartItem!: Sequelize.BelongsToSetAssociationMixin<planPartItems, planPartItemsId>;
  createPlanPartItem!: Sequelize.BelongsToCreateAssociationMixin<planPartItems>;

  static initModel(sequelize: Sequelize.Sequelize): typeof planPartItemTexts {
    return planPartItemTexts.init({
    planPartItemId: {
      type: DataTypes.STRING(21),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'plan_part_items',
        key: 'id'
      }
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: true
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
    tableName: 'plan_part_item_texts',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "planPartItemId" },
        ]
      },
    ]
  });
  }
}
