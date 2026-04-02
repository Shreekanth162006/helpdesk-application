import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize.js';

export class Forum extends Model {}

Forum.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    private: { type: DataTypes.BOOLEAN, defaultValue: false },
    allowTopicVoting: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'allow_topic_voting' },
    allowPostVoting: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'allow_post_voting' },
    layout: { type: DataTypes.STRING, defaultValue: 'table' },
    topicsCount: { type: DataTypes.INTEGER, defaultValue: 0, field: 'topics_count' },
  },
  { sequelize, modelName: 'forum', underscored: true, timestamps: true }
);
