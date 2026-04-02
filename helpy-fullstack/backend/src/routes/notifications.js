import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { auth, restrictToRoles } from '../middleware/auth.js';
import { Notification } from '../db/models/index.js';

const router = Router();
router.use(auth);

// GET /api/notifications — My notifications
router.get('/', async (req, res, next) => {
  try {
    const items = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['id', 'DESC']],
      limit: 50,
    });
    res.json(items);
  } catch (e) {
    next(e);
  }
});

// POST /api/notifications/mark-read — mark one or many as read
router.post(
  '/mark-read',
  body('ids').isArray({ min: 1 }),
  async (req, res, next) => {
    const err = validationResult(req);
    if (!err.isEmpty()) return res.status(400).json({ error: err.array()[0].msg });
    try {
      const { ids } = req.body;
      const now = new Date();
      await Notification.update(
        { readAt: now },
        { where: { id: ids, userId: req.user.id } }
      );
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  }
);

export default router;

