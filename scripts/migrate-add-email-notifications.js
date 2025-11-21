require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function migrate() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'survey_app',
    });

    console.log('Connected to database');

    // Check if column already exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'surveys' 
      AND COLUMN_NAME = 'email_notifications_enabled'
    `, [process.env.DB_NAME || 'survey_app']);

    if (columns.length === 0) {
      // Add email_notifications_enabled column to surveys table
      await connection.execute(`
        ALTER TABLE surveys 
        ADD COLUMN email_notifications_enabled BOOLEAN DEFAULT FALSE
      `);
      console.log('✓ Added email_notifications_enabled column to surveys table');
    } else {
      console.log('✓ Column email_notifications_enabled already exists');
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

migrate();

