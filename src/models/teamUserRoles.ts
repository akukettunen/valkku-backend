import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { teams, teamsId } from './teams';
import type { users, usersId } from './users';

export interface teamUserRolesAttributes {
  id: number;
  userId: string;
  teamId: string;
  role: 'owner' | 'admin' | 'coach' | 'athlete' | 'guardian';
  guardianOf?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type teamUserRolesPk = "id";
export type teamUserRolesId = teamUserRoles[teamUserRolesPk];
export type teamUserRolesOptionalAttributes = "id" | "guardianOf" | "createdAt" | "updatedAt";
export type teamUserRolesCreationAttributes = Optional<teamUserRolesAttributes, teamUserRolesOptionalAttributes>;

export class teamUserRoles extends Model<teamUserRolesAttributes, teamUserRolesCreationAttributes> implements teamUserRolesAttributes {
  id!: number;
  userId!: string;
  teamId!: string;
  role!: 'owner' | 'admin' | 'coach' | 'athlete' | 'guardian';
  guardianOf?: string;
  createdAt!: Date;
  updatedAt!: Date;

  // teamUserRoles belongsTo teams via teamId
  team!: teams;
  getTeam!: Sequelize.BelongsToGetAssociationMixin<teams>;
  setTeam!: Sequelize.BelongsToSetAssociationMixin<teams, teamsId>;
  createTeam!: Sequelize.BelongsToCreateAssociationMixin<teams>;
  // teamUserRoles belongsTo users via guardianOf
  guardianOfUser!: users;
  getGuardianOfUser!: Sequelize.BelongsToGetAssociationMixin<users>;
  setGuardianOfUser!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createGuardianOfUser!: Sequelize.BelongsToCreateAssociationMixin<users>;
  // teamUserRoles belongsTo users via userId
  user!: users;
  getUser!: Sequelize.BelongsToGetAssociationMixin<users>;
  setUser!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createUser!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof teamUserRoles {
    return teamUserRoles.init({
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    userId: {
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
    role: {
      type: DataTypes.ENUM('owner','admin','coach','athlete','guardian'),
      allowNull: false
    },
    guardianOf: {
      type: DataTypes.STRING(21),
      allowNull: true,
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
    tableName: 'team_user_roles',
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
        name: "fk_tur_user",
        using: "BTREE",
        fields: [
          { name: "userId" },
        ]
      },
      {
        name: "fk_tur_team",
        using: "BTREE",
        fields: [
          { name: "teamId" },
        ]
      },
      {
        name: "fk_tur_guardian",
        using: "BTREE",
        fields: [
          { name: "guardianOf" },
        ]
      },
    ]
  });
  }
}
