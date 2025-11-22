require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function migrate() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'survey_app',
    });

    console.log('Connected to database');

    // Add short_code column to survey_links table
    console.log('Adding short_code column to survey_links table...');
    await connection.execute(`
      ALTER TABLE survey_links 
      ADD COLUMN short_code VARCHAR(10) UNIQUE NULL AFTER token,
      ADD INDEX idx_short_code (short_code)
    `);

    console.log('Migration completed successfully!');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Column short_code already exists. Migration already applied.');
    } else {
      console.error('Migration failed:', error);
      process.exit(1);
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

migrate();

