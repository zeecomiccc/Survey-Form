# Survey Platform

A modern, full-featured survey application built with Next.js, TypeScript, and MySQL. Create, distribute, and analyze surveys with ease.

## 👤 Author

**Naveed Arif**  
Global Outreach  
Email: naveed@globaloutreach.co

## 🚀 Features

- **Survey Creation**: Build surveys with multiple question types (text, multiple-choice, single-choice, rating, yes/no, date)
- **User Management**: Admin and user roles with proper access control
- **Survey Distribution**: Generate unique, expiring survey links (7-day expiration)
- **One Submission Per Link**: Prevent duplicate submissions with unique link tokens
- **Analytics Dashboard**: Visual charts and statistics for survey responses
- **Export to Excel**: Download survey responses as Excel files
- **Email Notifications**: Receive email alerts when responses are submitted
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Drag & Drop**: Reorder questions easily in the survey builder
- **Progress Tracking**: One question at a time with progress indicator

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher
- **MySQL** 8.0 or higher
- **npm** or **yarn** package manager

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd Survey
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=survey_app

# JWT Secret (IMPORTANT: Generate a strong secret for production!)
# Generate with: openssl rand -base64 32
JWT_SECRET=your-strong-random-secret-here

# SMTP Configuration (Optional - for email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Node Environment
NODE_ENV=production
```

### 4. Set Up Database

#### Option A: Using the Setup Script (Recommended)

```bash
npm run setup-db
```

This will create the database and all required tables.

#### Option B: Manual Setup

1. Create a MySQL database:
```sql
CREATE DATABASE survey_app;
```

2. Import the schema:
```bash
mysql -u your_user -p survey_app < database/schema.sql
```

Or use the dump file:
```bash
mysql -u your_user -p survey_app < database/dump.sql
```

### 5. Create Admin User

```bash
npm run create-admin
```

Or manually:
```bash
node scripts/create-admin.js
```

You'll be prompted to enter:
- Email
- Password
- Name

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

## 📁 Project Structure

```
Survey/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── surveys/      # Survey CRUD operations
│   │   ├── responses/    # Response handling
│   │   └── users/        # User management
│   ├── analytics/        # Analytics dashboard
│   ├── builder/          # Survey builder
│   ├── login/            # Login page
│   ├── survey/           # Public survey view
│   └── users/            # User management page
├── components/            # React components
├── database/             # Database schema and dumps
│   ├── schema.sql        # Database schema
│   └── dump.sql          # Complete database dump
├── lib/                  # Utility libraries
│   ├── auth.ts          # Authentication helpers
│   ├── db.ts            # Database connection
│   ├── email.ts         # Email service
│   └── storage.ts       # Data access layer
├── scripts/              # Setup and migration scripts
├── types/                # TypeScript type definitions
└── public/               # Static assets
```

## 🔐 Security

This application includes several security features:

- ✅ SQL injection protection (parameterized queries)
- ✅ Password hashing (bcrypt)
- ✅ JWT authentication
- ✅ HttpOnly cookies
- ✅ Role-based access control
- ✅ Input validation
- ✅ Security headers

**⚠️ IMPORTANT**: Before deploying to production, review the [SECURITY.md](SECURITY.md) checklist.

## 📧 Email Notifications Setup

To enable email notifications:

1. Configure SMTP settings in `.env.local`
2. For Gmail:
   - Enable 2-Step Verification
   - Generate an App Password
   - Use the app password in `SMTP_PASSWORD`

See [README-EMAIL.md](README-EMAIL.md) for detailed instructions.

## 🗄️ Database Migrations

### Add Email Notifications Column

If you're upgrading from an older version:

```bash
npm run migrate-email
```

### Add Login Attempts Table (Brute Force Protection)

For brute force protection:

```bash
npm run migrate-login-attempts
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Create new user (admin only)
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Surveys
- `GET /api/surveys` - Get all surveys (filtered by user)
- `POST /api/surveys` - Create new survey
- `GET /api/surveys/[id]` - Get survey by ID (public)
- `PUT /api/surveys/[id]` - Update survey
- `DELETE /api/surveys/[id]` - Delete survey
- `PUT /api/surveys/[id]/notifications` - Toggle email notifications

### Responses
- `GET /api/responses?surveyId=[id]` - Get responses for a survey
- `POST /api/responses` - Submit survey response (public)

### Users (Admin Only)
- `GET /api/users` - Get all users
- `DELETE /api/users?id=[id]` - Delete user
- `PUT /api/users/[id]` - Update user
- `POST /api/users/[id]/reset-password` - Reset user password

## 🧪 Testing

Currently, manual testing is recommended. Future versions may include automated tests.

## 🐛 Troubleshooting

### Database Connection Issues

- Verify database credentials in `.env.local`
- Ensure MySQL is running
- Check database user has proper permissions

### Email Not Sending

- Verify SMTP credentials
- Check spam folder
- Ensure SMTP settings are correct
- See [README-EMAIL.md](README-EMAIL.md) for troubleshooting

### Build Errors

- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (should be 18+)

## 📦 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

1. Build the application: `npm run build`
2. Set environment variables
3. Run: `npm start`
4. Ensure MySQL database is accessible

**Important**: Set `NODE_ENV=production` in production environment.

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## 🆘 Support

For issues and questions:
- Check the [SECURITY.md](SECURITY.md) for security-related questions
- Review the troubleshooting section
- Open an issue on GitHub

## 🔄 Version History

- **v1.0.0** - Initial release
  - Survey creation and management
  - User authentication and authorization
  - Analytics dashboard
  - Email notifications
  - Export to Excel

## 📚 Additional Documentation

- [SECURITY.md](SECURITY.md) - Security checklist and best practices
- [README-EMAIL.md](README-EMAIL.md) - Email notification setup guide
- [database/schema.sql](database/schema.sql) - Database schema
- [database/dump.sql](database/dump.sql) - Complete database dump

---

**Made with ❤️ using Next.js, TypeScript, and MySQL**

## 📧 Contact

For questions, support, or inquiries, please contact:

**Naveed Arif**  
Global Outreach  
Email: naveed@globaloutreach.co
