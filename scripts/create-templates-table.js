const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function createTemplatesTable() {
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

    // Create templates table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS survey_templates (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        icon VARCHAR(10),
        survey_data JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('survey_templates table created or already exists.');
    console.log('\nNote: Templates will be loaded from code on first API access.');
    console.log('You can update templates through the admin panel at /templates');
    console.log('Migration complete.');
  } catch (error) {
    console.error('Error creating templates table:', error);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

createTemplatesTable();

