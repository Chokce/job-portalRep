import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();

const { Pool } = pkg;

// Database configuration with fallbacks
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  // Fallback configuration if DATABASE_URL is not set
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'jobportal',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

// Create the connection pool
export const pool = new Pool(dbConfig);

// Test database connection
pool.on('connect', (client) => {
  console.log('✅ New client connected to PostgreSQL');
});

pool.on('error', (err, client) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Test the connection when the module loads
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL database connected successfully!');
    console.log(`📊 Database: ${client.database}`);
    console.log(`👤 User: ${client.user}`);
    console.log(`🌐 Host: ${client.host}:${client.port}`);
    client.release();
  } catch (err) {
    console.error('❌ Failed to connect to PostgreSQL database:');
    console.error('Error:', err.message);
    console.error('\n🔧 Troubleshooting steps:');
    console.error('1. Make sure PostgreSQL is running');
    console.error('2. Check your .env file has correct DATABASE_URL');
    console.error('3. Verify database credentials');
    console.error('4. Ensure database "jobportal" exists');
    console.error('\n📝 Example .env configuration:');
    console.error('DATABASE_URL=postgresql://username:password@localhost:5432/jobportal');
    
    // Don't exit in development, just log the error
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

// Run connection test
testConnection();

export default pool;


