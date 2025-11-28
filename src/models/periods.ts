import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { teams, teamsId } from './teams';
import type { users, usersId } from './users';

export interface periodsAttributes {
  id: number;
  name: string;
  decsription?: string;
  startDate: Date;
  endDate: Date;
  createdById: string;
  teamId: string;
  createdAt: Date;
  updatedAt: Date;
  color: string;
}

export type periodsPk = "id";
export type periodsId = periods[periodsPk];
export type periodsOptionalAttributes = "id" | "decsription";
export type periodsCreationAttributes = Optional<periodsAttributes, periodsOptionalAttributes>;

export class periods extends Model<periodsAttributes, periodsCreationAttributes> implements periodsAttributes {
  id!: number;
  name!: string;
  decsription?: string;
  startDate!: Date;
  endDate!: Date;
  createdById!: string;
  teamId!: string;
  createdAt!: Date;
  updatedAt!: Date;
  color!: string;

  // periods belongsTo teams via teamId
  team!: teams;
  getTeam!: Sequelize.BelongsToGetAssociationMixin<teams>;
  setTeam!: Sequelize.BelongsToSetAssociationMixin<teams, teamsId>;
  createTeam!: Sequelize.BelongsToCreateAssociationMixin<teams>;
  // periods belongsTo users via createdById
  createdBy!: users;
  getCreatedBy!: Sequelize.BelongsToGetAssociationMixin<users>;
  setCreatedBy!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createCreatedBy!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof periods {
    return periods.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    decsription: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
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
    teamId: {
      type: DataTypes.STRING(21),
      allowNull: false,
      references: {
        model: 'teams',
        key: 'id'
      }
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    color: {
      type: DataTypes.STRING(10),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'periods',
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
        name: "createdById",
        using: "BTREE",
        fields: [
          { name: "createdById" },
        ]
      },
      {
        name: "teamId",
        using: "BTREE",
        fields: [
          { name: "teamId" },
        ]
      },
    ]
  });
  }
}
