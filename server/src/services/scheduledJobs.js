import cron from 'node-cron';
import jobScraper from './jobScraper.js';
import { pool } from '../lib/db.js';

class ScheduledJobs {
  constructor() {
    this.isRunning = false;
    this.lastRun = null;
    this.jobStats = {
      totalScraped: 0,
      totalSaved: 0,
      lastRunTime: null,
      errors: []
    };
  }

  // Start the scheduled jobs
  start() {
    console.log('Starting scheduled job scraping...');

    // Run every 6 hours (4 times per day)
    cron.schedule('0 */6 * * *', () => {
      this.runJobScraping();
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    // Run job status updates daily at 2 AM
    cron.schedule('0 2 * * *', () => {
      this.updateJobStatuses();
    }, {
      scheduled: true,
      timezone: "UTC"
    });

    // Run initial job scraping after 5 minutes
    setTimeout(() => {
      this.runJobScraping();
    }, 5 * 60 * 1000);

    console.log('Scheduled jobs started successfully');
  }

  // Run the main job scraping task
  async runJobScraping() {
    if (this.isRunning) {
      console.log('Job scraping already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    console.log('Starting scheduled job scraping...');

    try {
      // Get popular job searches from database or use defaults
      const jobSearches = await this.getJobSearches();
      
      let totalScraped = 0;
      let totalSaved = 0;

      for (const search of jobSearches) {
        try {
          console.log(`Scraping jobs for: ${search.query} in ${search.location}`);
          
          const scrapedJobs = await jobScraper.scrapeAllSources(
            search.query, 
            search.location, 
            search.limit || 15
          );
          
          if (scrapedJobs.length > 0) {
            const savedJobs = await jobScraper.saveJobsToDatabase(scrapedJobs);
            totalScraped += scrapedJobs.length;
            totalSaved += savedJobs.length;
            
            console.log(`Saved ${savedJobs.length}/${scrapedJobs.length} jobs for "${search.query}"`);
          }

          // Add delay between searches to be respectful to external sites
          await this.delay(2000);
          
        } catch (error) {
          console.error(`Error scraping for "${search.query}":`, error.message);
          this.jobStats.errors.push({
            search: search.query,
            error: error.message,
            timestamp: new Date()
          });
        }
      }

      // Update stats
      this.jobStats.totalScraped += totalScraped;
      this.jobStats.totalSaved += totalSaved;
      this.jobStats.lastRunTime = new Date();
      this.lastRun = new Date();

      const runTime = Date.now() - startTime;
      console.log(`Job scraping completed in ${runTime}ms. Scraped: ${totalScraped}, Saved: ${totalSaved}`);

      // Clean up old errors (keep only last 10)
      if (this.jobStats.errors.length > 10) {
        this.jobStats.errors = this.jobStats.errors.slice(-10);
      }

    } catch (error) {
      console.error('Error in scheduled job scraping:', error);
      this.jobStats.errors.push({
        search: 'general',
        error: error.message,
        timestamp: new Date()
      });
    } finally {
      this.isRunning = false;
    }
  }

  // Get job searches to perform (can be customized per company/location)
  async getJobSearches() {
    try {
      // You can store these in a database table for easy management
      // For now, return default searches
      return [
        { query: 'software engineer', location: 'remote', limit: 15 },
        { query: 'data scientist', location: 'remote', limit: 15 },
        { query: 'product manager', location: 'remote', limit: 15 },
        { query: 'UX designer', location: 'remote', limit: 15 },
        { query: 'marketing manager', location: 'remote', limit: 15 },
        { query: 'sales representative', location: 'remote', limit: 15 },
        { query: 'customer service', location: 'remote', limit: 15 },
        { query: 'project manager', location: 'remote', limit: 15 },
        { query: 'devops engineer', location: 'remote', limit: 15 },
        { query: 'frontend developer', location: 'remote', limit: 15 }
      ];
    } catch (error) {
      console.error('Error getting job searches:', error);
      // Return default searches if database query fails
      return [
        { query: 'software engineer', location: 'remote', limit: 10 },
        { query: 'data scientist', location: 'remote', limit: 10 }
      ];
    }
  }

  // Update job statuses (mark old jobs as inactive)
  async updateJobStatuses() {
    try {
      console.log('Updating job statuses...');
      const updatedCount = await jobScraper.updateJobStatus();
      console.log(`Updated ${updatedCount} jobs to inactive`);
    } catch (error) {
      console.error('Error updating job statuses:', error);
    }
  }

  // Manual trigger for job scraping
  async triggerManualScraping() {
    if (this.isRunning) {
      throw new Error('Job scraping is already running');
    }
    
    await this.runJobScraping();
    return {
      success: true,
      message: 'Manual job scraping completed',
      stats: this.jobStats
    };
  }

  // Get current job scraping status
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      stats: this.jobStats,
      nextScheduledRun: this.getNextScheduledRun()
    };
  }

  // Get next scheduled run time
  getNextScheduledRun() {
    const now = new Date();
    const nextRun = new Date(now);
    
    // Find next 6-hour interval
    const currentHour = now.getHours();
    const nextInterval = Math.ceil(currentHour / 6) * 6;
    
    if (nextInterval > 24) {
      nextRun.setDate(nextRun.getDate() + 1);
      nextRun.setHours(0, 0, 0, 0);
    } else {
      nextRun.setHours(nextInterval, 0, 0, 0);
    }
    
    return nextRun;
  }

  // Utility function to add delay
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Stop all scheduled jobs
  stop() {
    console.log('Stopping scheduled jobs...');
    cron.getTasks().forEach(task => task.stop());
    this.isRunning = false;
    console.log('Scheduled jobs stopped');
  }
}

export default new ScheduledJobs();
