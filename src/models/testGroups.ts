import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';
import type { tests, testsId } from './tests';

export interface testGroupsAttributes {
  id: number;
  title: object;
  sortOrder: number;
  deletedAt?: Date | null;
}

export type testGroupsPk = "id";
export type testGroupsId = testGroups[testGroupsPk];
export type testGroupsOptionalAttributes = "id" | "sortOrder" | "deletedAt";
export type testGroupsCreationAttributes = Optional<testGroupsAttributes, testGroupsOptionalAttributes>;

export class testGroups extends Model<testGroupsAttributes, testGroupsCreationAttributes> implements testGroupsAttributes {
  id!: number;
  title!: object;
  sortOrder!: number;
  deletedAt?: Date | null;

  // testGroups hasMany tests via testGroupId
  tests!: tests[];
  getTests!: Sequelize.HasManyGetAssociationsMixin<tests>;
  setTests!: Sequelize.HasManySetAssociationsMixin<tests, testsId>;
  addTest!: Sequelize.HasManyAddAssociationMixin<tests, testsId>;
  addTests!: Sequelize.HasManyAddAssociationsMixin<tests, testsId>;
  createTest!: Sequelize.HasManyCreateAssociationMixin<tests>;
  removeTest!: Sequelize.HasManyRemoveAssociationMixin<tests, testsId>;
  removeTests!: Sequelize.HasManyRemoveAssociationsMixin<tests, testsId>;
  hasTest!: Sequelize.HasManyHasAssociationMixin<tests, testsId>;
  hasTests!: Sequelize.HasManyHasAssociationsMixin<tests, testsId>;
  countTests!: Sequelize.HasManyCountAssociationsMixin;

  static initModel(sequelize: Sequelize.Sequelize): typeof testGroups {
    return testGroups.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      primaryKey: true
    },
    title: {
      type: DataTypes.JSON,
      allowNull: false
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'sort_order'
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at'
    }
  }, {
    sequelize,
    tableName: 'test_groups',
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
    ]
  });
  }
}
