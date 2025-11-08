import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { teams, teamsId } from './teams';
import type { users, usersId } from './users';

export interface teamUsersAttributes {
  userId: string;
  teamId: string;
  status: 'active' | 'invited';
  createdAt: Date;
  updatedAt: Date;
  tokenHash?: string;
  validUntil?: Date;
  invitedBy?: string;
}

export type teamUsersPk = "userId" | "teamId";
export type teamUsersId = teamUsers[teamUsersPk];
export type teamUsersOptionalAttributes = "status" | "createdAt" | "updatedAt" | "tokenHash" | "validUntil" | "invitedBy";
export type teamUsersCreationAttributes = Optional<teamUsersAttributes, teamUsersOptionalAttributes>;

export class teamUsers extends Model<teamUsersAttributes, teamUsersCreationAttributes> implements teamUsersAttributes {
  userId!: string;
  teamId!: string;
  status!: 'active' | 'invited';
  createdAt!: Date;
  updatedAt!: Date;
  tokenHash?: string;
  validUntil?: Date;
  invitedBy?: string;

  // teamUsers belongsTo teams via teamId
  team!: teams;
  getTeam!: Sequelize.BelongsToGetAssociationMixin<teams>;
  setTeam!: Sequelize.BelongsToSetAssociationMixin<teams, teamsId>;
  createTeam!: Sequelize.BelongsToCreateAssociationMixin<teams>;
  // teamUsers belongsTo users via userId
  user!: users;
  getUser!: Sequelize.BelongsToGetAssociationMixin<users>;
  setUser!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createUser!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof teamUsers {
    return teamUsers.init({
    userId: {
      type: DataTypes.STRING(21),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    teamId: {
      type: DataTypes.STRING(21),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'teams',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('active','invited'),
      allowNull: false,
      defaultValue: "active"
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
    },
    tokenHash: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: "uq_invites_tokenHash"
    },
    validUntil: {
      type: DataTypes.DATE,
      allowNull: true
    },
    invitedBy: {
      type: DataTypes.STRING(21),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'team_users',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "userId" },
          { name: "teamId" },
        ]
      },
      {
        name: "uq_invites_active",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "teamId" },
          { name: "userId" },
        ]
      },
      {
        name: "uq_invites_tokenHash",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "tokenHash" },
        ]
      },
    ]
  });
  }
}
