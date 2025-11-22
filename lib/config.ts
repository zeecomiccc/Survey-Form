/**
 * Application configuration
 * Centralized configuration values from environment variables
 */

export const config = {
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Survey Platform',
    description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'A modern survey platform for creating, sharing, and analyzing surveys',
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME || 'survey_app',
  },
  jwt: {
    secret: process.env.JWT_SECRET || '',
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
  },
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
};

