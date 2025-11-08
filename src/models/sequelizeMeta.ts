import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface sequelizeMetaAttributes {
  name: string;
}

export type sequelizeMetaPk = "name";
export type sequelizeMetaId = sequelizeMeta[sequelizeMetaPk];
export type sequelizeMetaCreationAttributes = sequelizeMetaAttributes;

export class sequelizeMeta extends Model<sequelizeMetaAttributes, sequelizeMetaCreationAttributes> implements sequelizeMetaAttributes {
  name!: string;


  static initModel(sequelize: Sequelize.Sequelize): typeof sequelizeMeta {
    return sequelizeMeta.init({
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      primaryKey: true
    }
  }, {
    sequelize,
    tableName: 'SequelizeMeta',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "name" },
        ]
      },
      {
        name: "name",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "name" },
        ]
      },
    ]
  });
  }
}
