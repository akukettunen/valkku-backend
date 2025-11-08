import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { events, eventsId } from './events';

export interface eventExceptionsAttributes {
  id: number;
  eventId: number;
  recurrenceDate: string;
  replacementEventId?: number;
  isCancelled: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type eventExceptionsPk = "id";
export type eventExceptionsId = eventExceptions[eventExceptionsPk];
export type eventExceptionsOptionalAttributes = "id" | "replacementEventId" | "isCancelled" | "createdAt" | "updatedAt";
export type eventExceptionsCreationAttributes = Optional<eventExceptionsAttributes, eventExceptionsOptionalAttributes>;

export class eventExceptions extends Model<eventExceptionsAttributes, eventExceptionsCreationAttributes> implements eventExceptionsAttributes {
  id!: number;
  eventId!: number;
  recurrenceDate!: string;
  replacementEventId?: number;
  isCancelled!: number;
  createdAt?: Date;
  updatedAt?: Date;

  // eventExceptions belongsTo events via eventId
  event!: events;
  getEvent!: Sequelize.BelongsToGetAssociationMixin<events>;
  setEvent!: Sequelize.BelongsToSetAssociationMixin<events, eventsId>;
  createEvent!: Sequelize.BelongsToCreateAssociationMixin<events>;
  // eventExceptions belongsTo events via replacementEventId
  replacementEvent!: events;
  getReplacementEvent!: Sequelize.BelongsToGetAssociationMixin<events>;
  setReplacementEvent!: Sequelize.BelongsToSetAssociationMixin<events, eventsId>;
  createReplacementEvent!: Sequelize.BelongsToCreateAssociationMixin<events>;

  static initModel(sequelize: Sequelize.Sequelize): typeof eventExceptions {
    return eventExceptions.init({
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
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
    recurrenceDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    replacementEventId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'events',
        key: 'id'
      }
    },
    isCancelled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0
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
    tableName: 'event_exceptions',
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
        name: "u_series_occurrence",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "eventId" },
          { name: "recurrenceDate" },
        ]
      },
      {
        name: "fk_exception_replacement",
        using: "BTREE",
        fields: [
          { name: "replacementEventId" },
        ]
      },
    ]
  });
  }
}
