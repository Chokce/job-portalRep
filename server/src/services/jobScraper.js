import axios from 'axios';
import * as cheerio from 'cheerio';
import { pool } from '../lib/db.js';

class JobScraper {
  constructor() {
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    ];
  }

  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  async scrapeIndeed(query = 'software engineer', location = 'remote', limit = 20) {
    try {
      const searchUrl = `https://www.indeed.com/jobs?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const jobs = [];

      // Indeed job cards
      $('.job_seen_beacon').each((i, element) => {
        if (jobs.length >= limit) return false;

        const $el = $(element);
        const title = $el.find('.jobTitle span').text().trim();
        const company = $el.find('.companyName').text().trim();
        const location = $el.find('.companyLocation').text().trim();
        const salary = $el.find('.salary-snippet').text().trim();
        const description = $el.find('.job-snippet').text().trim();
        const jobUrl = 'https://www.indeed.com' + $el.find('a').attr('href');

        if (title && company) {
          jobs.push({
            title,
            company_name: company,
            location,
            description,
            salary_text: salary,
            job_url: jobUrl,
            source_site: 'indeed'
          });
        }
      });

      return jobs;
    } catch (error) {
      console.error('Indeed scraping error:', error.message);
      return [];
    }
  }

  async scrapeLinkedIn(query = 'software engineer', location = 'remote', limit = 20) {
    try {
      const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const jobs = [];

      // LinkedIn job cards
      $('.job-search-card').each((i, element) => {
        if (jobs.length >= limit) return false;

        const $el = $(element);
        const title = $el.find('.job-search-card__title').text().trim();
        const company = $el.find('.job-search-card__subtitle').text().trim();
        const location = $el.find('.job-search-card__location').text().trim();
        const jobUrl = $el.find('a').attr('href');

        if (title && company) {
          jobs.push({
            title,
            company_name: company,
            location,
            description: '',
            job_url: jobUrl ? `https://www.linkedin.com${jobUrl}` : '',
            source_site: 'linkedin'
          });
        }
      });

      return jobs;
    } catch (error) {
      console.error('LinkedIn scraping error:', error.message);
      return [];
    }
  }

  async scrapeGlassdoor(query = 'software engineer', location = 'remote', limit = 20) {
    try {
      const searchUrl = `https://www.glassdoor.com/Job/${encodeURIComponent(location)}-${encodeURIComponent(query)}-jobs-SRCH_IL.0,6_IC1147401_KO7,21.htm`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const jobs = [];

      // Glassdoor job cards
      $('.react-job-listing').each((i, element) => {
        if (jobs.length >= limit) return false;

        const $el = $(element);
        const title = $el.find('.jobLink').text().trim();
        const company = $el.find('.employerName').text().trim();
        const location = $el.find('.location').text().trim();
        const jobUrl = $el.find('a').attr('href');

        if (title && company) {
          jobs.push({
            title,
            company_name: company,
            location,
            description: '',
            job_url: jobUrl ? `https://www.glassdoor.com${jobUrl}` : '',
            source_site: 'glassdoor'
          });
        }
      });

      return jobs;
    } catch (error) {
      console.error('Glassdoor scraping error:', error.message);
      return [];
    }
  }

  async scrapeAllSources(query, location, limit = 20) {
    const allJobs = [];
    
    try {
      // Scrape from multiple sources concurrently
      const [indeedJobs, linkedinJobs, glassdoorJobs] = await Promise.allSettled([
        this.scrapeIndeed(query, location, Math.ceil(limit / 3)),
        this.scrapeLinkedIn(query, location, Math.ceil(limit / 3)),
        this.scrapeGlassdoor(query, location, Math.ceil(limit / 3))
      ]);

      if (indeedJobs.status === 'fulfilled') allJobs.push(...indeedJobs.value);
      if (linkedinJobs.status === 'fulfilled') allJobs.push(...linkedinJobs.value);
      if (glassdoorJobs.status === 'fulfilled') allJobs.push(...glassdoorJobs.value);

      return allJobs.slice(0, limit);
    } catch (error) {
      console.error('Multi-source scraping error:', error.message);
      return allJobs;
    }
  }

  async saveJobsToDatabase(jobs) {
    const savedJobs = [];
    
    for (const job of jobs) {
      try {
        // Generate unique external ID
        const externalId = `${job.source_site}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const { rows } = await pool.query(
          `INSERT INTO external_jobs (
            external_id, title, description, company_name, location, 
            job_url, source_site, posted_date
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (external_id) DO NOTHING
          RETURNING *`,
          [
            externalId,
            job.title,
            job.description || '',
            job.company_name,
            job.location || '',
            job.job_url,
            job.source_site,
            new Date()
          ]
        );

        if (rows.length > 0) {
          savedJobs.push(rows[0]);
        }
      } catch (error) {
        console.error('Error saving job to database:', error.message);
      }
    }

    return savedJobs;
  }

  async updateJobStatus() {
    try {
      // Mark old jobs as inactive (older than 30 days)
      const result = await pool.query(
        `UPDATE external_jobs 
         SET is_active = false 
         WHERE created_at < NOW() - INTERVAL '30 days' 
         AND is_active = true`
      );
      
      console.log(`Updated ${result.rowCount} jobs to inactive`);
      return result.rowCount;
    } catch (error) {
      console.error('Error updating job status:', error.message);
      return 0;
    }
  }
}

export default new JobScraper();
