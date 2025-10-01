# External Job Portal - API Documentation

This document describes the external job portal functionality that allows your platform to fetch jobs from external sites and enable users to apply through your website.

## 🚀 Features

- **Multi-source job scraping** from Indeed, LinkedIn, Glassdoor
- **Automated job fetching** with scheduled scraping every 6 hours
- **Unified job search** combining internal and external jobs
- **External job applications** with CV uploads and status tracking
- **Admin dashboard** for managing job scraping and monitoring
- **Job recommendations** based on user preferences

## 🏗️ Architecture

### Database Tables

#### `external_jobs`
Stores jobs fetched from external sources:
- `id`, `external_id`, `title`, `description`
- `company_name`, `location`, `employment_type`
- `salary_min`, `salary_max`, `remote_work`
- `job_url`, `source_site` (indeed, linkedin, glassdoor)
- `is_active`, `created_at`, `updated_at`

#### `external_applications`
Tracks user applications to external jobs:
- `id`, `external_job_id`, `user_id`
- `cv_url`, `cover_letter`, `notes`
- `application_status` (applied, reviewing, shortlisted, etc.)
- `external_application_url`, `created_at`, `updated_at`

## 📡 API Endpoints

### External Jobs

#### `GET /api/external-jobs`
List external jobs with filtering and pagination:
```bash
GET /api/external-jobs?page=1&limit=20&source_site=indeed&location=remote&search=engineer
```

#### `POST /api/external-jobs/search`
Search and scrape jobs from external sources:
```bash
POST /api/external-jobs/search
{
  "query": "software engineer",
  "location": "remote",
  "limit": 20,
  "sources": ["indeed", "linkedin", "glassdoor"]
}
```

#### `GET /api/external-jobs/:id`
Get external job details by ID.

#### `GET /api/external-jobs/sources/list`
Get available source sites and job counts.

#### `GET /api/external-jobs/stats/overview`
Get external jobs statistics.

### External Applications

#### `GET /api/external-applications`
List external applications (employer only).

#### `GET /api/external-applications/me`
Get user's external applications.

#### `POST /api/external-applications`
Apply to external job:
```bash
POST /api/external-applications
Content-Type: multipart/form-data

{
  "external_job_id": 123,
  "cover_letter": "I'm interested in this position...",
  "notes": "Additional notes",
  "cv": [file upload]
}
```

#### `PATCH /api/external-applications/:id/status`
Update application status (employer only):
```bash
PATCH /api/external-applications/123/status
{
  "application_status": "shortlisted",
  "notes": "Great candidate, moving to next round"
}
```

### Unified Jobs

#### `GET /api/unified-jobs/search`
Search across both internal and external jobs:
```bash
GET /api/unified-jobs/search?query=engineer&source_type=all&page=1&limit=20
```

#### `GET /api/unified-jobs/:id`
Get job details (works for both internal and external).

#### `GET /api/unified-jobs/recommendations/user`
Get personalized job recommendations:
```bash
GET /api/unified-jobs/recommendations/user?user_id=123&limit=10
```

#### `GET /api/unified-jobs/stats/overview`
Get comprehensive job statistics.

### Admin Management

#### `GET /api/admin/scraping/status`
Get job scraping status and statistics.

#### `POST /api/admin/scraping/trigger`
Manually trigger job scraping.

#### `POST /api/admin/scraping/control`
Start/stop scheduled job scraping:
```bash
POST /api/admin/scraping/control
{
  "action": "start" // or "stop"
}
```

#### `POST /api/admin/scraping/search`
Manual job search and scraping.

#### `GET /api/admin/stats/comprehensive`
Get comprehensive system statistics.

#### `POST /api/admin/jobs/cleanup`
Clean up old external jobs:
```bash
POST /api/admin/jobs/cleanup
{
  "days": 30
}
```

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install axios cheerio node-cron
```

### 2. Run Database Migration

```bash
npm run migrate
```

This will create the `external_jobs` and `external_applications` tables.

### 3. Environment Variables

Add to your `.env` file:
```env
NODE_ENV=production  # Enable scheduled job scraping
JWT_SECRET=your_jwt_secret
DATABASE_URL=your_database_url
```

### 4. Start the Server

```bash
# Development (scheduled jobs disabled)
npm run dev

# Production (scheduled jobs enabled)
NODE_ENV=production npm start
```

## 🔄 Job Scraping

### Automated Scraping

The system automatically scrapes jobs every 6 hours with these default searches:
- Software Engineer
- Data Scientist
- Product Manager
- UX Designer
- Marketing Manager
- Sales Representative
- Customer Service
- Project Manager
- DevOps Engineer
- Frontend Developer

### Manual Scraping

Trigger manual scraping via admin API:
```bash
POST /api/admin/scraping/trigger
Authorization: Bearer <employer_token>
```

### Scraping Sources

Currently supported:
- **Indeed**: `https://www.indeed.com/jobs`
- **LinkedIn**: `https://www.linkedin.com/jobs/search`
- **Glassdoor**: `https://www.glassdoor.com/Job`

## 📊 Monitoring & Statistics

### Job Statistics
- Total jobs (internal + external)
- Active external jobs
- Remote work availability
- Source site distribution

### Application Statistics
- Application counts by status
- Recent applications
- Unique applicants

### Scraping Statistics
- Total scraped jobs
- Success/failure rates
- Error logs
- Next scheduled run

## 🚨 Important Notes

### Rate Limiting
- 2-second delay between searches
- Respectful scraping practices
- User-agent rotation

### Data Freshness
- Jobs marked inactive after 30 days
- Daily cleanup at 2 AM UTC
- Configurable retention periods

### Legal Considerations
- Respect robots.txt
- Check terms of service
- Implement proper attribution
- Consider API alternatives

## 🧪 Testing

Run the test script to verify functionality:
```bash
node test-external-jobs.js
```

## 🔧 Customization

### Adding New Sources

1. Extend `JobScraper` class in `server/src/services/jobScraper.js`
2. Add new scraping method
3. Update `scrapeAllSources` method
4. Add to admin configuration

### Custom Job Searches

Modify `getJobSearches()` in `server/src/services/scheduledJobs.js`:
```javascript
return [
  { query: 'your_job_title', location: 'your_location', limit: 20 },
  // ... more searches
];
```

### Scraping Schedule

Modify cron schedule in `server/src/services/scheduledJobs.js`:
```javascript
// Every 4 hours instead of 6
cron.schedule('0 */4 * * *', () => {
  this.runJobScraping();
});
```

## 📈 Performance Considerations

- Database indexes on frequently queried fields
- Pagination for large result sets
- Efficient UNION queries for unified search
- Background job processing
- Configurable job limits per search

## 🔒 Security

- Authentication required for applications
- Role-based access control
- Input validation and sanitization
- File upload restrictions
- SQL injection prevention

## 🚀 Next Steps

1. **Enhanced Scraping**: Add more job sources
2. **AI Matching**: Implement job-candidate matching
3. **Notifications**: Email/SMS for application updates
4. **Analytics**: Advanced reporting and insights
5. **Mobile App**: Native mobile applications
6. **API Rate Limiting**: Prevent abuse
7. **Webhook Support**: Real-time job updates

## 📞 Support

For issues or questions:
1. Check the logs for error details
2. Verify database connectivity
3. Test individual API endpoints
4. Review scraping configuration
5. Check external site accessibility

---

**Happy Job Scraping! 🎯**
