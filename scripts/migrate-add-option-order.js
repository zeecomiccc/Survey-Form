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

    // Check if order column exists
    const [rows] = await connection.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'question_options' AND COLUMN_NAME = 'order'`,
      [dbConfig.database]
    );

    if (rows.length === 0) {
      console.log('Adding order column to question_options table...');
      await connection.execute(
        `ALTER TABLE question_options
         ADD COLUMN \`order\` INT DEFAULT 0 AFTER label`
      );
      console.log('order column added successfully.');

      // Update existing options with order based on created_at
      console.log('Updating existing options with order values...');
      const [questions] = await connection.execute(
        'SELECT id FROM questions WHERE type IN ("single-choice", "multiple-choice")'
      );

      for (const question of questions) {
        const [options] = await connection.execute(
          'SELECT id FROM question_options WHERE question_id = ? ORDER BY created_at ASC',
          [question.id]
        );

        for (let i = 0; i < options.length; i++) {
          await connection.execute(
            'UPDATE question_options SET `order` = ? WHERE id = ?',
            [i, options[i].id]
          );
        }
      }

      console.log('Existing options updated with order values.');
    } else {
      console.log('order column already exists in question_options table. Skipping migration.');
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

