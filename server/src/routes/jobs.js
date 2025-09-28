import { Router } from 'express';
import { pool } from '../lib/db.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM jobs ORDER BY created_at DESC');
  res.json(rows);
});

// Only employers can create jobs
router.post('/', requireAuth, async (req, res) => {
  if (req.user?.role !== 'employer') return res.status(403).json({ error: 'Employer token required' });
  const { employer_id, title, description, location, employment_type } = req.body;
  if (!employer_id || !title || !description) return res.status(400).json({ error: 'Missing fields' });
  const { rows } = await pool.query(
    `INSERT INTO jobs (employer_id, title, description, location, employment_type)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [employer_id, title, description, location || null, employment_type || null]
  );
  res.status(201).json(rows[0]);
});

export default router;


