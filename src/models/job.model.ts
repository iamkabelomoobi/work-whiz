/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataTypes, Model, Association } from 'sequelize';
import { sequelize } from '@work-whiz/libs';
import { EmployerModel } from './employer.model';
import { IJob, IModelDictionary } from '@work-whiz/interfaces';

class JobModel extends Model<IJob> implements IJob {
  public id!: string;
  public title!: string;
  public description!: string;
  public responsibilities!: string[];
  public requirements!: string[];
  public benefits?: string[];
  public location!: string;
  public type!: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  public vacancy?: number;
  public deadline!: Date;
  public tags!: string[];
  public employerId!: string;
  public views?: number;
  public isPublic?: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static associations: {
    employer: Association<JobModel, EmployerModel>;
  };

  public static associate(models: IModelDictionary) {
    JobModel.belongsTo(models.EmployerModel, {
      foreignKey: {
        name: 'employerId',
        allowNull: false,
      },
      as: 'employer',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      hooks: true,
      constraints: true,
    });
  }
}

JobModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    responsibilities: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    requirements: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    benefits: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('Full-time', 'Part-time', 'Contract', 'Internship'),
      allowNull: false,
      defaultValue: 'Full-time',
    },
    vacancy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    views: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'Job',
    timestamps: true,
  },
);

export { JobModel };
