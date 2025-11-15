import { DataTypes, Model, Association } from 'sequelize';
import { sequelize } from '@work-whiz/libs';
import { JobModel } from './job.model';
import { CandidateModel } from './candidate.model';
import { IApplication, IModelDictionary } from '@work-whiz/interfaces';

class ApplicationModel extends Model<IApplication> implements IApplication {
  public id!: string;
  public jobId!: string;
  public candidateId!: string;
  public status!: 'pending' | 'accepted' | 'rejected';
  public coverLetter?: string;
  public resumeUrl?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static associations: {
    job: Association<ApplicationModel, JobModel>;
    candidate: Association<ApplicationModel, CandidateModel>;
  };

  public static associate(models: IModelDictionary) {
    ApplicationModel.belongsTo(models.JobModel, {
      foreignKey: {
        name: 'jobId',
        allowNull: false,
      },
      as: 'job',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      hooks: true,
      constraints: true,
    });
    ApplicationModel.belongsTo(models.CandidateModel, {
      foreignKey: {
        name: 'candidateId',
        allowNull: false,
      },
      as: 'candidate',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      hooks: true,
      constraints: true,
    });
  }
}

ApplicationModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    jobId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    candidateId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    coverLetter: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    resumeUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Application',
    timestamps: true,
    indexes: [
      {
        name: 'application_search_index',
        fields: [
          'id',
          'jobId',
          'candidateId',
          'status',
          'createdAt',
          'updatedAt',
        ],
      },
    ],
  },
);

export { ApplicationModel };
