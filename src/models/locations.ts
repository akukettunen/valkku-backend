import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { events, eventsId } from './events';
import type { teams, teamsId } from './teams';

export interface locationsAttributes {
  id: number;
  name: string;
  teamId: string;
  formattedAddress: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  lat?: number;
  lon?: number;
  provider?: string;
  providerPlaceId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type locationsPk = "id";
export type locationsId = locations[locationsPk];
export type locationsOptionalAttributes = "id" | "addressLine1" | "addressLine2" | "city" | "state" | "zip" | "country" | "lat" | "lon" | "provider" | "providerPlaceId" | "createdAt" | "updatedAt";
export type locationsCreationAttributes = Optional<locationsAttributes, locationsOptionalAttributes>;

export class locations extends Model<locationsAttributes, locationsCreationAttributes> implements locationsAttributes {
  id!: number;
  name!: string;
  teamId!: string;
  formattedAddress!: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  lat?: number;
  lon?: number;
  provider?: string;
  providerPlaceId?: string;
  createdAt?: Date;
  updatedAt?: Date;

  // locations hasMany events via locationId
  events!: events[];
  getEvents!: Sequelize.HasManyGetAssociationsMixin<events>;
  setEvents!: Sequelize.HasManySetAssociationsMixin<events, eventsId>;
  addEvent!: Sequelize.HasManyAddAssociationMixin<events, eventsId>;
  addEvents!: Sequelize.HasManyAddAssociationsMixin<events, eventsId>;
  createEvent!: Sequelize.HasManyCreateAssociationMixin<events>;
  removeEvent!: Sequelize.HasManyRemoveAssociationMixin<events, eventsId>;
  removeEvents!: Sequelize.HasManyRemoveAssociationsMixin<events, eventsId>;
  hasEvent!: Sequelize.HasManyHasAssociationMixin<events, eventsId>;
  hasEvents!: Sequelize.HasManyHasAssociationsMixin<events, eventsId>;
  countEvents!: Sequelize.HasManyCountAssociationsMixin;
  // locations belongsTo teams via teamId
  team!: teams;
  getTeam!: Sequelize.BelongsToGetAssociationMixin<teams>;
  setTeam!: Sequelize.BelongsToSetAssociationMixin<teams, teamsId>;
  createTeam!: Sequelize.BelongsToCreateAssociationMixin<teams>;

  static initModel(sequelize: Sequelize.Sequelize): typeof locations {
    return locations.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(400),
      allowNull: false
    },
    teamId: {
      type: DataTypes.STRING(21),
      allowNull: false,
      references: {
        model: 'teams',
        key: 'id'
      }
    },
    formattedAddress: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    addressLine1: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    addressLine2: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    state: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    zip: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    country: {
      type: DataTypes.CHAR(2),
      allowNull: true
    },
    lat: {
      type: DataTypes.DECIMAL(9,6),
      allowNull: true
    },
    lon: {
      type: DataTypes.DECIMAL(9,6),
      allowNull: true
    },
    provider: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    providerPlaceId: {
      type: DataTypes.STRING(255),
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
    tableName: 'locations',
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
        name: "fk_locations_team",
        using: "BTREE",
        fields: [
          { name: "teamId" },
        ]
      },
    ]
  });
  }
}
