import { Router } from 'express';
import { pool } from '../lib/db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import multer from 'multer';
import path from 'path';
import url from 'url';
import fs from 'fs';

const router = Router();

// Multer storage setup
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsRoot)) {
  fs.mkdirSync(uploadsRoot, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsRoot),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.pdf';
    cb(null, `cv-${unique}${ext}`);
  }
});
const upload = multer({ storage });

// Public: list all applications (optionally filter by job_id)
router.get('/', async (req, res) => {
  const { job_id } = req.query;
  if (job_id) {
    const { rows } = await pool.query('SELECT * FROM applications WHERE job_id=$1 ORDER BY created_at DESC', [job_id]);
    return res.json(rows);
  }
  const { rows } = await pool.query('SELECT * FROM applications ORDER BY created_at DESC');
  res.json(rows);
});

// User: list my applications
router.get('/me', requireAuth, async (req, res) => {
  if (req.user?.role !== 'user') return res.status(403).json({ error: 'User token required' });
  const { rows } = await pool.query('SELECT * FROM applications WHERE user_id=$1 ORDER BY created_at DESC', [req.user.sub]);
  res.json(rows);
});

// Employer: list applications for my jobs
router.get('/employer', requireAuth, async (req, res) => {
  if (req.user?.role !== 'employer') return res.status(403).json({ error: 'Employer token required' });
  const { rows } = await pool.query(
    `SELECT 
       a.id,
       a.created_at,
       a.cv_url,
       a.cover_letter,
       j.id AS job_id,
       j.title AS job_title,
       u.id AS user_id,
       u.full_name AS user_name,
       u.email AS user_email
     FROM applications a
     JOIN jobs j ON j.id = a.job_id
     JOIN users u ON u.id = a.user_id
     WHERE j.employer_id = $1
     ORDER BY a.created_at DESC`,
    [req.user.sub]
  );
  res.json(rows);
});

// Only a logged-in user can apply; user_id must match token
router.post('/', requireAuth, upload.single('cv'), async (req, res) => {
  if (req.user?.role !== 'user') return res.status(403).json({ error: 'User token required' });
  const { job_id, user_id, cover_letter } = req.body;
  if (!job_id || !user_id) return res.status(400).json({ error: 'Missing fields' });
  if (Number(user_id) !== Number(req.user.sub)) return res.status(403).json({ error: 'user_id mismatch' });
  const filePath = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    const { rows } = await pool.query(
      `INSERT INTO applications (job_id, user_id, cv_url, cover_letter)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (job_id, user_id) DO NOTHING
       RETURNING *`,
      [job_id, user_id, filePath, cover_letter || null]
    );
    if (!rows.length) return res.status(409).json({ error: 'Already applied' });
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;


