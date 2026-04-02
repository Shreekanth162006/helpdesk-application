import { Router } from 'express';
import { Op } from 'sequelize';
import { Doc, Topic, Category, User } from '../db/models/index.js';
import { auth } from '../middleware/auth.js';

const router = Router();
router.use(auth);

// GET /api/search?q=...&type=Doc|Topic&page=1&per_page=25
router.get('/', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    const type = (req.query.type || '').toLowerCase();
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const perPage = Math.min(50, Math.max(1, parseInt(req.query.per_page || '25', 10)));
    const offset = (page - 1) * perPage;

    if (!q) {
      return res.json({ results: [], pages: { page, per_page: perPage, total_pages: 0 } });
    }

    const like = { [Op.iLike]: `%${q}%` };
    let results = [];
    let total = 0;

    if (type === 'doc' || !type) {
      const { rows, count } = await Doc.findAndCountAll({
        where: { active: true, [Op.or]: [{ title: like }, { body: like }, { keywords: like }] },
        include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
        limit: perPage,
        offset: type === 'doc' ? offset : 0,
      });
      if (!type) {
        results = rows.map((r) => ({ type: 'Doc', ...r.toJSON() }));
        total = count;
      } else {
        results = rows;
        total = count;
      }
    }

    if (type === 'topic' || !type) {
      const { rows, count } = await Topic.findAndCountAll({
        where: { [Op.or]: [{ name: like }] },
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
        limit: perPage,
        offset: type === 'topic' ? offset : 0,
      });
      if (!type) {
        results = [...results, ...rows.map((r) => ({ type: 'Topic', ...r.toJSON() }))];
        total = total + count;
      } else {
        results = rows;
        total = count;
      }
    }

    const totalPages = Math.ceil(total / perPage) || 1;
    res.json({
      results,
      pages: { page, per_page: perPage, total_pages: totalPages },
    });
  } catch (e) {
    next(e);
  }
});

export default router;
