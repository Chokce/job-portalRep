import { Router } from 'express';
import { pool } from '../lib/db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import jobScraper from '../services/jobScraper.js';

const router = Router();

// Get all external jobs with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      source_site,
      location,
      employment_type,
      remote_work,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE is_active = true';
    const params = [];
    let paramCount = 0;

    if (source_site) {
      paramCount++;
      whereClause += ` AND source_site = $${paramCount}`;
      params.push(source_site);
    }

    if (location) {
      paramCount++;
      whereClause += ` AND location ILIKE $${paramCount}`;
      params.push(`%${location}%`);
    }

    if (employment_type) {
      paramCount++;
      whereClause += ` AND employment_type = $${paramCount}`;
      params.push(employment_type);
    }

    if (remote_work === 'true') {
      whereClause += ` AND remote_work = true`;
    }

    if (search) {
      paramCount++;
      whereClause += ` AND (title ILIKE $${paramCount} OR description ILIKE $${paramCount} OR company_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM external_jobs ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const totalJobs = parseInt(countResult.rows[0].count);

    // Get jobs with pagination
    const jobsQuery = `
      SELECT * FROM external_jobs 
      ${whereClause}
      ORDER BY posted_date DESC, created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    params.push(limit, offset);

    const { rows } = await pool.query(jobsQuery, params);

    res.json({
      jobs: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalJobs,
        pages: Math.ceil(totalJobs / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching external jobs:', error);
    res.status(500).json({ error: 'Failed to fetch external jobs' });
  }
});

// Get external job by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'SELECT * FROM external_jobs WHERE id = $1 AND is_active = true',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'External job not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching external job:', error);
    res.status(500).json({ error: 'Failed to fetch external job' });
  }
});

// Search and scrape jobs from external sources
router.post('/search', async (req, res) => {
  try {
    const { query, location, limit = 20, sources = ['indeed', 'linkedin', 'glassdoor'] } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Scrape jobs from specified sources
    const scrapedJobs = await jobScraper.scrapeAllSources(query, location || 'remote', limit);
    
    // Save jobs to database
    const savedJobs = await jobScraper.saveJobsToDatabase(scrapedJobs);

    res.json({
      message: `Found ${scrapedJobs.length} jobs, saved ${savedJobs.length} new jobs`,
      scraped: scrapedJobs.length,
      saved: savedJobs.length,
      jobs: savedJobs
    });
  } catch (error) {
    console.error('Error searching external jobs:', error);
    res.status(500).json({ error: 'Failed to search external jobs' });
  }
});

// Get available source sites
router.get('/sources/list', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT DISTINCT source_site, COUNT(*) as job_count FROM external_jobs WHERE is_active = true GROUP BY source_site ORDER BY job_count DESC'
    );
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching source sites:', error);
    res.status(500).json({ error: 'Failed to fetch source sites' });
  }
});

// Get job statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_jobs,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_jobs,
        COUNT(CASE WHEN remote_work = true THEN 1 END) as remote_jobs,
        COUNT(DISTINCT source_site) as total_sources,
        COUNT(DISTINCT company_name) as total_companies,
        COUNT(DISTINCT location) as total_locations
      FROM external_jobs
    `);

    const recentJobs = await pool.query(`
      SELECT COUNT(*) as recent_count 
      FROM external_jobs 
      WHERE created_at > NOW() - INTERVAL '7 days'
    `);

    res.json({
      ...stats.rows[0],
      recent_jobs: recentJobs.rows[0].recent_count
    });
  } catch (error) {
    console.error('Error fetching job statistics:', error);
    res.status(500).json({ error: 'Failed to fetch job statistics' });
  }
});

// Admin: Update job status (mark as inactive)
router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    if (req.user?.role !== 'employer') {
      return res.status(403).json({ error: 'Employer access required' });
    }

    const { id } = req.params;
    const { is_active } = req.body;

    const { rows } = await pool.query(
      'UPDATE external_jobs SET is_active = $1 WHERE id = $2 RETURNING *',
      [is_active, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'External job not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({ error: 'Failed to update job status' });
  }
});

// Admin: Bulk update job status
router.post('/bulk-update', requireAuth, async (req, res) => {
  try {
    if (req.user?.role !== 'employer') {
      return res.status(403).json({ error: 'Employer access required' });
    }

    const { action, job_ids } = req.body;

    if (!action || !job_ids || !Array.isArray(job_ids)) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }

    let updateQuery;
    let updateValue;

    switch (action) {
      case 'activate':
        updateQuery = 'UPDATE external_jobs SET is_active = true WHERE id = ANY($1)';
        updateValue = [job_ids];
        break;
      case 'deactivate':
        updateQuery = 'UPDATE external_jobs SET is_active = false WHERE id = ANY($1)';
        updateValue = [job_ids];
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    const result = await pool.query(updateQuery, updateValue);
    
    res.json({
      message: `${action}ed ${result.rowCount} jobs`,
      updated_count: result.rowCount
    });
  } catch (error) {
    console.error('Error bulk updating jobs:', error);
    res.status(500).json({ error: 'Failed to bulk update jobs' });
  }
});

export default router;
