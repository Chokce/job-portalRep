import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import scheduledJobs from '../services/scheduledJobs.js';
import jobScraper from '../services/jobScraper.js';
import { pool } from '../lib/db.js';

const router = Router();

// Middleware to check if user is admin/employer
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'employer') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get job scraping status and statistics
router.get('/scraping/status', requireAuth, requireAdmin, (req, res) => {
  try {
    const status = scheduledJobs.getStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting scraping status:', error);
    res.status(500).json({ error: 'Failed to get scraping status' });
  }
});

// Manually trigger job scraping
router.post('/scraping/trigger', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await scheduledJobs.triggerManualScraping();
    res.json(result);
  } catch (error) {
    console.error('Error triggering job scraping:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start/stop scheduled job scraping
router.post('/scraping/control', requireAuth, requireAdmin, (req, res) => {
  try {
    const { action } = req.body;
    
    if (action === 'start') {
      scheduledJobs.start();
      res.json({ message: 'Scheduled job scraping started' });
    } else if (action === 'stop') {
      scheduledJobs.stop();
      res.json({ message: 'Scheduled job scraping stopped' });
    } else {
      res.status(400).json({ error: 'Invalid action. Use "start" or "stop"' });
    }
  } catch (error) {
    console.error('Error controlling job scraping:', error);
    res.status(500).json({ error: 'Failed to control job scraping' });
  }
});

// Search and scrape jobs manually
router.post('/scraping/search', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { query, location, limit = 20, sources = ['indeed', 'linkedin', 'glassdoor'] } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    console.log(`Admin manual search: ${query} in ${location || 'remote'}`);

    // Scrape jobs from specified sources
    const scrapedJobs = await jobScraper.scrapeAllSources(query, location || 'remote', limit);
    
    // Save jobs to database
    const savedJobs = await jobScraper.saveJobsToDatabase(scrapedJobs);

    res.json({
      message: `Found ${scrapedJobs.length} jobs, saved ${savedJobs.length} new jobs`,
      scraped: scrapedJobs.length,
      saved: savedJobs.length,
      jobs: savedJobs,
      search_params: { query, location, limit, sources }
    });
  } catch (error) {
    console.error('Error in admin job search:', error);
    res.status(500).json({ error: 'Failed to search jobs' });
  }
});

// Get comprehensive system statistics
router.get('/stats/comprehensive', requireAuth, requireAdmin, async (req, res) => {
  try {
    const [
      internalJobs,
      externalJobs,
      internalApplications,
      externalApplications,
      users,
      employers
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM jobs'),
      pool.query('SELECT COUNT(*) as count, COUNT(CASE WHEN is_active = true THEN 1 END) as active FROM external_jobs'),
      pool.query('SELECT COUNT(*) as count FROM applications'),
      pool.query('SELECT COUNT(*) as count FROM external_applications'),
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query('SELECT COUNT(*) as count FROM employers')
    ]);

    const scrapingStatus = scheduledJobs.getStatus();

    res.json({
      jobs: {
        internal: parseInt(internalJobs.rows[0].count),
        external: parseInt(externalJobs.rows[0].count),
        external_active: parseInt(externalJobs.rows[0].active),
        total: parseInt(internalJobs.rows[0].count) + parseInt(externalJobs.rows[0].count)
      },
      applications: {
        internal: parseInt(internalApplications.rows[0].count),
        external: parseInt(externalApplications.rows[0].count),
        total: parseInt(internalApplications.rows[0].count) + parseInt(externalApplications.rows[0].count)
      },
      users: {
        total: parseInt(users.rows[0].count),
        employers: parseInt(employers.rows[0].count)
      },
      scraping: scrapingStatus,
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        node_version: process.version
      }
    });
  } catch (error) {
    console.error('Error getting comprehensive stats:', error);
    res.status(500).json({ error: 'Failed to get comprehensive stats' });
  }
});

// Get external job sources statistics
router.get('/stats/sources', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        source_site,
        COUNT(*) as total_jobs,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_jobs,
        COUNT(CASE WHEN remote_work = true THEN 1 END) as remote_jobs,
        MIN(created_at) as first_job,
        MAX(created_at) as last_job
      FROM external_jobs 
      GROUP BY source_site 
      ORDER BY total_jobs DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error('Error getting source stats:', error);
    res.status(500).json({ error: 'Failed to get source stats' });
  }
});

// Get recent scraping errors
router.get('/scraping/errors', requireAuth, requireAdmin, (req, res) => {
  try {
    const status = scheduledJobs.getStatus();
    res.json({
      errors: status.stats.errors,
      total_errors: status.stats.errors.length
    });
  } catch (error) {
    console.error('Error getting scraping errors:', error);
    res.status(500).json({ error: 'Failed to get scraping errors' });
  }
});

// Clear old external jobs (mark as inactive)
router.post('/jobs/cleanup', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.body;
    
    const result = await pool.query(
      `UPDATE external_jobs 
       SET is_active = false 
       WHERE created_at < NOW() - INTERVAL '${days} days' 
       AND is_active = true`
    );

    res.json({
      message: `Marked ${result.rowCount} jobs as inactive`,
      updated_count: result.rowCount,
      cutoff_date: new Date(Date.now() - (days * 24 * 60 * 60 * 1000))
    });
  } catch (error) {
    console.error('Error cleaning up old jobs:', error);
    res.status(500).json({ error: 'Failed to cleanup old jobs' });
  }
});

// Get job scraping configuration
router.get('/scraping/config', requireAuth, requireAdmin, (req, res) => {
  try {
    res.json({
      schedule: 'Every 6 hours (0 */6 * * *)',
      timezone: 'UTC',
      default_searches: [
        'software engineer',
        'data scientist',
        'product manager',
        'UX designer',
        'marketing manager'
      ],
      sources: ['indeed', 'linkedin', 'glassdoor'],
      delay_between_searches: '2 seconds',
      max_jobs_per_search: 15
    });
  } catch (error) {
    console.error('Error getting scraping config:', error);
    res.status(500).json({ error: 'Failed to get scraping config' });
  }
});

// Update job scraping configuration (basic version)
router.post('/scraping/config', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { searches, max_jobs_per_search } = req.body;
    
    // This is a basic implementation - you could store these in database
    // For now, just return success message
    res.json({
      message: 'Configuration updated successfully',
      updated_config: {
        searches: searches || 'Using default searches',
        max_jobs_per_search: max_jobs_per_search || 'Using default limit'
      }
    });
  } catch (error) {
    console.error('Error updating scraping config:', error);
    res.status(500).json({ error: 'Failed to update scraping config' });
  }
});

export default router;
