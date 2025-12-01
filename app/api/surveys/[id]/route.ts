import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { cleanQuestionTitle } from '@/lib/utils';

// GET single survey (public access for viewing, no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pool = getPool();
    const surveyId = params.id;

    console.log('Fetching survey with ID:', surveyId);

    // Get survey (public access - anyone with the link can view)
    // Exclude soft-deleted surveys
    // Check if survey is published (for link access)
    const [surveys] = await pool.execute(
      'SELECT id, user_id as userId, title, description, email_notifications_enabled as emailNotificationsEnabled, published, created_at as createdAt, updated_at as updatedAt FROM surveys WHERE id = ? AND deleted_at IS NULL',
      [surveyId]
    ) as any[];

    console.log('Survey query result:', surveys.length, 'surveys found');

    if (surveys.length === 0) {
      console.log('Survey not found in database for ID:', surveyId);
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    // Get questions
    const [questions] = await pool.execute(
      `SELECT id, type, title, description, required, min_rating as minRating, 
       max_rating as maxRating, \`order\` 
       FROM questions WHERE survey_id = ? ORDER BY \`order\` ASC`,
      [surveyId]
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
            'SELECT id, label FROM question_options WHERE question_id = ? ORDER BY `order` ASC',
            [question.id]
          ) as any[];
          return { ...cleanedQuestion, options };
        }
        return cleanedQuestion;
      })
    );

    console.log('Returning survey with', questionsWithOptions.length, 'questions');
    return NextResponse.json({ ...surveys[0], questions: questionsWithOptions });
  } catch (error: any) {
    console.error('Error fetching survey:', error);
    console.error('Error details:', error.message, error.stack);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// PUT update survey
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getPool();
    const surveyId = params.id;
    const survey: any = await request.json();

    // Check if user has access (exclude soft-deleted surveys)
    const [surveys] = await pool.execute(
      'SELECT user_id FROM surveys WHERE id = ? AND deleted_at IS NULL',
      [surveyId]
    ) as any[];

    if (surveys.length === 0) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    if (currentUser.role !== 'admin' && surveys[0].user_id !== currentUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update survey
    await pool.execute(
      'UPDATE surveys SET title = ?, description = ? WHERE id = ?',
      [survey.title, survey.description || null, surveyId]
    );

    // Delete existing questions and options
    await pool.execute('DELETE FROM question_options WHERE question_id IN (SELECT id FROM questions WHERE survey_id = ?)', [surveyId]);
    await pool.execute('DELETE FROM questions WHERE survey_id = ?', [surveyId]);

    // Insert updated questions
    for (const question of survey.questions) {
      // Clean title - remove trailing zeros and trim
      const cleanTitle = cleanQuestionTitle(question.title);
      
      await pool.execute(
        `INSERT INTO questions (id, survey_id, type, title, description, required, min_rating, max_rating, \`order\`)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          question.id,
          surveyId,
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
        for (let i = 0; i < question.options.length; i++) {
          const option = question.options[i];
          await pool.execute(
            'INSERT INTO question_options (id, question_id, label, `order`) VALUES (?, ?, ?, ?)',
            [option.id, question.id, option.label, i]
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

// DELETE survey
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getPool();
    const surveyId = params.id;

    // Check if user has access (exclude soft-deleted surveys)
    const [surveys] = await pool.execute(
      'SELECT user_id FROM surveys WHERE id = ? AND deleted_at IS NULL',
      [surveyId]
    ) as any[];

    if (surveys.length === 0) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    if (currentUser.role !== 'admin' && surveys[0].user_id !== currentUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete - set deleted_at timestamp instead of hard delete
    await pool.execute(
      'UPDATE surveys SET deleted_at = NOW() WHERE id = ?',
      [surveyId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting survey:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

