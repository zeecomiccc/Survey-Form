import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// PUT toggle publish status
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
    const { published } = await request.json();

    // Check if user has access (exclude soft-deleted surveys)
    const [surveys] = await pool.execute(
      'SELECT user_id, published FROM surveys WHERE id = ? AND deleted_at IS NULL',
      [surveyId]
    ) as any[];

    if (surveys.length === 0) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 });
    }

    if (currentUser.role !== 'admin' && surveys[0].user_id !== currentUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update published status
    await pool.execute(
      'UPDATE surveys SET published = ? WHERE id = ?',
      [published === true, surveyId]
    );

    return NextResponse.json({ success: true, published: published === true });
  } catch (error: any) {
    console.error('Error updating publish status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

