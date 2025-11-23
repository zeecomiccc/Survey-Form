# Deployment Checklist - Files to Upload to Server

## 📁 Files/Folders TO UPLOAD

Upload all these files and folders to your server (e.g., `/var/www/Survey/`):

### ✅ Source Code (Required)
```
app/                    # All application pages and API routes
components/             # React components
contexts/               # React contexts (ToastContext)
hooks/                  # Custom React hooks
lib/                    # Utility libraries and functions
types/                  # TypeScript type definitions
public/                 # Static assets (logo.png, etc.)
```

### ✅ Configuration Files (Required)
```
package.json            # Dependencies and scripts
package-lock.json       # Locked dependency versions
tsconfig.json           # TypeScript configuration
next.config.js          # Next.js configuration
tailwind.config.js      # Tailwind CSS configuration
postcss.config.js       # PostCSS configuration
next-env.d.ts           # Next.js TypeScript definitions
ecosystem.config.js     # PM2 configuration (if using PM2)
```

### ✅ Database & Scripts (Required)
```
database/
  ├── schema.sql        # Database schema
  └── dump.sql          # Database dump
scripts/
  ├── create-admin.js
  ├── create-templates-table.js
  ├── setup-database.js
  └── migrate-*.js      # All migration scripts
```

### ✅ Documentation (Optional but Recommended)
```
README.md
CHANGELOG.md
SETUP_INSTRUCTIONS.md
env.example.txt         # Use this as a template for .env.local
```

---

## ❌ Files/Folders NOT to Upload (Excluded)

**DO NOT upload these (they'll be created on the server):**
```
node_modules/           # Will run `npm install` on server
.next/                  # Will run `npm run build` on server
.env.local              # Create manually on server with your values
.env*.local             # All local environment files
.git/                   # Git repository (optional)
*.log                   # Log files
*.tmp                   # Temporary files
.DS_Store               # macOS system files
Thumbs.db               # Windows system files
.vscode/                # IDE settings
.idea/                  # IDE settings
```

---

## 🚀 Server Setup Steps

After uploading files, run these commands on your server:

### 1. **Install Dependencies**
```bash
cd /var/www/Survey
npm install --production
```

### 2. **Create Environment File**
```bash
# Copy the example file
cp env.example.txt .env.local

# Edit with your production values
nano .env.local
```

**Required environment variables:**
```env
# Database
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=survey_app

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your_strong_random_secret_here

# App Configuration
NEXT_PUBLIC_APP_NAME=Your App Name
NEXT_PUBLIC_APP_DESCRIPTION=Your App Description
NEXT_PUBLIC_APP_URL=https://your-domain.com

# SMTP (if using email notifications)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_user
SMTP_PASSWORD=your_smtp_password
```

### 3. **Set Up Database**
```bash
# Import database schema
mysql -u root -p survey_app < database/schema.sql

# Or run the setup script
npm run setup-db

# Run migrations
npm run migrate-templates
```

### 4. **Create Admin User**
```bash
npm run create-admin your-email@example.com your-password Admin Name
```

### 5. **Build the Application**
```bash
npm run build
```

### 6. **Start the Application**

**Option A: Using PM2 (Recommended)**
```bash
# Install PM2 globally (if not installed)
npm install -g pm2

# Start the app
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

**Option B: Using npm start directly**
```bash
npm start
```

### 7. **Configure Apache Reverse Proxy**

Create or update your Apache virtual host configuration:

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    
    ProxyPreserveHost On
    ProxyRequests Off
    
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    # Forward protocol for secure cookies
    RequestHeader set X-Forwarded-Proto "http"
</VirtualHost>

# For HTTPS
<VirtualHost *:443>
    ServerName your-domain.com
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /path/to/your/certificate.crt
    SSLCertificateKeyFile /path/to/your/private.key
    
    ProxyPreserveHost On
    ProxyRequests Off
    
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    # Forward protocol for secure cookies
    RequestHeader set X-Forwarded-Proto "https"
</VirtualHost>
```

Then enable the site and restart Apache:
```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
sudo a2enmod ssl  # If using HTTPS
sudo systemctl restart apache2
```

---

## 📦 Quick Upload Command (using rsync)

From your local machine:

```bash
# Exclude unnecessary files
rsync -avz --exclude 'node_modules' \
           --exclude '.next' \
           --exclude '.env.local' \
           --exclude '.git' \
           --exclude '*.log' \
           --exclude '.DS_Store' \
           --exclude 'Thumbs.db' \
           ./ user@your-server:/var/www/Survey/
```

Or using SCP:
```bash
# Create a tarball excluding unnecessary files
tar --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.env.local' \
    --exclude='.git' \
    --exclude='*.log' \
    -czf survey-app.tar.gz .

# Upload to server
scp survey-app.tar.gz user@your-server:/var/www/

# On server, extract
ssh user@your-server
cd /var/www
tar -xzf survey-app.tar.gz -C Survey/
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Application starts without errors
- [ ] Database connection works
- [ ] Login page loads correctly
- [ ] Can log in with admin account
- [ ] Templates page is accessible (admin only)
- [ ] Can create a new survey
- [ ] Can access survey via public link
- [ ] Short links work (`/s/[code]`)
- [ ] Apache reverse proxy works
- [ ] HTTPS works (if configured)
- [ ] Email notifications work (if configured)
- [ ] PM2 keeps app running after server restart

---

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Check what's using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>
```

### Permission Issues
```bash
# Fix ownership
sudo chown -R www-data:www-data /var/www/Survey
sudo chmod -R 755 /var/www/Survey
```

### View Logs
```bash
# PM2 logs
pm2 logs survey-app

# Next.js logs
tail -f /var/www/Survey/.next/server.log
```

---

## 📝 Notes

- Always backup your database before deployment
- Test in a staging environment first if possible
- Keep `.env.local` secure and never commit it
- Update `NEXT_PUBLIC_APP_URL` to your production domain
- Use HTTPS in production for secure cookies
- Monitor PM2 logs regularly: `pm2 logs`

