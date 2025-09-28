import express from 'express';
import fs from 'fs';
import path from 'path';
import url from 'url';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './lib/db.js';
import jobsRouter from './routes/jobs.js';
import employersRouter from './routes/employers.js';
import usersRouter from './routes/users.js';
import applicationsRouter from './routes/applications.js';
import externalJobsRouter from './routes/externalJobs.js';
import externalApplicationsRouter from './routes/externalApplications.js';
import unifiedJobsRouter from './routes/unifiedJobs.js';
import adminRouter from './routes/admin.js';
import authRouter from './routes/auth.js';
import { requireAuth } from './middleware/requireAuth.js';
import scheduledJobs from './services/scheduledJobs.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
// Static serving for uploaded files
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));
app.use('/api/jobs', jobsRouter);
app.use('/api/employers', employersRouter);
app.use('/api/users', usersRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/external-jobs', externalJobsRouter);
app.use('/api/external-applications', externalApplicationsRouter);
app.use('/api/unified-jobs', unifiedJobsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/auth', authRouter);

// Example protected route
app.get('/api/me', requireAuth, (req, res) => {
  res.json({ me: req.user });
});

app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT 1 as ok');
    res.json({ status: 'ok', db: result.rows[0].ok === 1 });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// Database test endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    // Test basic connection
    const basicTest = await pool.query('SELECT 1 as ok');
    
    // Test if tables exist
    const tablesTest = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    // Test if we can insert/select data
    const insertTest = await pool.query('SELECT NOW() as current_time');
    
    res.json({
      status: 'Database connection successful!',
      basic_connection: basicTest.rows[0].ok === 1,
      tables_found: tablesTest.rows.map(row => row.table_name),
      current_time: insertTest.rows[0].current_time,
      connection_info: {
        host: pool.options.host || 'from_connection_string',
        port: pool.options.port || 'from_connection_string',
        database: pool.options.database || 'from_connection_string',
        user: pool.options.user || 'from_connection_string'
      }
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'Database connection failed!',
      error: err.message,
      troubleshooting: [
        'Check if PostgreSQL is running',
        'Verify your .env file has correct DATABASE_URL',
        'Ensure database "jobportal" exists',
        'Check database credentials'
      ]
    });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
  
  // Start scheduled job scraping
  if (process.env.NODE_ENV === 'production') {
    scheduledJobs.start();
  } else {
    console.log('Scheduled jobs disabled in development mode');
  }
});


