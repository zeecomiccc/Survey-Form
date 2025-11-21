# Email Notifications Setup

This application supports email notifications when survey responses are submitted. To enable this feature, you need to configure SMTP settings.

**Author:** Naveed Arif | Global Outreach | naveed@globaloutreach.co

## Setup Instructions

1. **Run the migration** to add the email notifications column to the database:
   ```bash
   npm run migrate-email
   ```

2. **Configure SMTP settings** in your `.env.local` file:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   ```

## Gmail Setup

If you're using Gmail:

1. Enable 2-Step Verification on your Google Account
2. Generate an App Password:
   - Go to your Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password in `SMTP_PASSWORD`

## Other Email Providers

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
```

### Yahoo
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
```

### Custom SMTP Server
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_SECURE=false  # or true for port 465
```

## Enabling Email Notifications

1. Go to the survey dashboard
2. Find the survey card
3. Check the "Email notifications" checkbox
4. You will now receive an email whenever someone submits a response to that survey

## Email Content

The email notification includes:
- Survey title
- All questions and answers from the submission
- Submission timestamp

## Troubleshooting

- **Emails not sending**: Check that SMTP credentials are correct in `.env.local`
- **Connection errors**: Verify SMTP host and port settings
- **Authentication errors**: Ensure you're using an app password (for Gmail) or correct credentials
- Check server logs for detailed error messages

