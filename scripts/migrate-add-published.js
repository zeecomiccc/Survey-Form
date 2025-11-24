const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'survey_app',
  };

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database.');

    // Check if published column exists
    const [rows] = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'surveys' AND COLUMN_NAME = 'published'`,
      [dbConfig.database]
    );

    if (rows.length === 0) {
      console.log('Adding published column to surveys table...');
      await connection.execute(
        `ALTER TABLE surveys
         ADD COLUMN published BOOLEAN DEFAULT FALSE AFTER email_notifications_enabled`
      );
      console.log('published column added successfully.');
    } else {
      console.log('published column already exists in surveys table. Skipping migration.');
    }

    console.log('Migration complete.');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

migrate();

