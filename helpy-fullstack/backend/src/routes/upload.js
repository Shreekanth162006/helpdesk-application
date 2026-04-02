import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import { auth } from '../middleware/auth.js';

const router = Router();
router.use(auth);

// POST /api/upload - upload a file
router.post('/', upload.single('file'), (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({
    filename: req.file.filename,
    originalName: req.file.originalname,
    path: `/uploads/${req.file.filename}`,
    size: req.file.size,
  });
});

export default router;
