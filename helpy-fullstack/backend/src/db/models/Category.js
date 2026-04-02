import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize.js';

export class Category extends Model {}

Category.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    icon: { type: DataTypes.STRING },
    keywords: { type: DataTypes.STRING },
    titleTag: { type: DataTypes.STRING, field: 'title_tag' },
    metaDescription: { type: DataTypes.STRING, field: 'meta_description' },
    rank: { type: DataTypes.INTEGER, defaultValue: 0 },
    frontPage: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'front_page' },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
    visibility: { type: DataTypes.STRING, defaultValue: 'all' },
  },
  { sequelize, modelName: 'category', underscored: true, timestamps: true }
);
