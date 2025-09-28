import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

// Connect to default postgres database to create our database
const setupPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'postgres', // Connect to default postgres database
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function setupDatabase() {
  const client = await setupPool.connect();
  
  try {
    console.log('🔧 Setting up database...');
    
    // Check if database exists
    const dbExists = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME || 'jobportal']
    );
    
    if (dbExists.rows.length === 0) {
      console.log('📊 Creating database...');
      await client.query(`CREATE DATABASE ${process.env.DB_NAME || 'jobportal'}`);
      console.log('✅ Database created successfully!');
    } else {
      console.log('✅ Database already exists');
    }
    
    // Create user if it doesn't exist (optional)
    const userExists = await client.query(
      "SELECT 1 FROM pg_user WHERE usename = $1",
      [process.env.DB_USER || 'postgres']
    );
    
    if (userExists.rows.length === 0 && process.env.DB_USER !== 'postgres') {
      console.log('👤 Creating user...');
      await client.query(`CREATE USER ${process.env.DB_USER} WITH PASSWORD '${process.env.DB_PASSWORD}'`);
      await client.query(`GRANT ALL PRIVILEGES ON DATABASE ${process.env.DB_NAME || 'jobportal'} TO ${process.env.DB_USER}`);
      console.log('✅ User created and privileges granted!');
    }
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    throw error;
  } finally {
    client.release();
    await setupPool.end();
  }
}

// Run setup
setupDatabase()
  .then(() => {
    console.log('🎉 Database setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Run: npm run migrate');
    console.log('2. Start your server: npm run dev');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error.message);
    process.exit(1);
  });
