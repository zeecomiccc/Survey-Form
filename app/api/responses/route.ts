import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { SurveyResponse, Answer, Survey } from '@/types/survey';
import { v4 as uuidv4 } from 'uuid';
import { sendSurveySubmissionEmail } from '@/lib/email';
import { apiRateLimit } from '@/lib/rate-limit';
import crypto from 'crypto';

// Force dynamic rendering (can't be statically generated due to searchParams and database access)
export const dynamic = 'force-dynamic';

// GET responses for a survey
export async function GET(request: NextRequest) {
  try {
    const pool = getPool();
    const surveyId = request.nextUrl.searchParams.get('surveyId');

    if (!surveyId) {
      return NextResponse.json({ error: 'surveyId is required' }, { status: 400 });
    }

    // Get all responses for the survey
    const [responses] = await pool.execute(
      'SELECT id, survey_id as surveyId, link_token as linkToken, submitted_at as submittedAt FROM survey_responses WHERE survey_id = ? ORDER BY submitted_at DESC',
      [surveyId]
    ) as any[];

    // Get answers for each response
    const responsesWithAnswers = await Promise.all(
      responses.map(async (response: any) => {
        const [answers] = await pool.execute(
          `SELECT a.id, a.question_id as questionId, a.value_text as valueText, a.value_number as valueNumber
           FROM answers a WHERE a.response_id = ?`,
          [response.id]
        ) as any[];

        // Get option selections for multiple-choice answers
        const answersWithOptions = await Promise.all(
          answers.map(async (answer: any) => {
            const [optionIds] = await pool.execute(
              `SELECT ao.option_id as optionId 
               FROM answer_options ao WHERE ao.answer_id = ?`,
              [answer.id]
            ) as any[];

            if (optionIds.length > 0) {
              return {
                questionId: answer.questionId,
                value: optionIds.map((o: any) => o.optionId),
              };
            }

            // Return text or number value
            return {
              questionId: answer.questionId,
              value: answer.valueNumber !== null ? answer.valueNumber : answer.valueText,
            };
          })
        );

        return {
          id: response.id,
          surveyId: response.surveyId,
          linkToken: response.linkToken,
          answers: answersWithOptions,
          submittedAt: response.submittedAt,
        };
      })
    );

    return NextResponse.json(responsesWithAnswers);
  } catch (error: any) {
    console.error('Error fetching responses:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create new response
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting to prevent spam
    const rateLimitResponse = await apiRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const pool = getPool();
    const response: SurveyResponse = await request.json();

    // Generate device fingerprint from IP and User-Agent
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const deviceFingerprint = crypto
      .createHash('sha256')
      .update(`${ip}:${userAgent}`)
      .digest('hex')
      .substring(0, 32);

    // Convert ISO 8601 timestamp to MySQL datetime format (YYYY-MM-DD HH:MM:SS)
    const submittedAt = response.submittedAt 
      ? new Date(response.submittedAt).toISOString().slice(0, 19).replace('T', ' ')
      : new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Use a transaction to make check and insert atomic, preventing race conditions
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Check if this device has already submitted this survey
      try {
        const [existing] = await connection.execute(
          'SELECT id FROM survey_responses WHERE survey_id = ? AND device_fingerprint = ? FOR UPDATE',
          [response.surveyId, deviceFingerprint]
        ) as any[];
        
        if (existing.length > 0) {
          await connection.rollback();
          connection.release();
          return NextResponse.json({ 
            error: 'You have already submitted this survey on this device. Each device can only submit once per survey.' 
          }, { status: 409 });
        }
      } catch (checkError: any) {
        // If column doesn't exist, skip the check (backward compatibility)
        if (checkError.code === 'ER_BAD_FIELD_ERROR' && checkError.sqlMessage?.includes('device_fingerprint')) {
          console.warn('device_fingerprint column does not exist. Skipping device check. Please run database migration.');
        } else {
          throw checkError;
        }
      }

      // Insert response (within transaction)
      // Allow multiple submissions per link token - no restriction
      // Only store linkToken if it's provided and not empty
      const linkTokenValue = (response.linkToken && response.linkToken.trim() !== '') 
        ? response.linkToken.trim() 
        : null;
      
      try {
        // Try to insert with device_fingerprint first
        await connection.execute(
          'INSERT INTO survey_responses (id, survey_id, link_token, device_fingerprint, submitted_at) VALUES (?, ?, ?, ?, ?)',
          [response.id, response.surveyId, linkTokenValue, deviceFingerprint, submittedAt]
        );
      } catch (insertError: any) {
        // If column doesn't exist, insert without device_fingerprint (backward compatibility)
        if (insertError.code === 'ER_BAD_FIELD_ERROR' && insertError.sqlMessage?.includes('device_fingerprint')) {
          await connection.execute(
            'INSERT INTO survey_responses (id, survey_id, link_token, submitted_at) VALUES (?, ?, ?, ?)',
            [response.id, response.surveyId, linkTokenValue, submittedAt]
          );
        } else if (insertError.code === 'ER_DUP_ENTRY' && insertError.sqlMessage?.includes('unique_device_survey')) {
          // Handle duplicate key error (race condition or device already submitted)
          await connection.rollback();
          connection.release();
          return NextResponse.json({ 
            error: 'You have already submitted this survey on this device. Each device can only submit once per survey.' 
          }, { status: 409 });
        } else {
          // Re-throw other errors
          throw insertError;
        }
      }

      // Insert answers (within transaction)
      for (const answer of response.answers) {
        const answerId = uuidv4();
        await connection.execute(
          `INSERT INTO answers (id, response_id, question_id, value_text, value_number)
           VALUES (?, ?, ?, ?, ?)`,
          [
            answerId,
            response.id,
            answer.questionId,
            typeof answer.value === 'string' ? answer.value : null,
            typeof answer.value === 'number' ? answer.value : null,
          ]
        );

        // If it's an array (multiple choice), insert into answer_options
        if (Array.isArray(answer.value)) {
          for (const optionId of answer.value) {
            await connection.execute(
              'INSERT INTO answer_options (id, answer_id, option_id) VALUES (?, ?, ?)',
              [uuidv4(), answerId, optionId]
            );
          }
        }
      }

      // Commit transaction - all inserts successful
      await connection.commit();
    } catch (transactionError: any) {
      // Rollback transaction on any error
      await connection.rollback();
      throw transactionError;
    } finally {
      // Always release the connection back to the pool
      connection.release();
    }

    // Send email notification if enabled
    try {
      // Fetch the survey to get questions for email (only if not soft-deleted)
      const [surveys] = await pool.execute(
        'SELECT id, user_id, title, description, email_notifications_enabled FROM surveys WHERE id = ? AND deleted_at IS NULL',
        [response.surveyId]
      ) as any[];

      if (surveys.length > 0 && surveys[0].email_notifications_enabled) {
        // Get questions for the survey
        const [questions] = await pool.execute(
          `SELECT id, type, title, description, required, min_rating as minRating, 
           max_rating as maxRating, \`order\` 
           FROM questions WHERE survey_id = ? ORDER BY \`order\` ASC`,
          [response.surveyId]
        ) as any[];

        // Get options for each question
        const questionsWithOptions = await Promise.all(
          questions.map(async (question: any) => {
            if (['multiple-choice', 'single-choice'].includes(question.type)) {
              const [options] = await pool.execute(
                'SELECT id, label FROM question_options WHERE question_id = ? ORDER BY `order` ASC',
                [question.id]
              ) as any[];
              return { ...question, options };
            }
            return question;
          })
        );

        const survey: Survey = {
          id: surveys[0].id,
          title: surveys[0].title,
          description: surveys[0].description,
          questions: questionsWithOptions,
          createdAt: '',
          updatedAt: '',
        };

        // Send email asynchronously (don't wait for it)
        sendSurveySubmissionEmail(survey, response).catch((error) => {
          console.error('Failed to send email notification:', error);
        });
      }
    } catch (emailError) {
      // Don't fail the response if email fails
      console.error('Error sending email notification:', emailError);
    }

    return NextResponse.json({ success: true, response });
  } catch (error: any) {
    console.error('Error creating response:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

