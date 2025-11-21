require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function fixTitles() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'survey_app',
    });

    console.log('Connected to database');

    // Get all questions with titles ending in 0
    const [questions] = await connection.execute(
      'SELECT id, title FROM questions WHERE title LIKE "%0"'
    );

    console.log(`Found ${questions.length} questions with titles ending in 0`);

    // Fix each question title
    for (const question of questions) {
      // Remove trailing zeros
      const cleanTitle = question.title.toString().trim().replace(/0+$/, '');
      
      if (cleanTitle !== question.title) {
        await connection.execute(
          'UPDATE questions SET title = ? WHERE id = ?',
          [cleanTitle, question.id]
        );
        console.log(`Fixed: "${question.title}" -> "${cleanTitle}"`);
      }
    }

    console.log('✓ All question titles have been cleaned');
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error fixing titles:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixTitles();

