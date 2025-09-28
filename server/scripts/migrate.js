import fs from 'fs';
import path from 'path';
import url from 'url';
import dotenv from 'dotenv';
import { pool } from '../src/lib/db.js';

dotenv.config();

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  try {
    const dir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(dir)
      .filter(f => /^\d+_.+\.sql$/.test(f))
      .sort();
    for (const f of files) {
      const sql = fs.readFileSync(path.join(dir, f), 'utf8');
      await pool.query(sql);
      console.log(`Applied ${f}`);
    }
    console.log('All migrations applied successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

run();


