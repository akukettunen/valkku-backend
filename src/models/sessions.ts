import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface sessionsAttributes {
  jti: string;
  userId: string;
  refreshHash: string;
  createdAt?: Date;
  expiresAt: Date;
  replacedBy?: string;
  revokedAt?: Date;
  ip?: string;
  userAgent?: string;
  lastUsedAt?: Date;
}

export type sessionsPk = "jti";
export type sessionsId = sessions[sessionsPk];
export type sessionsOptionalAttributes = "createdAt" | "replacedBy" | "revokedAt" | "ip" | "userAgent" | "lastUsedAt";
export type sessionsCreationAttributes = Optional<sessionsAttributes, sessionsOptionalAttributes>;

export class sessions extends Model<sessionsAttributes, sessionsCreationAttributes> implements sessionsAttributes {
  jti!: string;
  userId!: string;
  refreshHash!: string;
  createdAt?: Date;
  expiresAt!: Date;
  replacedBy?: string;
  revokedAt?: Date;
  ip?: string;
  userAgent?: string;
  lastUsedAt?: Date;


  static initModel(sequelize: Sequelize.Sequelize): typeof sessions {
    return sessions.init({
    jti: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      primaryKey: true
    },
    userId: {
      type: DataTypes.STRING(21),
      allowNull: false
    },
    refreshHash: {
      type: DataTypes.STRING(86),
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE(3),
      allowNull: true,
      defaultValue: "CURRENT_TIMESTAMP(3)"
    },
    expiresAt: {
      type: DataTypes.DATE(3),
      allowNull: false
    },
    replacedBy: {
      type: DataTypes.CHAR(36),
      allowNull: true
    },
    revokedAt: {
      type: DataTypes.DATE(3),
      allowNull: true
    },
    ip: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    userAgent: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    lastUsedAt: {
      type: DataTypes.DATE(3),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'sessions',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "jti" },
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
        name: "expiresAt",
        using: "BTREE",
        fields: [
          { name: "expiresAt" },
        ]
      },
    ]
  });
  }
}
