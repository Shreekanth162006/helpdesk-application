import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { Category, Doc } from '../db/models/index.js';
import { auth, restrictToRoles } from '../middleware/auth.js';

const router = Router();
router.use(auth);

// GET /api/categories — all authenticated users
router.get('/', async (req, res, next) => {
  try {
    const includeDocs = req.query.docs === 'true';
    const limit = parseInt(req.query.docs_limit || '10', 10);
    const vis = req.query.visibility || 'all';
    const where = vis !== 'all' ? { visibility: vis } : {};
    const categories = await Category.findAll({
      where: { ...where, active: true },
      order: [['rank', 'ASC'], ['id', 'ASC']],
      include: includeDocs ? [{ model: Doc, as: 'docs', where: { active: true }, required: false, limit }] : [],
    });
    res.json(categories);
  } catch (e) {
    next(e);
  }
});

// GET /api/categories/:id
router.get('/:id', param('id').isInt(), async (req, res, next) => {
  const err = validationResult(req);
  if (!err.isEmpty()) return res.status(400).json({ error: 'Invalid id' });
  try {
    const c = await Category.findByPk(req.params.id, {
      include: [{ model: Doc, as: 'docs', where: { active: true }, required: false }],
    });
    if (!c) return res.status(404).json({ error: 'Category not found' });
    res.json(c);
  } catch (e) {
    next(e);
  }
});

// POST /api/categories — Admin / Super Admin only
router.post(
  '/',
  restrictToRoles('Super Admin', 'Admin'),
  body('name').trim().notEmpty(),
  body('icon').optional().trim(),
  body('keywords').optional().trim(),
  body('rank').optional().isInt(),
  body('frontPage').optional().isBoolean(),
  body('active').optional().isBoolean(),
  body('visibility').optional().isIn(['all', 'public', 'internal']),
  async (req, res, next) => {
    const err = validationResult(req);
    if (!err.isEmpty()) return res.status(400).json({ error: err.array()[0].msg });
    try {
      const c = await Category.create({
        name: req.body.name,
        icon: req.body.icon,
        keywords: req.body.keywords,
        rank: req.body.rank ?? 0,
        frontPage: req.body.frontPage ?? false,
        active: req.body.active !== false,
        visibility: req.body.visibility || 'all',
      });
      res.status(201).json(c);
    } catch (e) {
      next(e);
    }
  }
);

// PATCH /api/categories/:id — Admin / Super Admin only
router.patch(
  '/:id',
  restrictToRoles('Super Admin', 'Admin'),
  param('id').isInt(),
  body('name').optional().trim().notEmpty(),
  body('icon').optional().trim(),
  body('keywords').optional().trim(),
  body('rank').optional().isInt(),
  body('frontPage').optional().isBoolean(),
  body('active').optional().isBoolean(),
  body('visibility').optional().isIn(['all', 'public', 'internal']),
  async (req, res, next) => {
    const err = validationResult(req);
    if (!err.isEmpty()) return res.status(400).json({ error: 'Invalid id' });
    try {
      const c = await Category.findByPk(req.params.id);
      if (!c) return res.status(404).json({ error: 'Category not found' });
      const { name, icon, keywords, rank, frontPage, active, visibility } = req.body;
      if (name != null) c.name = name;
      if (icon !== undefined) c.icon = icon;
      if (keywords !== undefined) c.keywords = keywords;
      if (rank !== undefined) c.rank = rank;
      if (frontPage !== undefined) c.frontPage = frontPage;
      if (active !== undefined) c.active = active;
      if (visibility !== undefined) c.visibility = visibility;
      await c.save();
      res.json(c);
    } catch (e) {
      next(e);
    }
  }
);

export default router;
