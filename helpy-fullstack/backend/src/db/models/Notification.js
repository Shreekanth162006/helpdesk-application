import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize.js';

export class Notification extends Model {}

Notification.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' }, // recipient
    title: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    kind: { type: DataTypes.STRING, allowNull: false, defaultValue: 'info' }, // info|warning|success
    readAt: { type: DataTypes.DATE, allowNull: true, field: 'read_at' },
  },
  { sequelize, modelName: 'notification', underscored: true, timestamps: true }
);

