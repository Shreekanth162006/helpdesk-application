import { sequelize } from '../sequelize.js';
import { User } from './User.js';
import { Category } from './Category.js';
import { Doc } from './Doc.js';
import { Forum } from './Forum.js';
import { Topic } from './Topic.js';
import { Post } from './Post.js';
import { Tag } from './Tag.js';
import { Notification } from './Notification.js';
import { PasswordResetRequest } from './PasswordResetRequest.js';

// Associations
User.hasMany(Topic, { foreignKey: 'user_id', as: 'topics' });
Topic.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Post, { foreignKey: 'user_id', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Topic.belongsTo(User, { foreignKey: 'assigned_user_id', as: 'assignedUser' });

Category.hasMany(Doc, { foreignKey: 'category_id', as: 'docs' });
Doc.belongsTo(Category, { foreignKey: 'category_id' });
User.hasMany(Doc, { foreignKey: 'user_id' });
Doc.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Forum.hasMany(Topic, { foreignKey: 'forum_id', as: 'topics' });
Topic.belongsTo(Forum, { foreignKey: 'forum_id', as: 'forum' });

Topic.hasMany(Post, { foreignKey: 'topic_id', as: 'posts' });
Post.belongsTo(Topic, { foreignKey: 'topic_id' });

User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(PasswordResetRequest, { foreignKey: 'user_id', as: 'passwordResetRequests' });
PasswordResetRequest.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export { sequelize, User, Category, Doc, Forum, Topic, Post, Tag, Notification, PasswordResetRequest };
