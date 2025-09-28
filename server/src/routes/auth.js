import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../lib/db.js';
import crypto from 'crypto';

const router = Router();

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// User register
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, password } = req.body;
    if (!full_name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

    const existing = await pool.query('SELECT 1 FROM users WHERE email=$1', [email]);
    if (existing.rowCount) return res.status(409).json({ error: 'Email already exists' });

    const password_hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, verified)
       VALUES ($1,$2,$3,false) RETURNING id, full_name, email, created_at, verified`,
      [full_name, email, password_hash]
    );

    const user = rows[0];
    const verifyToken = signToken({ sub: user.id, email: user.email, action: 'verify' });
    // In a real app, send email. For now, return link for testing.
    const verifyLink = `${process.env.APP_ORIGIN || 'http://localhost:4000'}/api/auth/verify?token=${verifyToken}`;
    res.status(201).json({ user, verify_link: verifyLink });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = rows[0];

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.verified) return res.status(403).json({ error: 'Please verify your email first' });

    const safeUser = { id: user.id, full_name: user.full_name, email: user.email, created_at: user.created_at };
    const token = signToken({ sub: user.id, email: user.email, role: 'user' });
    res.json({ user: safeUser, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify email
router.get('/verify', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Missing token' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.action !== 'verify') return res.status(400).json({ error: 'Invalid token action' });
    await pool.query('UPDATE users SET verified=true WHERE id=$1', [payload.sub]);
    res.json({ message: 'Email verified. You can now login.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
 
// ---------------- Employer auth ----------------
router.post('/employer/register', async (req, res) => {
  try {
    const { company_name, email, password } = req.body;
    if (!company_name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

    const exists = await pool.query('SELECT 1 FROM employers WHERE email=$1', [email]);
    if (exists.rowCount) return res.status(409).json({ error: 'Email already exists' });

    const password_hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO employers (company_name, email, password_hash)
       VALUES ($1,$2,$3) RETURNING id, company_name, email, created_at`,
      [company_name, email, password_hash]
    );
    const employer = rows[0];
    const token = signToken({ sub: employer.id, email: employer.email, role: 'employer' });
    res.status(201).json({ employer, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/employer/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
    const { rows } = await pool.query('SELECT * FROM employers WHERE email=$1', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const employer = rows[0];
    const ok = await bcrypt.compare(password, employer.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const safe = { id: employer.id, company_name: employer.company_name, email: employer.email, created_at: employer.created_at };
    const token = signToken({ sub: employer.id, email: employer.email, role: 'employer' });
    res.json({ employer: safe, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


