import nodemailer from 'nodemailer';
import { Survey, SurveyResponse } from '@/types/survey';
import { getPool } from '@/lib/db';

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

// Get user email by user ID
async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const pool = getPool();
    const [users] = await pool.execute(
      'SELECT email FROM users WHERE id = ?',
      [userId]
    ) as any[];

    if (users.length > 0) {
      return users[0].email;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user email:', error);
    return null;
  }
}

// Format answer value for email (returns HTML string)
function formatAnswerValue(value: any, question: any): string {
  // Handle multiple-choice (array of option IDs)
  if (Array.isArray(value)) {
    if (question.type === 'multiple-choice' && question.options) {
      const labels = value.map((optionId: string) => {
        const option = question.options.find((o: any) => o.id === optionId);
        return option ? option.label : optionId;
      });
      // Return as HTML list items, one per line
      return labels.map(label => `• ${label}`).join('<br>');
    }
    return value.map(v => `• ${v}`).join('<br>');
  }
  
  // Handle single-choice (option ID)
  if (typeof value === 'string' && (question.type === 'single-choice' || question.type === 'yes-no')) {
    if (question.type === 'yes-no') {
      return value.charAt(0).toUpperCase() + value.slice(1);
    }
    if (question.options) {
      const option = question.options.find((o: any) => o.id === value);
      return option ? option.label : value;
    }
  }
  
  // Handle rating (number)
  if (typeof value === 'number') {
    return value.toString();
  }
  
  // Handle text/textarea/date
  return value || 'N/A';
}

// Send email notification when a survey response is submitted
export async function sendSurveySubmissionEmail(
  survey: Survey,
  response: SurveyResponse
): Promise<boolean> {
  try {
    // Check if email notifications are enabled for this survey
    const pool = getPool();
    const [surveys] = await pool.execute(
      'SELECT email_notifications_enabled, user_id FROM surveys WHERE id = ?',
      [survey.id]
    ) as any[];

    if (surveys.length === 0 || !surveys[0].email_notifications_enabled) {
      return false; // Notifications not enabled
    }

    const userId = surveys[0].user_id;
    const userEmail = await getUserEmail(userId);

    if (!userEmail) {
      console.error('User email not found for user ID:', userId);
      return false;
    }

    // Check if SMTP is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.warn('SMTP not configured. Email notification skipped.');
      return false;
    }

    const transporter = createTransporter();

    // Build email content
    const answersHtml = response.answers.map((answer, index) => {
      const question = survey.questions.find(q => q.id === answer.questionId);
      if (!question) return '';

      const answerText = formatAnswerValue(answer.value, question);
      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; vertical-align: top; width: 200px;">
            ${question.title}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; vertical-align: top; line-height: 1.8;">
            ${answerText}
          </td>
        </tr>
      `;
    }).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 5px 5px; }
            table { width: 100%; border-collapse: collapse; background-color: white; }
            .submitted-time { color: #6b7280; font-size: 14px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0;">New Survey Response Received</h2>
            </div>
            <div class="content">
              <p>You have received a new response for your survey: <strong>${survey.title}</strong></p>
              
              <h3 style="margin-top: 20px; margin-bottom: 10px;">Response Details:</h3>
              <table>
                ${answersHtml}
              </table>
              
              <p class="submitted-time">
                Submitted at: ${new Date(response.submittedAt).toLocaleString()}
              </p>
            </div>
            <div class="footer">
              <p>This is an automated notification from your Survey Platform.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: `"Survey Platform" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `New Response: ${survey.title}`,
      html: emailHtml,
    };

    await transporter.sendMail(mailOptions);
    console.log('Email notification sent successfully to:', userEmail);
    return true;
  } catch (error) {
    console.error('Error sending email notification:', error);
    return false;
  }
}

