import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize.js';

export class Post extends Model {}

Post.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    topicId: { type: DataTypes.INTEGER, allowNull: false, field: 'topic_id' },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
    body: { type: DataTypes.TEXT, allowNull: false },
    kind: { type: DataTypes.STRING, defaultValue: 'reply' }, // first, reply, note
    active: { type: DataTypes.BOOLEAN, defaultValue: true },
    attachments: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    cc: { type: DataTypes.STRING },
    bcc: { type: DataTypes.STRING },
  },
  { sequelize, modelName: 'post', underscored: true, timestamps: true }
);
