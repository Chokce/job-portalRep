import { Router } from 'express';
import { pool } from '../lib/db.js';

const router = Router();

// Unified job search combining internal and external jobs
router.get('/search', async (req, res) => {
  try {
    const {
      query,
      location,
      employment_type,
      remote_work,
      source_type = 'all', // 'internal', 'external', 'all'
      page = 1,
      limit = 20
    } = req.query;

    const offset = (page - 1) * limit;
    const params = [];
    let paramCount = 0;

    // Build base queries for both internal and external jobs
    let internalWhereClause = 'WHERE 1=1';
    let externalWhereClause = 'WHERE is_active = true';

    if (query) {
      paramCount++;
      const searchParam = `%${query}%`;
      internalWhereClause += ` AND (title ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      externalWhereClause += ` AND (title ILIKE $${paramCount} OR description ILIKE $${paramCount} OR company_name ILIKE $${paramCount})`;
      params.push(searchParam);
    }

    if (location) {
      paramCount++;
      const locationParam = `%${location}%`;
      internalWhereClause += ` AND location ILIKE $${paramCount}`;
      externalWhereClause += ` AND location ILIKE $${paramCount}`;
      params.push(locationParam);
    }

    if (employment_type) {
      paramCount++;
      internalWhereClause += ` AND employment_type = $${paramCount}`;
      externalWhereClause += ` AND employment_type = $${paramCount}`;
      params.push(employment_type);
    }

    if (remote_work === 'true') {
      externalWhereClause += ` AND remote_work = true`;
    }

    // Build the unified query based on source_type
    let unifiedQuery;
    let countQuery;

    if (source_type === 'internal') {
      // Only internal jobs
      unifiedQuery = `
        SELECT 
          'internal' as source_type,
          j.id,
          j.title,
          j.description,
          j.location,
          j.employment_type,
          j.created_at,
          e.company_name,
          e.id as employer_id,
          NULL as source_site,
          NULL as job_url,
          NULL as remote_work,
          NULL as salary_min,
          NULL as salary_max,
          NULL as salary_currency
        FROM jobs j
        JOIN employers e ON j.employer_id = e.id
        ${internalWhereClause}
        ORDER BY j.created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;

      countQuery = `SELECT COUNT(*) FROM jobs j JOIN employers e ON j.employer_id = e.id ${internalWhereClause}`;
    } else if (source_type === 'external') {
      // Only external jobs
      unifiedQuery = `
        SELECT 
          'external' as source_type,
          ej.id,
          ej.title,
          ej.description,
          ej.location,
          ej.employment_type,
          ej.created_at,
          ej.company_name,
          NULL as employer_id,
          ej.source_site,
          ej.job_url,
          ej.remote_work,
          ej.salary_min,
          ej.salary_max,
          ej.salary_currency
        FROM external_jobs ej
        ${externalWhereClause}
        ORDER BY ej.created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;

      countQuery = `SELECT COUNT(*) FROM external_jobs ej ${externalWhereClause}`;
    } else {
      // Both internal and external jobs
      unifiedQuery = `
        (SELECT 
          'internal' as source_type,
          j.id,
          j.title,
          j.description,
          j.location,
          j.employment_type,
          j.created_at,
          e.company_name,
          e.id as employer_id,
          NULL as source_site,
          NULL as job_url,
          NULL as remote_work,
          NULL as salary_min,
          NULL as salary_max,
          NULL as salary_currency
        FROM jobs j
        JOIN employers e ON j.employer_id = e.id
        ${internalWhereClause})
        
        UNION ALL
        
        (SELECT 
          'external' as source_type,
          ej.id,
          ej.title,
          ej.description,
          ej.location,
          ej.employment_type,
          ej.created_at,
          ej.company_name,
          NULL as employer_id,
          ej.source_site,
          ej.job_url,
          ej.remote_work,
          ej.salary_min,
          ej.salary_max,
          ej.salary_currency
        FROM external_jobs ej
        ${externalWhereClause})
        
        ORDER BY created_at DESC
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;

      // For count, we need to handle both tables
      const internalCount = await pool.query(
        `SELECT COUNT(*) FROM jobs j JOIN employers e ON j.employer_id = e.id ${internalWhereClause}`,
        params
      );
      const externalCount = await pool.query(
        `SELECT COUNT(*) FROM external_jobs ej ${externalWhereClause}`,
        params
      );
      const totalJobs = parseInt(internalCount.rows[0].count) + parseInt(externalCount.rows[0].count);
      
      // Execute the main query
      params.push(limit, offset);
      const { rows } = await pool.query(unifiedQuery, params);

      return res.json({
        jobs: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalJobs,
          pages: Math.ceil(totalJobs / limit)
        },
        source_type
      });
    }

    // For single source type queries
    params.push(limit, offset);
    const { rows } = await pool.query(unifiedQuery, params);
    const countResult = await pool.query(countQuery, params.slice(0, -2));
    const totalJobs = parseInt(countResult.rows[0].count);

    res.json({
      jobs: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalJobs,
        pages: Math.ceil(totalJobs / limit)
      },
      source_type
    });

  } catch (error) {
    console.error('Error in unified job search:', error);
    res.status(500).json({ error: 'Failed to search jobs' });
  }
});

// Get job details by ID (works for both internal and external)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { source_type } = req.query;

    let job;

    if (source_type === 'internal') {
      // Get internal job
      const { rows } = await pool.query(
        `SELECT 
          'internal' as source_type,
          j.*,
          e.company_name,
          e.email as employer_email
        FROM jobs j
        JOIN employers e ON j.employer_id = e.id
        WHERE j.id = $1`,
        [id]
      );
      job = rows[0];
    } else if (source_type === 'external') {
      // Get external job
      const { rows } = await pool.query(
        `SELECT 
          'external' as source_type,
          *
        FROM external_jobs
        WHERE id = $1 AND is_active = true`,
        [id]
      );
      job = rows[0];
    } else {
      // Try to find in both tables
      let internalJob = await pool.query(
        `SELECT 
          'internal' as source_type,
          j.*,
          e.company_name,
          e.email as employer_email
        FROM jobs j
        JOIN employers e ON j.employer_id = e.id
        WHERE j.id = $1`,
        [id]
      );

      if (internalJob.rows.length > 0) {
        job = internalJob.rows[0];
      } else {
        let externalJob = await pool.query(
          `SELECT 
            'external' as source_type,
            *
          FROM external_jobs
          WHERE id = $1 AND is_active = true`,
          [id]
        );
        job = externalJob.rows[0];
      }
    }

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error('Error fetching job details:', error);
    res.status(500).json({ error: 'Failed to fetch job details' });
  }
});

// Get job recommendations based on user preferences
router.get('/recommendations/user', async (req, res) => {
  try {
    const { user_id, limit = 10 } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get user's previous applications to understand preferences
    const userApplications = await pool.query(
      `SELECT DISTINCT 
        COALESCE(j.employment_type, ej.employment_type) as employment_type,
        COALESCE(j.location, ej.location) as location
      FROM applications a
      LEFT JOIN jobs j ON a.job_id = j.id
      LEFT JOIN external_applications ea ON ea.user_id = $1
      LEFT JOIN external_jobs ej ON ea.external_job_id = ej.id
      WHERE a.user_id = $1 OR ea.user_id = $1`,
      [user_id]
    );

    if (userApplications.rows.length === 0) {
      // If no applications, return recent jobs
      const { rows } = await pool.query(
        `(SELECT 
          'internal' as source_type,
          j.id,
          j.title,
          j.description,
          j.location,
          j.employment_type,
          j.created_at,
          e.company_name
        FROM jobs j
        JOIN employers e ON j.employer_id = e.id
        ORDER BY j.created_at DESC
        LIMIT $1)
        
        UNION ALL
        
        (SELECT 
          'external' as source_type,
          ej.id,
          ej.title,
          ej.description,
          ej.location,
          ej.employment_type,
          ej.created_at,
          ej.company_name
        FROM external_jobs ej
        WHERE ej.is_active = true
        ORDER BY ej.created_at DESC
        LIMIT $1)
        
        ORDER BY created_at DESC
        LIMIT $1`,
        [limit]
      );

      return res.json({ jobs: rows, reason: 'Recent jobs (no user preferences)' });
    }

    // Build recommendation query based on user preferences
    const preferences = userApplications.rows;
    const employmentTypes = preferences.map(p => p.employment_type).filter(Boolean);
    const locations = preferences.map(p => p.location).filter(Boolean);

    let recommendationQuery = `
      (SELECT 
        'internal' as source_type,
        j.id,
        j.title,
        j.description,
        j.location,
        j.employment_type,
        j.created_at,
        e.company_name
      FROM jobs j
      JOIN employers e ON j.employer_id = e.id
      WHERE 1=1`;

    if (employmentTypes.length > 0) {
      recommendationQuery += ` AND j.employment_type = ANY($1)`;
    }
    if (locations.length > 0) {
      recommendationQuery += ` AND j.location ILIKE ANY($2)`;
    }

    recommendationQuery += `
        ORDER BY j.created_at DESC
        LIMIT $3)
        
        UNION ALL
        
        (SELECT 
          'external' as source_type,
          ej.id,
          ej.title,
          ej.description,
          ej.location,
          ej.employment_type,
          ej.created_at,
          ej.company_name
        FROM external_jobs ej
        WHERE ej.is_active = true`;

    if (employmentTypes.length > 0) {
      recommendationQuery += ` AND ej.employment_type = ANY($1)`;
    }
    if (locations.length > 0) {
      recommendationQuery += ` AND ej.location ILIKE ANY($2)`;
    }

    recommendationQuery += `
          ORDER BY ej.created_at DESC
          LIMIT $3)
          
          ORDER BY created_at DESC
          LIMIT $3`;

    const queryParams = [];
    if (employmentTypes.length > 0) queryParams.push(employmentTypes);
    if (locations.length > 0) queryParams.push(locations.map(l => `%${l}%`));
    queryParams.push(Math.ceil(limit / 2));

    const { rows } = await pool.query(recommendationQuery, queryParams);

    res.json({ 
      jobs: rows.slice(0, limit), 
      reason: 'Based on your application history',
      preferences: { employmentTypes, locations }
    });

  } catch (error) {
    console.error('Error getting job recommendations:', error);
    res.status(500).json({ error: 'Failed to get job recommendations' });
  }
});

// Get job statistics overview
router.get('/stats/overview', async (req, res) => {
  try {
    const [internalStats, externalStats] = await Promise.all([
      pool.query(`
        SELECT 
          COUNT(*) as total_jobs,
          COUNT(DISTINCT employer_id) as total_employers,
          COUNT(DISTINCT location) as total_locations,
          COUNT(DISTINCT employment_type) as total_employment_types
        FROM jobs
      `),
      pool.query(`
        SELECT 
          COUNT(*) as total_jobs,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_jobs,
          COUNT(DISTINCT company_name) as total_companies,
          COUNT(DISTINCT source_site) as total_sources,
          COUNT(CASE WHEN remote_work = true THEN 1 END) as remote_jobs
        FROM external_jobs
      `)
    ]);

    const totalJobs = internalStats.rows[0].total_jobs + externalStats.rows[0].total_jobs;

    res.json({
      total_jobs: totalJobs,
      internal: internalStats.rows[0],
      external: externalStats.rows[0],
      summary: {
        total_employers: internalStats.rows[0].total_employers + externalStats.rows[0].total_companies,
        total_locations: internalStats.rows[0].total_locations + externalStats.rows[0].total_locations,
        remote_work_available: externalStats.rows[0].remote_jobs > 0
      }
    });

  } catch (error) {
    console.error('Error getting job statistics:', error);
    res.status(500).json({ error: 'Failed to get job statistics' });
  }
});

export default router;
