import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    
    if (token) {
      await deleteSession(token);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete('auth_token');
    
    return response;
  } catch (error: any) {
    console.error('Error logging out:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

