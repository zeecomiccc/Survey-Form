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

    // Add deleted_at column to surveys table
    console.log('Adding deleted_at column to surveys table...');
    await connection.execute(`
      ALTER TABLE surveys 
      ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at,
      ADD INDEX idx_deleted_at (deleted_at)
    `);

    console.log('Migration completed successfully!');
    console.log('All existing surveys will have deleted_at = NULL (not deleted)');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Column deleted_at already exists. Migration already applied.');
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

