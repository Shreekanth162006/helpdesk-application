import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { User } from '../db/models/User.js';
import { auth, restrictToRoles } from '../middleware/auth.js';
import { Notification } from '../db/models/index.js';
import crypto from 'crypto';

const router = Router();
router.use(auth);

// GET /api/users — list (Admin/Super Admin only)
router.get('/', restrictToRoles('Super Admin', 'Admin'), async (req, res, next) => {
  try {
    const users = await User.findAll({ order: [['id', 'ASC']], attributes: { exclude: ['password'] } });
    res.json(users);
  } catch (e) {
    next(e);
  }
});

// GET /api/users/self — current user
router.get('/self', (req, res) => res.json(req.user.toJSON()));

// GET /api/users/search?q=
router.get('/search', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json([]);
    const users = await User.findAll({
      where: {
        [Op.or]: [
          { email: { [Op.iLike]: `%${q}%` } },
          { name: { [Op.iLike]: `%${q}%` } },
        ],
      },
      limit: 20,
      attributes: { exclude: ['password'] },
    });
    res.json(users);
  } catch (e) {
    next(e);
  }
});

// GET /api/users/:id
router.get('/:id', param('id').isInt(), async (req, res, next) => {
  const err = validationResult(req);
  if (!err.isEmpty()) return res.status(400).json({ error: 'Invalid id' });
  try {
    const u = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
    if (!u) return res.status(404).json({ error: 'User not found' });
    res.json(u);
  } catch (e) {
    next(e);
  }
});

// Helper function to generate secure random password
function generateSecurePassword(length = 12) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const randomBytes = crypto.randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  return password;
}

// POST /api/users — create (Admin/Super Admin only)
router.post(
  '/',
  restrictToRoles('Super Admin', 'Admin'),
  body('email').isEmail().normalizeEmail(),
  body('password').optional().isLength({ min: 6 }),
  body('name').trim().notEmpty(),
  body('role').isIn(['Super Admin', 'Admin', 'Manager', 'Agent', 'Light Agent', 'Customer']),
  async (req, res, next) => {
    const err = validationResult(req);
    if (!err.isEmpty()) return res.status(400).json({ error: err.array()[0].msg });
    try {
      const { email, password, name, role } = req.body;
      const exists = await User.findOne({ where: { email } });
      if (exists) return res.status(400).json({ error: 'Email already registered' });
      
      // Determine if this is an official role
      const isOfficialRole = ['Super Admin', 'Admin', 'Manager', 'Agent', 'Light Agent'].includes(role);
      
      // For official roles: generate secure password if not provided
      // For customers: use provided password or default
      let userPassword;
      if (isOfficialRole) {
        // Official users should have auto-generated secure passwords
        userPassword = password || generateSecurePassword();
      } else {
        // Customer users can have provided password or default
        userPassword = password || '123456';
      }
      
      const user = await User.create({
        email,
        password: userPassword,
        name,
        role,
        approvalStatus: 'approved', // Admin-created accounts are auto-approved
      });
      
      // In-app notification for default Super Admin when an official account is created
      if (isOfficialRole) {
        try {
          const defaultSAEmail = process.env.DEFAULT_SA_EMAIL || 'admin@helpy.local';
          const sa = await User.findOne({ where: { email: defaultSAEmail } });
          if (sa) {
            await Notification.create({
              userId: sa.id,
              kind: 'info',
              title: 'Official account created',
              message: `New official user created: ${user.name} (${user.email}) — role: ${user.role}. Created by: ${req.user.name || req.user.email}.`,
            });
          }
        } catch (notifyErr) {
          // Don't block user creation if notification fails
          console.error('Notification error:', notifyErr);
        }
      }
      
      res.status(201).json(user.toJSON());
    } catch (e) {
      next(e);
    }
  }
);

// PATCH /api/users/:id (Admin/Super Admin only)
router.patch(
  '/:id',
  restrictToRoles('Super Admin', 'Admin'),
  param('id').isInt(),
  body('email').optional().isEmail().normalizeEmail(),
  body('password').optional().isLength({ min: 6 }),
  body('name').optional().trim().notEmpty(),
  body('role').optional().isIn(['Super Admin', 'Admin', 'Manager', 'Agent', 'Light Agent', 'Customer']),
  body('active').optional().isBoolean(),
  async (req, res, next) => {
    const err = validationResult(req);
    if (!err.isEmpty()) return res.status(400).json({ error: err.array()[0].msg });
    try {
      const u = await User.findByPk(req.params.id);
      if (!u) return res.status(404).json({ error: 'User not found' });
      const { email, password, name, role, active } = req.body;
      if (email != null) u.email = email;
      if (password) u.password = password;
      if (name != null) u.name = name;
      if (role != null) u.role = role;
      if (active != null) u.active = active;
      await u.save();
      res.json(u.toJSON());
    } catch (e) {
      next(e);
    }
  }
);

// POST /api/users/:id/reset-password (Admin/Super Admin only)
router.post(
  '/:id/reset-password',
  restrictToRoles('Super Admin', 'Admin'),
  param('id').isInt(),
  async (req, res, next) => {
    const err = validationResult(req);
    if (!err.isEmpty()) return res.status(400).json({ error: 'Invalid id' });
    try {
      const u = await User.findByPk(req.params.id);
      if (!u) return res.status(404).json({ error: 'User not found' });
      u.password = '123456';
      await u.save();
      res.json({ message: 'Password reset to 123456', user: u.toJSON() });
    } catch (e) {
      next(e);
    }
  }
);

// POST /api/users/:id/approve — Super Admin only; approve pending account
router.post(
  '/:id/approve',
  restrictToRoles('Super Admin'),
  param('id').isInt(),
  async (req, res, next) => {
    const err = validationResult(req);
    if (!err.isEmpty()) return res.status(400).json({ error: 'Invalid id' });
    try {
      const u = await User.findByPk(req.params.id);
      if (!u) return res.status(404).json({ error: 'User not found' });
      if (u.approvalStatus !== 'pending') {
        return res.status(400).json({ error: 'Account is not pending approval' });
      }
      u.approvalStatus = 'approved';
      u.active = true;
      await u.save();
      res.json({ message: 'Account approved successfully', user: u.toJSON() });
    } catch (e) {
      next(e);
    }
  }
);

// POST /api/users/:id/reject — Super Admin only; reject pending account
router.post(
  '/:id/reject',
  restrictToRoles('Super Admin'),
  param('id').isInt(),
  async (req, res, next) => {
    const err = validationResult(req);
    if (!err.isEmpty()) return res.status(400).json({ error: 'Invalid id' });
    try {
      const u = await User.findByPk(req.params.id);
      if (!u) return res.status(404).json({ error: 'User not found' });
      if (u.approvalStatus !== 'pending') {
        return res.status(400).json({ error: 'Account is not pending approval' });
      }
      u.approvalStatus = 'rejected';
      u.active = false;
      await u.save();
      res.json({ message: 'Account rejected', user: u.toJSON() });
    } catch (e) {
      next(e);
    }
  }
);

// DELETE /api/users/:id (Admin/Super Admin only)
router.delete('/:id', restrictToRoles('Super Admin', 'Admin'), param('id').isInt(), async (req, res, next) => {
  const err = validationResult(req);
  if (!err.isEmpty()) return res.status(400).json({ error: 'Invalid id' });
  try {
    const u = await User.findByPk(req.params.id);
    if (!u) return res.status(404).json({ error: 'User not found' });
    await u.destroy();
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
