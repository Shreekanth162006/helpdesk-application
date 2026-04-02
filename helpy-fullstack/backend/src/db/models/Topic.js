import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../sequelize.js';

export class Topic extends Model { }

Topic.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    forumId: { type: DataTypes.INTEGER, allowNull: false, field: 'forum_id' },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
    userName: { type: DataTypes.STRING, field: 'user_name' },
    name: { type: DataTypes.STRING, allowNull: false },
    private: { type: DataTypes.BOOLEAN, defaultValue: false },
    currentStatus: { type: DataTypes.STRING, defaultValue: 'Open', field: 'current_status' }, // Open, In Progress, Waiting for Customer, Resolved, Closed
    assignedUserId: { type: DataTypes.INTEGER, field: 'assigned_user_id' },
    kind: { type: DataTypes.STRING, defaultValue: 'ticket' }, // ticket, discussion, chat
    channel: { type: DataTypes.STRING, defaultValue: 'api' },
    priority: { type: DataTypes.STRING, defaultValue: 'LOW' }, // LOW, MEDIUM, HIGH, CRITICAL
    department: { type: DataTypes.STRING, defaultValue: 'IT' }, // IT, HR, Finance, Support
    attachment: { type: DataTypes.STRING }, // filename or path
    postsCount: { type: DataTypes.INTEGER, defaultValue: 0, field: 'posts_count' },
    lastPostDate: { type: DataTypes.DATE, field: 'last_post_date' },
    // SLA (PRD Module 5): priority-based response/resolution due times
    responseDueAt: { type: DataTypes.DATE, allowNull: true, field: 'response_due_at' },
    resolutionDueAt: { type: DataTypes.DATE, allowNull: true, field: 'resolution_due_at' },
    isEscalated: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'is_escalated' },
  },
  { sequelize, modelName: 'topic', underscored: true, timestamps: true }
);
