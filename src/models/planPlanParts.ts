import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { planParts, planPartsId } from './planParts';
import type { plans, plansId } from './plans';

export interface planPlanPartsAttributes {
  id: number;
  planId: number;
  planPartId: string;
  position: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type planPlanPartsPk = "id";
export type planPlanPartsId = planPlanParts[planPlanPartsPk];
export type planPlanPartsOptionalAttributes = "id" | "createdAt" | "updatedAt";
export type planPlanPartsCreationAttributes = Optional<planPlanPartsAttributes, planPlanPartsOptionalAttributes>;

export class planPlanParts extends Model<planPlanPartsAttributes, planPlanPartsCreationAttributes> implements planPlanPartsAttributes {
  id!: number;
  planId!: number;
  planPartId!: string;
  position!: number;
  createdAt?: Date;
  updatedAt?: Date;

  // planPlanParts belongsTo planParts via planPartId
  planPart!: planParts;
  getPlanPart!: Sequelize.BelongsToGetAssociationMixin<planParts>;
  setPlanPart!: Sequelize.BelongsToSetAssociationMixin<planParts, planPartsId>;
  createPlanPart!: Sequelize.BelongsToCreateAssociationMixin<planParts>;
  // planPlanParts belongsTo plans via planId
  plan!: plans;
  getPlan!: Sequelize.BelongsToGetAssociationMixin<plans>;
  setPlan!: Sequelize.BelongsToSetAssociationMixin<plans, plansId>;
  createPlan!: Sequelize.BelongsToCreateAssociationMixin<plans>;

  static initModel(sequelize: Sequelize.Sequelize): typeof planPlanParts {
    return planPlanParts.init({
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    planId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'plans',
        key: 'id'
      }
    },
    planPartId: {
      type: DataTypes.STRING(21),
      allowNull: false,
      references: {
        model: 'plan_parts',
        key: 'id'
      }
    },
    position: {
      type: DataTypes.INTEGER,
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
    tableName: 'plan_plan_parts',
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
        name: "plan_part_parts_ibfk_1",
        using: "BTREE",
        fields: [
          { name: "planId" },
        ]
      },
      {
        name: "plan_part_parts_ibfk_2",
        using: "BTREE",
        fields: [
          { name: "planPartId" },
        ]
      },
    ]
  });
  }
}
