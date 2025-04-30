/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataTypes, Model, Association } from 'sequelize';
import { UserModel } from './user.model';
import { sequelize } from '@work-whiz/libs';
import { IEmployer, IModelDictionary } from '@work-whiz/interfaces';
import { JobModel } from './job.model';

/**
 * Employer database model representing companies/organizations
 * @class EmployerModel
 * @extends {Model<IEmployer>}
 * @implements {IEmployer}
 */
class EmployerModel extends Model<IEmployer> implements IEmployer {
  public id!: string;
  public name!: string;
  public industry!: string;
  public websiteUrl?: string;
  public location?: string;
  public description?: string;
  public size?: number;
  public foundedIn?: number;
  public isVerified?: boolean;
  public userId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public readonly user?: UserModel;

  public static associations: {
    user: Association<EmployerModel, any>;
    job: Association<EmployerModel, JobModel>;
  };

  public static associate(models: IModelDictionary) {
    EmployerModel.belongsTo(models.UserModel, {
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
    EmployerModel.hasMany(models.JobModel, {
      foreignKey: {
        name: 'employerId',
        allowNull: true,
      },
      as: 'jobs',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      hooks: true,
      constraints: true,
    });
  }
}

EmployerModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [2, 100],
      },
    },
    industry: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    websiteUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true,
      },
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [2, 100],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 2000],
      },
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
      },
    },
    foundedIn: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1800,
        max: new Date().getFullYear(),
      },
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'Employer',
    tableName: 'Employers',
    timestamps: true,
  },
);

export { EmployerModel };
