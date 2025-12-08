import * as Sequelize from 'sequelize';
import { DataTypes, Model, Optional } from 'sequelize';

export interface testGroupsAttributes {
  id: number;
  title: object;
}

export type testGroupsPk = "id";
export type testGroupsId = testGroups[testGroupsPk];
export type testGroupsOptionalAttributes = "id";
export type testGroupsCreationAttributes = Optional<testGroupsAttributes, testGroupsOptionalAttributes>;

export class testGroups extends Model<testGroupsAttributes, testGroupsCreationAttributes> implements testGroupsAttributes {
  id!: number;
  title!: object;

  // testGroups hasMany tests via testGroupId
  tests!: import('./tests').tests[];
  getTests!: Sequelize.HasManyGetAssociationsMixin<import('./tests').tests>;
  setTests!: Sequelize.HasManySetAssociationsMixin<import('./tests').tests, import('./tests').testsId>;
  addTest!: Sequelize.HasManyAddAssociationMixin<import('./tests').tests, import('./tests').testsId>;
  addTests!: Sequelize.HasManyAddAssociationsMixin<import('./tests').tests, import('./tests').testsId>;
  createTest!: Sequelize.HasManyCreateAssociationMixin<import('./tests').tests>;
  removeTest!: Sequelize.HasManyRemoveAssociationMixin<import('./tests').tests, import('./tests').testsId>;
  removeTests!: Sequelize.HasManyRemoveAssociationsMixin<import('./tests').tests, import('./tests').testsId>;
  hasTest!: Sequelize.HasManyHasAssociationMixin<import('./tests').tests, import('./tests').testsId>;
  hasTests!: Sequelize.HasManyHasAssociationsMixin<import('./tests').tests, import('./tests').testsId>;
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
