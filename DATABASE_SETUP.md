# MySQL Database Setup Guide

## Step 1: Create the Database

1. Open MySQL command line or MySQL Workbench
2. Run the SQL script to create the database and tables:

```bash
mysql -u root -p < database/schema.sql
```

Or copy and paste the contents of `database/schema.sql` into your MySQL client.

## Step 2: Configure Environment Variables

1. Create a `.env.local` file in the root directory (copy from `env.example.txt`)
2. Update the database credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=survey_app
```

## Step 3: Install MySQL Package

The `mysql2` package is already added to `package.json`. Run:

```bash
npm install
```

## Step 4: Test the Connection

Start your development server:

```bash
npm run dev
```

The application will automatically connect to MySQL when you use any survey features.

## Database Schema

The database includes the following tables:

- **surveys** - Stores survey metadata
- **questions** - Stores survey questions
- **question_options** - Stores options for multiple-choice questions
- **survey_responses** - Stores response submissions
- **answers** - Stores individual answers
- **answer_options** - Links answers to selected options (for multiple-choice)

All tables use UUIDs as primary keys and have proper foreign key relationships with cascade deletes.

