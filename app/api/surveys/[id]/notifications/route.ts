import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// PUT toggle email notifications for a survey
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
    const { enabled } = await request.json();

    // Check if user has access
    const [surveys] = await pool.execute(
      'SELECT user_id FROM surveys WHERE id = ?',
      [surveyId]
    ) as any[];

    if (surveys.length === 0) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    if (currentUser.role !== 'admin' && surveys[0].user_id !== currentUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update email notifications setting
    await pool.execute(
      'UPDATE surveys SET email_notifications_enabled = ? WHERE id = ?',
      [enabled === true, surveyId]
    );

    return NextResponse.json({ success: true, enabled });
  } catch (error: any) {
    console.error('Error updating email notifications:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

