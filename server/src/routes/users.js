import { Router } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../lib/db.js';

const router = Router();

router.get('/', async (req, res) => {
  const { rows } = await pool.query('SELECT id, full_name, email, created_at FROM users ORDER BY created_at DESC');
  res.json(rows);
});

router.post('/', async (req, res) => {
  try {
    const { full_name, email, password } = req.body;
    if (!full_name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
    const password_hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (full_name, email, password_hash)
       VALUES ($1,$2,$3) RETURNING id, full_name, email, created_at`,
      [full_name, email, password_hash]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;


