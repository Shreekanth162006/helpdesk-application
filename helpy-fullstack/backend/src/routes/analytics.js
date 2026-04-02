import { Router } from 'express';
import { Op } from 'sequelize';
import { Topic, User } from '../db/models/index.js';
import { auth, restrictToRoles } from '../middleware/auth.js';

const router = Router();
router.use(auth);

// PRD Module 8: Reports & Analytics — tickets by status, priority, agent
// GET /api/analytics/dashboard — for Manager, Admin, Super Admin
router.get(
  '/dashboard',
  restrictToRoles('Super Admin', 'Admin', 'Manager', 'Customer'),
  async (req, res, next) => {
    try {
      const where = { kind: 'ticket' };
      if (req.user.role === 'Customer') {
        where.userId = req.user.id;
      }

      const topics = await Topic.findAll({
        where,
        attributes: ['id', 'currentStatus', 'priority', 'assignedUserId', 'createdAt', 'updatedAt', 'resolutionDueAt'],
        raw: true,
      });

      const now = new Date();
      const closedStatuses = ['Resolved', 'Closed'];

      const byStatus = {};
      const byPriority = {};
      const byAgent = {};
      let breached = 0;
      let totalResolutionMs = 0;
      let resolvedCount = 0;

      topics.forEach((t) => {
        byStatus[t.currentStatus] = (byStatus[t.currentStatus] || 0) + 1;
        byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
        const agentId = t.assignedUserId || 0;
        byAgent[agentId] = (byAgent[agentId] || 0) + 1;

        if (t.resolutionDueAt && new Date(t.resolutionDueAt) < now && !closedStatuses.includes(t.currentStatus)) {
          breached += 1;
        }
        if (closedStatuses.includes(t.currentStatus) && t.updatedAt) {
          resolvedCount += 1;
          totalResolutionMs += new Date(t.updatedAt) - new Date(t.createdAt);
        }
      });

      const avgResolutionHours = resolvedCount > 0 ? totalResolutionMs / (resolvedCount * 3600000) : 0;

      // New: Trend aggregation (last 7 days)
      const trendDays = 7;
      const trendData = [];
      for (let i = trendDays - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        trendData.push({ date: dateStr, created: 0, resolved: 0 });
      }

      topics.forEach((t) => {
        const createdDate = t.createdAt.toISOString().split('T')[0];
        const day = trendData.find((d) => d.date === createdDate);
        if (day) day.created += 1;

        if (closedStatuses.includes(t.currentStatus) && t.updatedAt) {
          const resolvedDate = t.updatedAt.toISOString().split('T')[0];
          const resDay = trendData.find((d) => d.date === resolvedDate);
          if (resDay) resDay.resolved += 1;
        }
      });

      // Resolve agent IDs to names/emails for better frontend display
      const agentIds = Object.keys(byAgent).map((id) => parseInt(id, 10)).filter((id) => id > 0);
      let ticketsByAgentList = [];
      if (agentIds.length > 0) {
        const users = await User.findAll({ where: { id: agentIds }, attributes: ['id', 'name', 'email'], raw: true });
        const userById = {};
        users.forEach((u) => (userById[u.id] = u));
        ticketsByAgentList = Object.entries(byAgent).map(([aid, count]) => {
          const id = parseInt(aid, 10);
          if (id === 0) return { agentId: 0, name: 'Unassigned', count };
          const u = userById[id];
          return { agentId: id, name: u ? u.name || u.email || `#${id}` : `#${id}`, count };
        });
      } else {
        // include unassigned if present
        if (byAgent[0]) ticketsByAgentList = [{ agentId: 0, name: 'Unassigned', count: byAgent[0] }];
      }

      res.json({
        ticketsByStatus: byStatus,
        ticketsByPriority: byPriority,
        ticketsByAgent: byAgent,
        ticketsByAgentList,
        totalTickets: topics.length,
        slaBreachedCount: breached,
        averageResolutionHours: Math.round(avgResolutionHours * 10) / 10,
        resolvedCount,
        trendData,
      });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
