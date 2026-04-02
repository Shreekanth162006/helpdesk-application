import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { sequelize } from './db/sequelize.js';
import './db/models/index.js'; // init models & associations
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import categoriesRoutes from './routes/categories.js';
import docsRoutes from './routes/docs.js';
import forumsRoutes from './routes/forums.js';
import topicsRoutes from './routes/topics.js';
import postsRoutes from './routes/posts.js';
import searchRoutes from './routes/search.js';
import uploadRoutes from './routes/upload.js';
import notificationsRoutes from './routes/notifications.js';
import analyticsRoutes from './routes/analytics.js';
import { errorHandler } from './middleware/errorHandler.js';
import { ensureUploadDir } from './middleware/upload.js';
import { startSlaService } from './services/slaService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

// Ensure upload directory exists
ensureUploadDir();

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files publicly
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health
app.get('/api/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// REST API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/docs', docsRoutes);
app.use('/api/forums', forumsRoutes);
app.use('/api/topics', topicsRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Error handler
app.use(errorHandler);

async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    startSlaService();
  } catch (e) {
    console.error('DB error:', e.message);
    process.exit(1);
  }
  app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
}

start();
