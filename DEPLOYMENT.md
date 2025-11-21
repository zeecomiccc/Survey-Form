# Deployment Guide

This guide will help you deploy the Survey Platform to production.

**Author:** Naveed Arif | Global Outreach | naveed@globaloutreach.co

## Pre-Deployment Checklist

- [ ] Review [SECURITY.md](SECURITY.md) checklist
- [ ] Set strong `JWT_SECRET` (generate with: `openssl rand -base64 32`)
- [ ] Configure production database
- [ ] Set up SMTP for email notifications
- [ ] Test all features in staging environment
- [ ] Backup existing data (if upgrading)

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel provides seamless Next.js deployment with built-in optimizations.

#### Steps:

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for production"
   git push origin main
   ```

2. **Import Project in Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. **Configure Environment Variables**
   Add all variables from `.env.local`:
   - `DB_HOST`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
   - `JWT_SECRET` (generate a new one!)
   - `SMTP_HOST` (optional)
   - `SMTP_PORT` (optional)
   - `SMTP_SECURE` (optional)
   - `SMTP_USER` (optional)
   - `SMTP_PASSWORD` (optional)
   - `NODE_ENV=production`

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

5. **Set Up Database**
   - Use a managed MySQL service (e.g., PlanetScale, AWS RDS, DigitalOcean)
   - Run the database setup:
     ```bash
     npm run setup-db
     ```
   - Or import the dump:
     ```bash
     mysql -u user -p database < database/dump.sql
     ```

6. **Create Admin User**
   ```bash
   npm run create-admin
   ```

### Option 2: Self-Hosted (VPS/Server)

#### Prerequisites:
- Ubuntu 20.04+ or similar Linux distribution
- Node.js 18+ installed
- MySQL 8.0+ installed
- Nginx (for reverse proxy)
- PM2 (for process management)

#### Steps:

1. **Clone Repository**
   ```bash
   git clone <your-repo-url>
   cd Survey
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**
   ```bash
   cp .env.example .env.local
   nano .env.local  # Edit with your values
   ```

4. **Build Application**
   ```bash
   npm run build
   ```

5. **Set Up Database**
   ```bash
   npm run setup-db
   npm run create-admin
   ```

6. **Install PM2**
   ```bash
   npm install -g pm2
   ```

7. **Start Application with PM2**
   ```bash
   pm2 start npm --name "survey-app" -- start
   pm2 save
   pm2 startup
   ```

8. **Configure Nginx**

   Create `/etc/nginx/sites-available/survey-app`:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/survey-app /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

9. **Set Up SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

### Option 3: Docker

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Create docker-compose.yml**
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - DB_HOST=db
         - DB_USER=survey_user
         - DB_PASSWORD=your_password
         - DB_NAME=survey_app
         - JWT_SECRET=your_jwt_secret
       depends_on:
         - db
     
     db:
       image: mysql:8.0
       environment:
         - MYSQL_ROOT_PASSWORD=root_password
         - MYSQL_DATABASE=survey_app
         - MYSQL_USER=survey_user
         - MYSQL_PASSWORD=your_password
       volumes:
         - db_data:/var/lib/mysql
         - ./database/dump.sql:/docker-entrypoint-initdb.d/dump.sql
   
   volumes:
     db_data:
   ```

3. **Deploy**
   ```bash
   docker-compose up -d
   ```

## Post-Deployment

1. **Verify Deployment**
   - Test login functionality
   - Create a test survey
   - Submit a test response
   - Check email notifications (if configured)

2. **Monitor Application**
   - Check application logs
   - Monitor database connections
   - Set up error tracking (e.g., Sentry)

3. **Set Up Backups**
   - Schedule regular database backups
   - Store backups securely
   - Test backup restoration

4. **Performance Optimization**
   - Enable caching where appropriate
   - Monitor response times
   - Optimize database queries if needed

## Troubleshooting

### Application Won't Start
- Check environment variables are set correctly
- Verify database connection
- Check application logs: `pm2 logs` or `docker logs`

### Database Connection Errors
- Verify database credentials
- Check database is accessible from application server
- Ensure firewall allows connections

### Email Not Sending
- Verify SMTP credentials
- Check SMTP server allows connections
- Review email service logs

## Maintenance

### Regular Updates
```bash
# Pull latest changes
git pull origin main

# Update dependencies
npm install

# Rebuild
npm run build

# Restart application
pm2 restart survey-app
# or
docker-compose restart
```

### Database Backups
```bash
# Create backup
mysqldump -u user -p survey_app > backup_$(date +%Y%m%d).sql

# Restore backup
mysql -u user -p survey_app < backup_20240101.sql
```

## Support

For deployment issues:
- Check application logs
- Review [SECURITY.md](SECURITY.md)
- Check [README.md](README.md) troubleshooting section

