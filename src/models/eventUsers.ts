import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { events, eventsId } from './events';
import type { users, usersId } from './users';

export interface eventUsersAttributes {
  id: number;
  eventId: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type eventUsersPk = "id";
export type eventUsersId = eventUsers[eventUsersPk];
export type eventUsersOptionalAttributes = "id" | "createdAt" | "updatedAt";
export type eventUsersCreationAttributes = Optional<eventUsersAttributes, eventUsersOptionalAttributes>;

export class eventUsers extends Model<eventUsersAttributes, eventUsersCreationAttributes> implements eventUsersAttributes {
  id!: number;
  eventId!: number;
  userId!: string;
  createdAt!: Date;
  updatedAt!: Date;

  // eventUsers belongsTo events via eventId
  event!: events;
  getEvent!: Sequelize.BelongsToGetAssociationMixin<events>;
  setEvent!: Sequelize.BelongsToSetAssociationMixin<events, eventsId>;
  createEvent!: Sequelize.BelongsToCreateAssociationMixin<events>;
  // eventUsers belongsTo users via userId
  user!: users;
  getUser!: Sequelize.BelongsToGetAssociationMixin<users>;
  setUser!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createUser!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof eventUsers {
    return eventUsers.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'events',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.STRING(21),
      allowNull: false,
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
    tableName: 'event_users',
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
        name: "event_users_ibfk_1",
        using: "BTREE",
        fields: [
          { name: "eventId" },
        ]
      },
      {
        name: "event_users_ibfk_2",
        using: "BTREE",
        fields: [
          { name: "userId" },
        ]
      },
    ]
  });
  }
}

