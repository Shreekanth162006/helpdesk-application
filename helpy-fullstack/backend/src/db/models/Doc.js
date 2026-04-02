import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize.js';

export class Doc extends Model {}

Doc.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    categoryId: { type: DataTypes.INTEGER, allowNull: false, field: 'category_id' },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
    keywords: { type: DataTypes.STRING },
    titleTag: { type: DataTypes.STRING, field: 'title_tag' },
    metaDescription: { type: DataTypes.STRING, field: 'meta_description' },
    rank: { type: DataTypes.INTEGER, defaultValue: 0 },
    frontPage: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'front_page' },
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
    attachments: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  },
  { sequelize, modelName: 'doc', underscored: true, timestamps: true }
);
