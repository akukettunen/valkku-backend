import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { users, usersId } from './users';

export interface passwordResetsAttributes {
  id: number;
  userId: string;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  used: number;
  usedAt?: Date;
}

export type passwordResetsPk = "id";
export type passwordResetsId = passwordResets[passwordResetsPk];
export type passwordResetsOptionalAttributes = "id" | "createdAt" | "used" | "usedAt";
export type passwordResetsCreationAttributes = Optional<passwordResetsAttributes, passwordResetsOptionalAttributes>;

export class passwordResets extends Model<passwordResetsAttributes, passwordResetsCreationAttributes> implements passwordResetsAttributes {
  id!: number;
  userId!: string;
  tokenHash!: string;
  createdAt!: Date;
  expiresAt!: Date;
  used!: number;
  usedAt?: Date;

  // passwordResets belongsTo users via userId
  user!: users;
  getUser!: Sequelize.BelongsToGetAssociationMixin<users>;
  setUser!: Sequelize.BelongsToSetAssociationMixin<users, usersId>;
  createUser!: Sequelize.BelongsToCreateAssociationMixin<users>;

  static initModel(sequelize: Sequelize.Sequelize): typeof passwordResets {
    return passwordResets.init({
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
    tokenHash: {
      type: DataTypes.CHAR(64),
      allowNull: false,
      unique: "uniq_token_hash"
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    used: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'password_resets',
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
        name: "uniq_token_hash",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "tokenHash" },
        ]
      },
      {
        name: "userId",
        using: "BTREE",
        fields: [
          { name: "userId" },
        ]
      },
    ]
  });
  }
}
