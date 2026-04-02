import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize.js';

export class PasswordResetRequest extends Model {}

PasswordResetRequest.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
    email: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, allowNull: false },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'pending',
    }, // pending | approved | rejected | completed
    approvedAt: { type: DataTypes.DATE, allowNull: true, field: 'approved_at' },
    approvedBy: { type: DataTypes.INTEGER, allowNull: true, field: 'approved_by' },
    completedAt: { type: DataTypes.DATE, allowNull: true, field: 'completed_at' },
  },
  { sequelize, modelName: 'password_reset_request', underscored: true, timestamps: true }
);
