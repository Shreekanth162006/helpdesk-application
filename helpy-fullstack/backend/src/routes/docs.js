import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { Doc, Category, User } from '../db/models/index.js';
import { auth, restrictToRoles } from '../middleware/auth.js';

const router = Router();
router.use(auth);

// GET /api/docs/:id — all authenticated users (knowledge base)
router.get('/:id', param('id').isInt(), async (req, res, next) => {
  const err = validationResult(req);
  if (!err.isEmpty()) return res.status(400).json({ error: 'Invalid id' });
  try {
    const d = await Doc.findByPk(req.params.id, {
      include: [
        { model: Category, as: 'category' },
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
      ],
    });
    if (!d) return res.status(404).json({ error: 'Doc not found' });
    res.json(d);
  } catch (e) {
    next(e);
  }
});

// POST /api/docs — Admin / Agent / Manager / Super Admin only
router.post(
  '/',
  restrictToRoles('Super Admin', 'Admin', 'Manager', 'Agent'),
  body('title').trim().notEmpty(),
  body('body').trim().notEmpty(),
  body('categoryId').isInt(),
  body('keywords').optional().trim(),
  body('rank').optional().isInt(),
  body('frontPage').optional().isBoolean(),
  body('active').optional().isBoolean(),
  async (req, res, next) => {
    const err = validationResult(req);
    if (!err.isEmpty()) return res.status(400).json({ error: err.array()[0].msg });
    try {
      const d = await Doc.create({
        title: req.body.title,
        body: req.body.body,
        categoryId: req.body.categoryId,
        userId: req.user.id,
        keywords: req.body.keywords,
        rank: req.body.rank ?? 0,
        frontPage: req.body.frontPage ?? false,
        active: req.body.active !== false,
      });
      res.status(201).json(d);
    } catch (e) {
      next(e);
    }
  }
);

// PATCH /api/docs/:id — Admin / Agent / Manager / Super Admin only
router.patch(
  '/:id',
  restrictToRoles('Super Admin', 'Admin', 'Manager', 'Agent'),
  param('id').isInt(),
  body('title').optional().trim().notEmpty(),
  body('body').optional().trim().notEmpty(),
  body('categoryId').optional().isInt(),
  body('keywords').optional().trim(),
  body('rank').optional().isInt(),
  body('frontPage').optional().isBoolean(),
  body('active').optional().isBoolean(),
  async (req, res, next) => {
    const err = validationResult(req);
    if (!err.isEmpty()) return res.status(400).json({ error: 'Invalid id' });
    try {
      const d = await Doc.findByPk(req.params.id);
      if (!d) return res.status(404).json({ error: 'Doc not found' });
      const { title, body, categoryId, keywords, rank, frontPage, active } = req.body;
      if (title != null) d.title = title;
      if (body != null) d.body = body;
      if (categoryId != null) d.categoryId = categoryId;
      if (keywords !== undefined) d.keywords = keywords;
      if (rank !== undefined) d.rank = rank;
      if (frontPage !== undefined) d.frontPage = frontPage;
      if (active !== undefined) d.active = active;
      await d.save();
      res.json(d);
    } catch (e) {
      next(e);
    }
  }
);

export default router;
