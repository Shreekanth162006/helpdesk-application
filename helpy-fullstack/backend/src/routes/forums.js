import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { Forum, Topic } from '../db/models/index.js';
import { auth, restrictToRoles } from '../middleware/auth.js';

const router = Router();
router.use(auth, restrictToRoles('admin', 'agent'));

// GET /api/forums
router.get('/', async (req, res, next) => {
  try {
    const forums = await Forum.findAll({ order: [['id', 'ASC']] });
    res.json(forums);
  } catch (e) {
    next(e);
  }
});

// GET /api/forums/:id
router.get('/:id', param('id').isInt(), async (req, res, next) => {
  const err = validationResult(req);
  if (!err.isEmpty()) return res.status(400).json({ error: 'Invalid id' });
  try {
    const limit = parseInt(req.query.topics_limit || '20', 10);
    const f = await Forum.findByPk(req.params.id, {
      include: [{ model: Topic, as: 'topics', limit, order: [['lastPostDate', 'DESC']] }],
    });
    if (!f) return res.status(404).json({ error: 'Forum not found' });
    res.json(f);
  } catch (e) {
    next(e);
  }
});

// POST /api/forums
router.post(
  '/',
  body('name').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('allowTopicVoting').optional().isBoolean(),
  body('allowPostVoting').optional().isBoolean(),
  body('layout').optional().trim(),
  async (req, res, next) => {
    const err = validationResult(req);
    if (!err.isEmpty()) return res.status(400).json({ error: err.array()[0].msg });
    try {
      const f = await Forum.create({
        name: req.body.name,
        description: req.body.description,
        allowTopicVoting: req.body.allowTopicVoting ?? false,
        allowPostVoting: req.body.allowPostVoting ?? false,
        layout: req.body.layout || 'table',
      });
      res.status(201).json(f);
    } catch (e) {
      next(e);
    }
  }
);

// PATCH /api/forums/:id
router.patch(
  '/:id',
  param('id').isInt(),
  body('name').optional().trim().notEmpty(),
  body('description').optional().trim().notEmpty(),
  body('allowTopicVoting').optional().isBoolean(),
  body('allowPostVoting').optional().isBoolean(),
  body('layout').optional().trim(),
  async (req, res, next) => {
    const err = validationResult(req);
    if (!err.isEmpty()) return res.status(400).json({ error: 'Invalid id' });
    try {
      const f = await Forum.findByPk(req.params.id);
      if (!f) return res.status(404).json({ error: 'Forum not found' });
      const { name, description, allowTopicVoting, allowPostVoting, layout } = req.body;
      if (name != null) f.name = name;
      if (description != null) f.description = description;
      if (allowTopicVoting !== undefined) f.allowTopicVoting = allowTopicVoting;
      if (allowPostVoting !== undefined) f.allowPostVoting = allowPostVoting;
      if (layout !== undefined) f.layout = layout;
      await f.save();
      res.json(f);
    } catch (e) {
      next(e);
    }
  }
);

export default router;
