require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'survey_app',
  });

  try {
    console.log('Starting migration: Adding user_id column to surveys table...');

    // Check if user_id column already exists
    const [columns] = await connection.execute(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? 
       AND TABLE_NAME = 'surveys' 
       AND COLUMN_NAME = 'user_id'`,
      [process.env.DB_NAME || 'survey_app']
    );

    if (columns.length > 0) {
      console.log('user_id column already exists. Skipping migration.');
      await connection.end();
      return;
    }

    // Check if users table exists
    const [tables] = await connection.execute(
      `SELECT TABLE_NAME 
       FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ? 
       AND TABLE_NAME = 'users'`,
      [process.env.DB_NAME || 'survey_app']
    );

    if (tables.length === 0) {
      console.log('Users table does not exist. Please run the full schema setup first.');
      await connection.end();
      return;
    }

    // Get the first admin user or create a default user for existing surveys
    const [users] = await connection.execute(
      'SELECT id FROM users WHERE role = "admin" LIMIT 1'
    );

    let defaultUserId = null;
    if (users.length > 0) {
      defaultUserId = users[0].id;
      console.log(`Found admin user: ${defaultUserId}`);
    } else {
      // Create a default admin user for existing surveys
      const { v4: uuidv4 } = require('uuid');
      const bcrypt = require('bcryptjs');
      defaultUserId = uuidv4();
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await connection.execute(
        'INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)',
        [defaultUserId, 'admin@example.com', hashedPassword, 'Admin User', 'admin']
      );
      console.log(`Created default admin user: ${defaultUserId}`);
      console.log('Default credentials: admin@example.com / admin123');
    }

    // Add user_id column
    await connection.execute(
      'ALTER TABLE surveys ADD COLUMN user_id VARCHAR(36) NULL AFTER id'
    );
    console.log('Added user_id column to surveys table');

    // Update existing surveys to use the default user
    if (defaultUserId) {
      const [result] = await connection.execute(
        'UPDATE surveys SET user_id = ? WHERE user_id IS NULL',
        [defaultUserId]
      );
      console.log(`Updated ${result.affectedRows} existing surveys with default user`);
    }

    // Make user_id NOT NULL and add foreign key
    await connection.execute(
      'ALTER TABLE surveys MODIFY COLUMN user_id VARCHAR(36) NOT NULL'
    );
    console.log('Set user_id to NOT NULL');

    await connection.execute(
      'ALTER TABLE surveys ADD CONSTRAINT fk_surveys_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE'
    );
    console.log('Added foreign key constraint');

    // Add index
    await connection.execute(
      'ALTER TABLE surveys ADD INDEX idx_user_id (user_id)'
    );
    console.log('Added index on user_id');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists. Migration may have already been run.');
    } else {
      throw error;
    }
  } finally {
    await connection.end();
  }
}

migrate().catch(console.error);

