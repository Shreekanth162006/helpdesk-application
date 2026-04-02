import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { Topic, Post, User, Forum, Notification } from '../db/models/index.js';
import { auth, restrictToRoles } from '../middleware/auth.js';

const router = Router();

// PRD Module 5: SLA mapping by priority (response hours, resolution hours)
const SLA_HOURS = {
  CRITICAL: { response: 1, resolution: 4 },
  HIGH: { response: 4, resolution: 8 },
  MEDIUM: { response: 24, resolution: 72 },
  LOW: { response: 72, resolution: 168 },
};

function addSlaDueDates(priority) {
  const hours = SLA_HOURS[priority] || SLA_HOURS.LOW;
  const now = new Date();
  return {
    responseDueAt: new Date(now.getTime() + hours.response * 60 * 60 * 1000),
    resolutionDueAt: new Date(now.getTime() + hours.resolution * 60 * 60 * 1000),
  };
}

function attachSlaBreach(items) {
  const now = new Date();
  const closedStatuses = ['Resolved', 'Closed'];
  return items.map((t) => {
    const topic = t.toJSON ? t.toJSON() : t;
    const resolutionDueAt = topic.resolutionDueAt || t.resolutionDueAt;
    topic.isSlaBreached =
      resolutionDueAt && new Date(resolutionDueAt) < now && !closedStatuses.includes(topic.currentStatus);
    return topic;
  });
}

// Helper to include relations
const topicInclude = [
  {
    model: Post,
    as: 'posts',
    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
  },
  { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
  { model: User, as: 'assignedUser', attributes: ['id', 'name', 'email'], required: false },
  { model: Forum, as: 'forum' },
];

// GET /api/topics — list by status (for tickets, forum_id=1 is conventional “private”)
router.get('/', auth, async (req, res, next) => {
  try {
    const { status, priority, search, forum_id } = req.query;
    const where = {};
    if (req.user.role === 'Customer') {
      where.userId = req.user.id;
    }
    if (status && status !== 'ALL') where.currentStatus = status;
    if (priority && priority !== 'ALL') where.priority = priority;
    if (forum_id) where.forumId = forum_id;
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }
    const topics = await Topic.findAll({
      where,
      include: topicInclude,
      order: [['updatedAt', 'DESC']],
      limit: Math.min(parseInt(req.query.limit || '50', 10), 100),
    });
    res.json(attachSlaBreach(topics));
  } catch (e) {
    next(e);
  }
});

// GET /api/topics/:id
router.get('/:id', auth, param('id').isInt(), async (req, res, next) => {
  const err = validationResult(req);
  if (!err.isEmpty()) return res.status(400).json({ error: 'Invalid id' });
  try {
    const t = await Topic.findByPk(req.params.id, { include: topicInclude });
    if (!t) return res.status(404).json({ error: 'Topic not found' });
    res.json(attachSlaBreach([t])[0]);
  } catch (e) {
    next(e);
  }
});

// POST /api/topics — create ticket or discussion
router.post(
  '/',
  auth,
  body('name').trim().notEmpty(),
  body('body').trim().notEmpty(),
  body('forumId').optional().isInt(),
  body('userId').optional().isInt(),
  body('private').optional().isBoolean(),
  body('kind').optional().isIn(['ticket', 'discussion', 'chat']),
  body('channel').optional().trim(),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  body('department').optional().isIn(['IT', 'HR', 'Finance', 'Support']),
  body('attachment').optional().trim(),
  async (req, res, next) => {
    const err = validationResult(req);
    if (!err.isEmpty()) return res.status(400).json({ error: err.array()[0].msg });
    try {
      const userId = req.body.userId ?? req.user.id;
      const priority = req.body.priority || 'LOW';
      const sla = addSlaDueDates(priority);
      const t = await Topic.create({
        forumId: req.body.forumId || 1, // default to forum 1 for tickets
        userId,
        name: req.body.name,
        private: req.body.private ?? false,
        kind: req.body.kind || 'ticket',
        channel: req.body.channel || 'api',
        priority,
        department: req.body.department || 'IT',
        attachment: req.body.attachment || null,
        currentStatus: 'Open',
        responseDueAt: sla.responseDueAt,
        resolutionDueAt: sla.resolutionDueAt,
      });
      await Post.create({
        topicId: t.id,
        userId,
        body: req.body.body,
        kind: 'first',
      });
      const updated = await Topic.findByPk(t.id, { include: topicInclude });
      res.status(201).json(attachSlaBreach([updated])[0]);
    } catch (e) {
      next(e);
    }
  }
);

// PATCH /api/topics/:id
router.patch(
  '/:id',
  auth,
  param('id').isInt(),
  body('currentStatus').optional().isIn(['new', 'open', 'In Progress', 'Waiting for Customer', 'Resolved', 'Closed', 'trash', 'Customer Cancelled']),
  body('assignedUserId').optional().isInt(),
  body('forumId').optional().isInt(),
  body('private').optional().isBoolean(),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  body('department').optional().isIn(['IT', 'HR', 'Finance', 'Support']),
  async (req, res, next) => {
    const err = validationResult(req);
    if (!err.isEmpty()) return res.status(400).json({ error: 'Invalid id' });
    try {
      const t = await Topic.findByPk(req.params.id);
      if (!t) return res.status(404).json({ error: 'Topic not found' });

      // Customer specific restrictions
      if (req.user.role === 'Customer') {
        if (t.userId !== req.user.id) {
          return res.status(403).json({ error: 'You can only edit your own tickets.' });
        }
        // Customers can ONLY change status to 'Customer Cancelled'
        const forbiddenKeys = ['assignedUserId', 'forumId', 'private', 'priority', 'department'];
        const isTryingForbidden = forbiddenKeys.some(k => req.body[k] !== undefined);
        if (isTryingForbidden || (req.body.currentStatus && req.body.currentStatus !== 'Customer Cancelled')) {
          return res.status(403).json({ error: 'Customers can only cancel their own tickets.' });
        }
      }

      const { currentStatus, assignedUserId, forumId, private: p, priority, department } = req.body;

      // Track changes for notifications
      const statusChanged = currentStatus != null && currentStatus !== t.currentStatus;
      const assignmentChanged = assignedUserId !== undefined && assignedUserId !== t.assignedUserId;

      if (currentStatus != null) t.currentStatus = currentStatus;
      if (assignedUserId !== undefined) t.assignedUserId = assignedUserId;
      if (forumId !== undefined) t.forumId = forumId;
      if (p !== undefined) t.private = p;
      if (priority !== undefined) t.priority = priority;
      if (department !== undefined) t.department = department;
      await t.save();

      // Trigger notifications for customer
      if (statusChanged) {
        await Notification.create({
          userId: t.userId,
          title: 'Ticket Status Updated',
          message: `Your ticket "${t.name}" status has been changed to ${t.currentStatus}.`,
          kind: 'info'
        }).catch(err => console.error('Notification error (status):', err));
      }

      if (assignmentChanged && t.assignedUserId) {
        const agent = await User.findByPk(t.assignedUserId, { attributes: ['name', 'role'] });
        await Notification.create({
          userId: t.userId,
          title: 'Ticket Assigned',
          message: `Your ticket "${t.name}" has been assigned to ${agent?.name || 'an agent'} (${agent?.role || 'Agent'}).`,
          kind: 'info'
        }).catch(err => console.error('Notification error (assignment):', err));
      }

      const updated = await Topic.findByPk(t.id, { include: topicInclude });
      res.json(attachSlaBreach([updated])[0]);
    } catch (e) {
      next(e);
    }
  }
);

export default router;
