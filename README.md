# Survey Platform

A modern, full-featured survey application built with Next.js, TypeScript, and MySQL.

**Author:** Naveed Arif | Global Outreach | naveed@globaloutreach.co

## Features

- Survey creation with multiple question types
- Survey templates (admin-manageable)
- Short links for easy sharing
- Analytics dashboard with charts
- Real-time response updates
- Export to Excel and PDF
- Mobile-responsive design
- User management with roles
- Email notifications

## Prerequisites

- **Node.js** 18.x or higher
- **MySQL** 8.0 or higher
- **npm** package manager

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create `.env.local` file:

```env
# App Configuration
NEXT_PUBLIC_APP_NAME=Survey Platform
NEXT_PUBLIC_APP_DESCRIPTION=A modern survey platform
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=survey_app

# JWT Secret (generate: openssl rand -base64 32)
JWT_SECRET=your-strong-random-secret-here

# SMTP (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Node Environment
NODE_ENV=production
```

### 3. Database Setup

```bash
# Create database and tables
npm run setup-db

# Create admin user
npm run create-admin your-email@example.com your-password Admin Name

# Run migrations
npm run migrate-templates
```

### 4. Run Application

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

## Deployment

### Windows Server

#### 1. Install Prerequisites

- Install Node.js from [nodejs.org](https://nodejs.org/)
- Install MySQL from [mysql.com](https://dev.mysql.com/downloads/)
- Install Git (optional)

#### 2. Setup Project

```powershell
# Clone or copy project files
cd C:\path\to\Survey

# Install dependencies
npm install

# Create .env.local with production values
# Edit .env.local and set:
# - NEXT_PUBLIC_APP_URL=https://your-domain.com
# - DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
# - JWT_SECRET (generate with: openssl rand -base64 32)
```

#### 3. Database Setup

```powershell
# Create database
mysql -u root -p
CREATE DATABASE survey_app;
EXIT;

# Import schema
mysql -u root -p survey_app < database\schema.sql

# Create admin user
npm run create-admin admin@example.com password123 Admin User

# Run migrations
npm run migrate-templates
```

#### 4. Build and Start

```powershell
# Build for production
npm run build

# Start application
npm start
```

#### 5. Run as Windows Service (Optional)

Use **PM2** or **NSSM** (Non-Sucking Service Manager):

**Using PM2:**
```powershell
npm install -g pm2
pm2 start npm --name "survey-app" -- start
pm2 save
pm2 startup
```

**Using NSSM:**
1. Download NSSM from [nssm.cc](https://nssm.cc/download)
2. Install service: `nssm install SurveyApp`
3. Set path: `C:\path\to\node.exe`
4. Set arguments: `C:\path\to\Survey\node_modules\.bin\next start`
5. Set working directory: `C:\path\to\Survey`
6. Start service: `nssm start SurveyApp`

#### 6. Configure IIS (Optional)

If using IIS as reverse proxy:

1. Install **URL Rewrite** and **Application Request Routing** modules
2. Create reverse proxy rule pointing to `http://localhost:3000`
3. Configure SSL certificate

---

### Ubuntu Server

#### 1. Install Prerequisites

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL
sudo apt install -y mysql-server

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Apache (if using as reverse proxy)
sudo apt install -y apache2
```

#### 2. Setup Project

```bash
# Navigate to web directory
cd /var/www

# Clone or upload project files
sudo git clone <your-repo-url> Survey
# OR upload files via SCP/SFTP

# Set ownership
sudo chown -R $USER:$USER /var/www/Survey
cd /var/www/Survey

# Install dependencies
npm install --production

# Create .env.local
cp env.example.txt .env.local
nano .env.local
# Edit with production values:
# - NEXT_PUBLIC_APP_URL=https://your-domain.com
# - DB_HOST=localhost
# - DB_USER, DB_PASSWORD, DB_NAME
# - JWT_SECRET (generate: openssl rand -base64 32)
```

#### 3. Database Setup

```bash
# Secure MySQL installation
sudo mysql_secure_installation

# Create database and user
sudo mysql -u root -p
```

```sql
CREATE DATABASE survey_app;
CREATE USER 'survey_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON survey_app.* TO 'survey_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

```bash
# Import schema
mysql -u survey_user -p survey_app < database/schema.sql

# Create admin user
npm run create-admin admin@example.com password123 Admin User

# Run migrations
npm run migrate-templates
```

#### 4. Build Application

```bash
npm run build
```

#### 5. Start with PM2

```bash
# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the displayed command
```

#### 6. Configure Apache Reverse Proxy

```bash
# Enable required modules
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
sudo a2enmod ssl

# Create virtual host
sudo nano /etc/apache2/sites-available/survey.conf
```

Add configuration:

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    ServerAlias www.your-domain.com
    
    ProxyPreserveHost On
    ProxyRequests Off
    
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    RequestHeader set X-Forwarded-Proto "http"
</VirtualHost>

<VirtualHost *:443>
    ServerName your-domain.com
    ServerAlias www.your-domain.com
    
    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/your-cert.crt
    SSLCertificateKeyFile /etc/ssl/private/your-key.key
    
    ProxyPreserveHost On
    ProxyRequests Off
    
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    RequestHeader set X-Forwarded-Proto "https"
</VirtualHost>
```

```bash
# Enable site
sudo a2ensite survey.conf

# Disable default site (optional)
sudo a2dissite 000-default.conf

# Test configuration
sudo apache2ctl configtest

# Restart Apache
sudo systemctl restart apache2
```

#### 7. Configure Firewall

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

---

## Files to Upload to Server

**Upload these folders/files:**
- `app/`, `components/`, `contexts/`, `hooks/`, `lib/`, `types/`, `public/`
- `package.json`, `package-lock.json`
- `tsconfig.json`, `next.config.js`, `tailwind.config.js`, `postcss.config.js`
- `database/`, `scripts/`
- `ecosystem.config.js` (for PM2)

**DO NOT upload:**
- `node_modules/` (run `npm install` on server)
- `.next/` (run `npm run build` on server)
- `.env.local` (create manually on server)
- `.git/`, `*.log`, `.DS_Store`

**Quick upload with rsync:**
```bash
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.env.local' \
           --exclude '.git' --exclude '*.log' \
           ./ user@server:/var/www/Survey/
```

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_APP_NAME` | App name displayed in UI | No (default: "Survey Platform") |
| `NEXT_PUBLIC_APP_DESCRIPTION` | App description | No |
| `NEXT_PUBLIC_APP_URL` | Full URL of your app | Yes (for production) |
| `DB_HOST` | MySQL host | Yes |
| `DB_USER` | MySQL username | Yes |
| `DB_PASSWORD` | MySQL password | Yes |
| `DB_NAME` | Database name | Yes |
| `JWT_SECRET` | Secret for JWT tokens | Yes (generate strong secret) |
| `SMTP_HOST` | SMTP server | No (for email) |
| `SMTP_PORT` | SMTP port | No |
| `SMTP_USER` | SMTP username | No |
| `SMTP_PASSWORD` | SMTP password | No |

---

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run setup-db` - Setup database schema
- `npm run create-admin` - Create admin user
- `npm run migrate-templates` - Create templates table
- `npm run migrate-email` - Add email notifications column
- `npm run migrate-soft-delete` - Add soft delete support

---

## Troubleshooting

### Database Connection Error
- Verify credentials in `.env.local`
- Check MySQL is running: `sudo systemctl status mysql`
- Test connection: `mysql -u user -p database`

### Build Errors
- Clear cache: `rm -rf .next node_modules`
- Reinstall: `npm install`
- Check Node version: `node --version` (should be 18+)

### Port Already in Use
```bash
# Find process using port 3000
sudo lsof -i :3000
# Kill process
sudo kill -9 <PID>
```

### PM2 Not Starting on Boot
```bash
# Regenerate startup script
pm2 unstartup
pm2 startup
# Run the displayed command
```

---

## Security Checklist

Before production deployment:

- [ ] Change `JWT_SECRET` to strong random value
- [ ] Use strong database passwords
- [ ] Enable HTTPS/SSL
- [ ] Set `NODE_ENV=production`
- [ ] Configure firewall rules
- [ ] Use dedicated database user with minimal privileges
- [ ] Keep dependencies updated
- [ ] Never commit `.env.local` to version control

---

## Support

For issues or questions:
- Email: naveed@globaloutreach.co
- Check logs: `pm2 logs survey-app` (Ubuntu) or check console (Windows)

---

**Made with ❤️ using Next.js, TypeScript, and MySQL**
