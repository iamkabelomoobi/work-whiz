/* eslint-disable @typescript-eslint/no-explicit-any */
import { Association, DataTypes, Model } from 'sequelize';
import { sequelize } from '@work-whiz/libs';
import { IUser } from '@work-whiz/interfaces';
import { Role } from '@work-whiz/types';
import { ROLE_ENUM } from '@work-whiz/enums';

/**
 * User database model representing system users
 * @class UserModel
 * @extends {Model<IUser>}
 * @implements {IUser}
 */
class UserModel extends Model<IUser> implements IUser {
  public id!: string;
  public avatarUrl!: string;
  public email!: string;
  public phone!: string;
  public password!: string;
  public role!: Role;
  public isVerified!: boolean;
  public isActive!: boolean;
  public isLocked!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static associations: {
    admin: Association<UserModel, any>;
  };

  public static associate(models: any) {
    UserModel.hasOne(models.AdminModel, {
      foreignKey: {
        name: 'userId',
        allowNull: false,
      },
      as: 'admin',
      onDelete: 'CASCADE',
    });
    UserModel.hasOne(models.CandidateModel, {
      foreignKey: {
        name: 'userId',
        allowNull: false,
      },
      as: 'candidate',
      onDelete: 'CASCADE',
    });
    UserModel.hasOne(models.EmployerModel, {
      foreignKey: {
        name: 'userId',
        allowNull: false,
      },
      as: 'employer',
      onDelete: 'CASCADE',
    });
  }
}

UserModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      validate: {
        isUUID: 4,
      },
    },
    avatarUrl: {
      type: DataTypes.STRING(512),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM(...ROLE_ENUM),
      allowNull: false,
      defaultValue: 'candidate',
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    isLocked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    timestamps: true,
  },
);

export { UserModel };
