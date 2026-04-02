import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { body, query, validationResult } from 'express-validator';
import { User } from '../db/models/User.js';
import { Notification } from '../db/models/Notification.js';
import { PasswordResetRequest } from '../db/models/PasswordResetRequest.js';
import { auth, restrictToRoles } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

function signToken(user, expiresIn = JWT_EXPIRES) {
  return jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn });
}

// POST /api/auth/register (Customer registration only)
router.post(
  '/register',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty(),
  async (req, res) => {
    const err = validationResult(req);
    if (!err.isEmpty()) return res.status(400).json({ error: err.array()[0].msg });
    const { email, password, name } = req.body;
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(400).json({ error: 'Email already registered' });
    // Only allow Customer registration through this endpoint
    const user = await User.create({ email, password, name, role: 'Customer', approvalStatus: 'approved' });
    const token = signToken(user);
    const refresh = signToken(user, JWT_REFRESH_EXPIRES);
    res.status(201).json({ user: user.toJSON(), token, refreshToken: refresh, expiresIn: JWT_EXPIRES });
  }
);

// POST /api/auth/register-official — Official account creation (requires approval)
router.post(
  '/register-official',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty(),
  body('role').isIn(['Super Admin', 'Admin', 'Manager', 'Agent', 'Light Agent']),
  async (req, res) => {
    const err = validationResult(req);
    if (!err.isEmpty()) return res.status(400).json({ error: err.array()[0].msg });
    const { email, password, name, role } = req.body;
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(400).json({ error: 'Email already registered' });
    // Create account with pending approval
    const user = await User.create({
      email,
      password,
      name,
      role,
      approvalStatus: 'pending',
      active: false, // Inactive until approved
    });
    // Notify all Super Admins
    const superAdmins = await User.findAll({ where: { role: 'Super Admin', approvalStatus: 'approved' }, attributes: ['id'] });
    const title = 'New account approval required';
    const message = `New official account created: ${name} (${email}) — role: ${role}. Please approve or reject in User Management.`;
    for (const sa of superAdmins) {
      await Notification.create({
        userId: sa.id,
        title,
        message,
        kind: 'warning',
      });
    }
    res.status(201).json({
      user: user.toJSON(),
      message: 'Account created. Waiting for super admin approval. You will be notified once approved.',
    });
  }
);

// POST /api/auth/login
router.post(
  '/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  body('role').optional().isIn(['Super Admin', 'Admin', 'Manager', 'Agent', 'Light Agent', 'Customer']),
  async (req, res) => {
    const err = validationResult(req);
    if (!err.isEmpty()) return res.status(400).json({ error: err.array()[0].msg });
    const { email, password, role } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    if (role && user.role !== role) {
      return res.status(403).json({ error: 'Role mismatch' });
    }
    // Check approval status for official accounts
    if (user.role !== 'Customer' && user.approvalStatus === 'pending') {
      return res.status(403).json({ error: 'Account pending approval. Please wait for super admin approval.' });
    }
    if (user.role !== 'Customer' && user.approvalStatus === 'rejected') {
      return res.status(403).json({ error: 'Account registration was rejected. Please contact administrator.' });
    }
    if (!user.active) return res.status(403).json({ error: 'Account is deactivated' });
    const token = signToken(user);
    const refreshToken = signToken(user, JWT_REFRESH_EXPIRES);
    res.json({ user: user.toJSON(), token, refreshToken, expiresIn: JWT_EXPIRES });
  }
);

// POST /api/auth/request-reset-password — user enters email; verify exists, fetch role, create pending request, notify super admins
router.post(
  '/request-reset-password',
  body('email').isEmail().normalizeEmail(),
  async (req, res) => {
    const err = validationResult(req);
    if (!err.isEmpty()) return res.status(400).json({ error: err.array()[0].msg });
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const role = user.role;
    const request = await PasswordResetRequest.create({
      userId: user.id,
      email: user.email,
      role,
      status: 'pending',
    });
    const superAdmins = await User.findAll({ where: { role: 'Super Admin' }, attributes: ['id'] });
    const title = 'Password reset approval';
    const message = `${user.name || user.email} (${user.email}) — role: ${role} — requested a password reset. Please approve or reject in User Management.`;
    for (const sa of superAdmins) {
      await Notification.create({
        userId: sa.id,
        title,
        message,
        kind: 'warning',
      });
    }
    res.status(201).json({
      requestId: request.id,
      email: user.email,
      role,
      message: 'Request sent. Wait for super admin approval before you can set a new password.',
    });
  }
);

// GET /api/auth/reset-password-status?email= — check if reset request for this email is approved (no auth)
router.get(
  '/reset-password-status',
  query('email').isEmail().normalizeEmail(),
  async (req, res) => {
    const err = validationResult(req);
    if (!err.isEmpty()) return res.status(400).json({ error: err.array()[0].msg });
    const email = req.query.email;
    // Prefer an approved (not yet completed) request so user can set password
    const approvedRequest = await PasswordResetRequest.findOne({
      where: { email, status: 'approved' },
      order: [['id', 'DESC']],
    });
    if (approvedRequest) {
      return res.json({
        approved: true,
        requestId: approvedRequest.id,
        role: approvedRequest.role,
        status: approvedRequest.status,
      });
    }
    const latest = await PasswordResetRequest.findOne({
      where: { email },
      order: [['id', 'DESC']],
    });
    if (!latest) {
      return res.json({ approved: false, requestId: null, role: null, status: null });
    }
    res.json({
      approved: false,
      requestId: latest.id,
      role: latest.role,
      status: latest.status,
    });
  }
);

// GET /api/auth/pending-reset-requests — Super Admin only
router.get('/pending-reset-requests', auth, restrictToRoles('Super Admin'), async (req, res) => {
  try {
    const list = await PasswordResetRequest.findAll({
      where: { status: 'pending' },
      order: [['id', 'DESC']],
    });
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/approve-reset-password — Super Admin only; body: { requestId }
router.post(
  '/approve-reset-password',
  auth,
  restrictToRoles('Super Admin'),
  body('requestId').isInt(),
  async (req, res) => {
    const err = validationResult(req);
    if (!err.isEmpty()) return res.status(400).json({ error: err.array()[0].msg });
    const request = await PasswordResetRequest.findByPk(req.body.requestId);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request is no longer pending' });
    }
    request.status = 'approved';
    request.approvedAt = new Date();
    request.approvedBy = req.user.id;
    await request.save();
    res.json({ message: 'Password reset approved. User can now set a new password.', request: request.toJSON() });
  }
);

// POST /api/auth/reject-reset-password — Super Admin only
router.post(
  '/reject-reset-password',
  auth,
  restrictToRoles('Super Admin'),
  body('requestId').isInt(),
  async (req, res) => {
    const err = validationResult(req);
    if (!err.isEmpty()) return res.status(400).json({ error: err.array()[0].msg });
    const request = await PasswordResetRequest.findByPk(req.body.requestId);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request is no longer pending' });
    }
    request.status = 'rejected';
    await request.save();
    res.json({ message: 'Password reset rejected.', request: request.toJSON() });
  }
);

// POST /api/auth/reset-password — set new password only when request is approved
router.post(
  '/reset-password',
  body('email').isEmail().normalizeEmail(),
  body('requestId').isInt(),
  body('newPassword').isLength({ min: 6 }),
  async (req, res) => {
    const err = validationResult(req);
    if (!err.isEmpty()) return res.status(400).json({ error: err.array()[0].msg });
    const { email, requestId, newPassword } = req.body;
    const request = await PasswordResetRequest.findByPk(requestId);
    if (!request || request.email !== email) {
      return res.status(404).json({ error: 'Reset request not found' });
    }
    if (request.status !== 'approved') {
      return res.status(403).json({ error: 'Password reset not approved yet. Wait for super admin approval.' });
    }
    const user = await User.findByPk(request.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.password = newPassword;
    await user.save();
    request.status = 'completed';
    request.completedAt = new Date();
    await request.save();
    res.json({ message: 'Password reset successfully' });
  }
);

// POST /api/auth/refresh
router.post(
  '/refresh',
  body('refreshToken').notEmpty(),
  async (req, res) => {
    try {
      const { refreshToken } = req.body;
      const d = jwt.verify(refreshToken, JWT_SECRET);
      const user = await User.findByPk(d.userId);
      if (!user || !user.active) return res.status(401).json({ error: 'Invalid or expired refresh token' });
      const token = signToken(user);
      res.json({ token, expiresIn: JWT_EXPIRES });
    } catch {
      res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
  }
);

// GET /api/auth/me (current user, requires JWT)
router.get('/me', auth, (req, res) => {
  res.json(req.user.toJSON());
});

export default router;
