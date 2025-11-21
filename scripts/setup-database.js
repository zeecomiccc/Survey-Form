const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function setupDatabase() {
  let connection;
  
  try {
    // Connect to MySQL (without specifying database first)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true, // Allow multiple statements
    });

    console.log('✓ Connected to MySQL server');

    // Read the schema file
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing SQL schema...');

    // Execute the entire schema file
    await connection.query(schema);

    console.log('\n✅ Database setup completed successfully!');
    console.log('Database "survey_app" and all tables have been created.');
    console.log('You can now use the survey application.');
    
  } catch (error) {
    if (error.code === 'ER_DB_CREATE_EXISTS' || error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('\n⚠️  Database or tables already exist. This is okay!');
      console.log('✅ Setup completed.');
    } else {
      console.error('\n❌ Error setting up database:', error.message);
      console.error('\nPlease make sure:');
      console.error('1. MySQL is running');
      console.error('2. Your .env.local file has correct database credentials');
      console.error('3. The database user has permission to create databases');
      console.error('\nYou can also set up manually by running:');
      console.error('  mysql -u root -p < database/schema.sql');
      process.exit(1);
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();

