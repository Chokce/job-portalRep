-- Add external jobs support
CREATE TABLE IF NOT EXISTS external_jobs (
  id SERIAL PRIMARY KEY,
  external_id VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  company_name VARCHAR(255),
  location VARCHAR(255),
  salary_min DECIMAL(10,2),
  salary_max DECIMAL(10,2),
  salary_currency VARCHAR(3) DEFAULT 'USD',
  employment_type VARCHAR(50),
  remote_work BOOLEAN DEFAULT false,
  skills TEXT[],
  job_url TEXT NOT NULL,
  source_site VARCHAR(100) NOT NULL,
  posted_date TIMESTAMP,
  expires_date TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add external applications table
CREATE TABLE IF NOT EXISTS external_applications (
  id SERIAL PRIMARY KEY,
  external_job_id INT NOT NULL REFERENCES external_jobs(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cv_url TEXT,
  cover_letter TEXT,
  application_status VARCHAR(50) DEFAULT 'applied',
  external_application_url TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(external_job_id, user_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_external_jobs_source_site ON external_jobs(source_site);
CREATE INDEX IF NOT EXISTS idx_external_jobs_location ON external_jobs(location);
CREATE INDEX IF NOT EXISTS idx_external_jobs_employment_type ON external_jobs(employment_type);
CREATE INDEX IF NOT EXISTS idx_external_jobs_remote_work ON external_jobs(remote_work);
CREATE INDEX IF NOT EXISTS idx_external_jobs_is_active ON external_jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_external_jobs_posted_date ON external_jobs(posted_date);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_external_jobs_updated_at 
    BEFORE UPDATE ON external_jobs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_external_applications_updated_at 
    BEFORE UPDATE ON external_applications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
