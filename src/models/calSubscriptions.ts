import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { teams, teamsId } from './teams';
import type { users, usersId } from './users';

export interface calSubscriptionsAttributes {
  id: number;
  token: string;
  userId: string;
  teamId: string;
  role: 'owner' | 'admin' | 'coach' | 'athlete' | 'guardian';
  guardianOfId?: string;
}

export type calSubscriptionsPk = "id";
export type calSubscriptionsId = calSubscriptions[calSubscriptionsPk];
export type calSubscriptionsOptionalAttributes = "id" | "guardianOfId";
export type calSubscriptionsCreationAttributes = Optional<calSubscriptionsAttributes, calSubscriptionsOptionalAttributes>;

export class calSubscriptions extends Model<calSubscriptionsAttributes, calSubscriptionsCreationAttributes> implements calSubscriptionsAttributes {
  id!: number;
  token!: string;
  userId!: string;
  teamId!: string;
  role!: 'owner' | 'admin' | 'coach' | 'athlete' | 'guardian';
  guardianOfId?: string;

  // calSubscriptions belongsTo teams via teamId
  team!: teams;
  getTeam!: Sequelize.BelongsToGetAssociationMixin<teams>;
  setTeam!: Sequelize.BelongsToSetAssociationMixin<teams, teamsId>;
  createTeam!: Sequelize.BelongsToCreateAssociationMixin<teams>;
  // calSubscriptions belongsTo users via userId
  user!: users;
  getUser!: Sequelize.BelongsToGetAssociationMixin<users>;
  setUser!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createUser!: Sequelize.BelongsToCreateAssociationMixin<users>;
  // calSubscriptions belongsTo users via guardianOfId
  guardianOf!: users;
  getGuardianOf!: Sequelize.BelongsToGetAssociationMixin<users>;
  setGuardianOf!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createGuardianOf!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof calSubscriptions {
    return calSubscriptions.init({
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    token: {
      type: DataTypes.STRING(16),
      allowNull: false
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
    guardianOfId: {
      type: DataTypes.STRING(21),
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'cal_subscriptions',
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
        name: "userId",
        using: "BTREE",
        fields: [
          { name: "userId" },
        ]
      },
      {
        name: "teamId",
        using: "BTREE",
        fields: [
          { name: "teamId" },
        ]
      },
      {
        name: "guardianOfId",
        using: "BTREE",
        fields: [
          { name: "guardianOfId" },
        ]
      },
    ]
  });
  }
}
