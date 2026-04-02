import jwt from 'jsonwebtoken';
import { User } from '../db/models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

/**
 * Verify JWT from Authorization: Bearer <token> or cookie, attach req.user.
 */
export async function auth(req, res, next) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.token || req.query?.token;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized. Invalid or expired token.' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Unauthorized. Invalid or expired token.' });
    }
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized. Invalid or expired token.' });
  }
}

/**
 * Require one of the given roles (Super Admin, Admin, Manager, Agent, Customer).
 */
export function restrictToRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized.' });
    if (roles.includes(req.user.role)) return next();
    return res.status(403).json({ error: 'Insufficient access privileges.' });
  };
}

/**
 * Optional auth: attach user if token present, else continue without.
 */
export async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.token;
    if (!token) return next();
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    if (user && user.active) req.user = user;
  } catch (_) {}
  next();
}
