import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { cleanQuestionTitle } from '@/lib/utils';
import { Survey, Question } from '@/types/survey';

// GET all surveys (filtered by user)
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getPool();
    
    // Admin sees all surveys, users see only their own
    // Exclude soft-deleted surveys (deleted_at IS NULL)
    let query = 'SELECT id, user_id as userId, title, description, email_notifications_enabled as emailNotificationsEnabled, published, created_at as createdAt, updated_at as updatedAt FROM surveys WHERE deleted_at IS NULL';
    let params: any[] = [];
    
    if (currentUser.role !== 'admin') {
      query += ' AND user_id = ?';
      params.push(currentUser.id);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [surveys] = await pool.execute(query, params) as any[];

    // Get questions for each survey
    const surveysWithQuestions = await Promise.all(
      surveys.map(async (survey: any) => {
        const [questions] = await pool.execute(
          `SELECT id, type, title, description, required, min_rating as minRating, 
           max_rating as maxRating, \`order\` 
           FROM questions WHERE survey_id = ? ORDER BY \`order\` ASC`,
          [survey.id]
        ) as any[];

        // Get options for each question
        const questionsWithOptions = await Promise.all(
          questions.map(async (question: any) => {
            // Clean and trim the title to remove any unwanted characters
            // Use the utility function for consistent cleaning
            const cleanTitle = cleanQuestionTitle(question.title);
            
            const cleanedQuestion = {
              ...question,
              title: cleanTitle,
              required: Boolean(question.required), // Convert to boolean (MySQL returns 0/1)
            };
            
            if (['multiple-choice', 'single-choice'].includes(question.type)) {
              const [options] = await pool.execute(
                'SELECT id, label FROM question_options WHERE question_id = ? ORDER BY id ASC',
                [question.id]
              ) as any[];
              return { ...cleanedQuestion, options };
            }
            return cleanedQuestion;
          })
        );

        return { ...survey, questions: questionsWithOptions };
      })
    );

    return NextResponse.json(surveysWithQuestions);
  } catch (error: any) {
    console.error('Error fetching surveys:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create new survey
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getPool();
    const survey: Survey = await request.json();

    // Validate survey has at least one question
    if (!survey.questions || survey.questions.length === 0) {
      return NextResponse.json({ error: 'Survey must have at least one question' }, { status: 400 });
    }

    // Validate that at least one question has a title
    const validQuestions = survey.questions.filter(q => q.title && q.title.trim());
    if (validQuestions.length === 0) {
      return NextResponse.json({ error: 'Survey must have at least one question with a title' }, { status: 400 });
    }

    // Insert survey with user_id
    await pool.execute(
      'INSERT INTO surveys (id, user_id, title, description) VALUES (?, ?, ?, ?)',
      [survey.id, currentUser.id, survey.title, survey.description || null]
    );

    // Insert questions
    for (const question of survey.questions) {
      // Clean title - remove trailing zeros and trim
      const cleanTitle = cleanQuestionTitle(question.title);
      
      await pool.execute(
        `INSERT INTO questions (id, survey_id, type, title, description, required, min_rating, max_rating, \`order\`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          question.id,
          survey.id,
          question.type,
          cleanTitle,
          question.description || null,
          question.required,
          question.minRating || null,
          question.maxRating || null,
          question.order,
        ]
      );

      // Insert options if needed
      if (question.options && question.options.length > 0) {
        for (const option of question.options) {
          await pool.execute(
            'INSERT INTO question_options (id, question_id, label) VALUES (?, ?, ?)',
            [option.id, question.id, option.label]
          );
        }
      }
    }

    return NextResponse.json({ success: true, survey });
  } catch (error: any) {
    console.error('Error creating survey:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT update survey
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getPool();
    const survey: Survey = await request.json();

    // Check if user has access (exclude soft-deleted surveys)
    const [surveys] = await pool.execute(
      'SELECT user_id FROM surveys WHERE id = ? AND deleted_at IS NULL',
      [survey.id]
    ) as any[];

    if (surveys.length === 0) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    if (currentUser.role !== 'admin' && surveys[0].user_id !== currentUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate survey has at least one question
    if (!survey.questions || survey.questions.length === 0) {
      return NextResponse.json({ error: 'Survey must have at least one question' }, { status: 400 });
    }

    // Validate that at least one question has a title
    const validQuestions = survey.questions.filter(q => q.title && q.title.trim());
    if (validQuestions.length === 0) {
      return NextResponse.json({ error: 'Survey must have at least one question with a title' }, { status: 400 });
    }

    // Update survey
    await pool.execute(
      'UPDATE surveys SET title = ?, description = ? WHERE id = ?',
      [survey.title, survey.description || null, survey.id]
    );

    // Delete existing questions and options
    await pool.execute('DELETE FROM question_options WHERE question_id IN (SELECT id FROM questions WHERE survey_id = ?)', [survey.id]);
    await pool.execute('DELETE FROM questions WHERE survey_id = ?', [survey.id]);

    // Insert updated questions
    for (const question of survey.questions) {
      // Clean title - remove trailing zeros and trim
      const cleanTitle = cleanQuestionTitle(question.title);
      
      await pool.execute(
        `INSERT INTO questions (id, survey_id, type, title, description, required, min_rating, max_rating, \`order\`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          question.id,
          survey.id,
          question.type,
          cleanTitle,
          question.description || null,
          question.required,
          question.minRating || null,
          question.maxRating || null,
          question.order,
        ]
      );

      // Insert options if needed
      if (question.options && question.options.length > 0) {
        for (const option of question.options) {
          await pool.execute(
            'INSERT INTO question_options (id, question_id, label) VALUES (?, ?, ?)',
            [option.id, question.id, option.label]
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating survey:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

