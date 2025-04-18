/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataTypes, Model, Association } from 'sequelize';
import { sequelize } from '@work-whiz/libs';
import { IAdmin } from '@work-whiz/interfaces';
import { Permissions } from '@work-whiz/types';

/**
 * Admin database model representing system administrators
 * @class AdminModel
 * @extends {Model<IAdmin>}
 * @implements {IAdmin}
 */
class AdminModel extends Model<IAdmin> implements IAdmin {
  public id!: string;
  public firstName!: string;
  public lastName!: string;
  public permissions!: Array<Permissions>;
  public userId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static associations: {
    user: Association<AdminModel, any>;
  };

  public static associate(models: any) {
    AdminModel.belongsTo(models.UserModel, {
      foreignKey: {
        name: 'userId',
        allowNull: false,
      },
      as: 'user',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      hooks: true,
      constraints: true,
    });
  }
}

AdminModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50],
      },
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50],
      },
    },
    permissions: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: ['READ'],
    },
  },
  {
    sequelize,
    modelName: 'Admin',
    tableName: 'Admins',
    timestamps: true,
  },
);

export { AdminModel };
