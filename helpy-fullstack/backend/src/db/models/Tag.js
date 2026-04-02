import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize.js';

export class Tag extends Model {}

Tag.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    color: { type: DataTypes.STRING },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { sequelize, modelName: 'tag', underscored: true, timestamps: true }
);
