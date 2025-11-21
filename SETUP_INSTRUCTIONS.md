# Database Setup Instructions

## Quick Setup (Automated)

1. **Make sure MySQL is running** on your computer

2. **Create `.env.local` file** in the project root with your MySQL credentials:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=survey_app
   ```

3. **Run the setup script**:
   ```bash
   npm run setup-db
   ```

This will automatically create the database and all required tables.

## Manual Setup (Alternative)

If you prefer to set up manually:

1. **Open MySQL command line or MySQL Workbench**

2. **Run the SQL script**:
   ```bash
   mysql -u root -p < database/schema.sql
   ```
   
   Or copy and paste the contents of `database/schema.sql` into your MySQL client and execute it.

## Verify Setup

After running the setup, restart your dev server:
```bash
npm run dev
```

The application should now work without database errors!

