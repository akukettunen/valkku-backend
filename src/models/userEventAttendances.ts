import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { events, eventsId } from './events';
import type { users, usersId } from './users';

export interface userEventAttendancesAttributes {
  userId: string;
  eventId: number;
  repeatId: string;
  attends: number;
  createdAt: Date;
  updatedAt: Date;
}

export type userEventAttendancesPk = "userId" | "eventId" | "repeatId";
export type userEventAttendancesId = userEventAttendances[userEventAttendancesPk];
export type userEventAttendancesOptionalAttributes = "createdAt" | "updatedAt";
export type userEventAttendancesCreationAttributes = Optional<userEventAttendancesAttributes, userEventAttendancesOptionalAttributes>;

export class userEventAttendances extends Model<userEventAttendancesAttributes, userEventAttendancesCreationAttributes> implements userEventAttendancesAttributes {
  userId!: string;
  eventId!: number;
  repeatId!: string;
  attends!: number;
  createdAt!: Date;
  updatedAt!: Date;

  // userEventAttendances belongsTo events via eventId
  event!: events;
  getEvent!: Sequelize.BelongsToGetAssociationMixin<events>;
  setEvent!: Sequelize.BelongsToSetAssociationMixin<events, eventsId>;
  createEvent!: Sequelize.BelongsToCreateAssociationMixin<events>;
  // userEventAttendances belongsTo users via userId
  user!: users;
  getUser!: Sequelize.BelongsToGetAssociationMixin<users>;
  setUser!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createUser!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof userEventAttendances {
    return userEventAttendances.init({
    userId: {
      type: DataTypes.STRING(21),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'events',
        key: 'id'
      }
    },
    repeatId: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      primaryKey: true
    },
    attends: {
      type: DataTypes.BOOLEAN,
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
    tableName: 'user_event_attendances',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "userId" },
          { name: "eventId" },
          { name: "repeatId" },
        ]
      },
      {
        name: "user_event_attendances_ibfk_2",
        using: "BTREE",
        fields: [
          { name: "eventId" },
        ]
      },
    ]
  });
  }
}
