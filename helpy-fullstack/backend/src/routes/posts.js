import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { Post, Topic, User } from '../db/models/index.js';
import { auth, restrictToRoles } from '../middleware/auth.js';

const router = Router();
// Allow authenticated support roles and customers
router.use(auth, restrictToRoles('Super Admin', 'Admin', 'Manager', 'Agent', 'Light Agent', 'Customer'));

// POST /api/posts
router.post(
  '/',
  body('topicId').isInt(),
  body('body').trim().notEmpty(),
  body('kind').isIn(['reply', 'note']),
  body('cc').optional().trim(),
  body('bcc').optional().trim(),
  async (req, res, next) => {
    const err = validationResult(req);
    if (!err.isEmpty()) return res.status(400).json({ error: err.array()[0].msg });
    try {
      const topic = await Topic.findByPk(req.body.topicId);
      if (!topic) return res.status(404).json({ error: 'Topic not found' });

      const role = req.user.role;

      // Customer restrictions:
      // 1. Can only post to their own tickets
      // 2. Can only send 'reply' kind (no internal notes)
      if (role === 'Customer') {
        if (topic.userId !== req.user.id) {
          return res.status(403).json({ error: 'You can only reply to your own tickets.' });
        }
        if (req.body.kind !== 'reply') {
          return res.status(403).json({ error: 'Customers can only send replies.' });
        }
      }

      // Light Agent restrictions:
      if (role === 'Light Agent' && req.body.kind === 'reply') {
        return res.status(403).json({ error: 'Light Agent can only add internal notes.' });
      }

      const p = await Post.create({
        topicId: req.body.topicId,
        userId: req.user.id,
        body: req.body.body,
        kind: req.body.kind,
        cc: req.body.cc,
        bcc: req.body.bcc,
      });
      const withUser = await Post.findByPk(p.id, { include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }] });
      res.status(201).json(withUser);
    } catch (e) {
      next(e);
    }
  }
);

// PATCH /api/posts/:id
router.patch(
  '/:id',
  param('id').isInt(),
  body('body').optional().trim().notEmpty(),
  body('active').optional().isBoolean(),
  async (req, res, next) => {
    const err = validationResult(req);
    if (!err.isEmpty()) return res.status(400).json({ error: 'Invalid id' });
    try {
      const p = await Post.findByPk(req.params.id);
      if (!p) return res.status(404).json({ error: 'Post not found' });
      if (req.body.body != null) p.body = req.body.body;
      if (req.body.active !== undefined) p.active = req.body.active;
      await p.save();
      res.json(p);
    } catch (e) {
      next(e);
    }
  }
);

export default router;
