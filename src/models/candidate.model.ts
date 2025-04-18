/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataTypes, Model, Association } from 'sequelize';
import { sequelize } from '@work-whiz/libs';
import { ICandidate } from '@work-whiz/interfaces';
import { TITLE_ENUM } from '@work-whiz/enums';

/**
 * Candidate database model representing job candidates
 * @class CandidateModel
 * @extends {Model<ICandidate>}
 * @implements {ICandidate}
 */
class CandidateModel extends Model<ICandidate> implements ICandidate {
  public id!: string;
  public firstName!: string;
  public lastName!: string;
  public title?: (typeof TITLE_ENUM)[number];
  public skills?: string[];
  public isEmployed?: boolean;
  public userId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public static associations: {
    user: Association<CandidateModel, any>;
  };

  public static associate(models: any) {
    CandidateModel.belongsTo(models.UserModel, {
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

CandidateModel.init(
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
    title: {
      type: DataTypes.ENUM(...TITLE_ENUM),
      allowNull: true,
    },
    skills: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: [],
    },
    isEmployed: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'Candidate',
    tableName: 'Candidates',
    timestamps: true,
  },
);

export { CandidateModel };
