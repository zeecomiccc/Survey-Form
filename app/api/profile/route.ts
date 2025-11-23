import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getPool } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth';

// GET current user profile
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getPool();
    const [users] = await pool.execute(
      'SELECT id, email, name, role, created_at as createdAt FROM users WHERE id = ?',
      [currentUser.id]
    ) as any[];

    if (users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: users[0] });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT update profile (name and/or password)
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, currentPassword, newPassword } = await request.json();

    if (!name && !newPassword) {
      return NextResponse.json({ error: 'Name or new password is required' }, { status: 400 });
    }

    const pool = getPool();

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required to change password' }, { status: 400 });
      }

      // Get current password hash
      const [users] = await pool.execute(
        'SELECT password FROM users WHERE id = ?',
        [currentUser.id]
      ) as any[];

      if (users.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Verify current password
      const isValid = await verifyPassword(currentPassword, users[0].password);
      if (!isValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update password
      if (name) {
        // Update both name and password
        await pool.execute(
          'UPDATE users SET name = ?, password = ? WHERE id = ?',
          [name, hashedPassword, currentUser.id]
        );
      } else {
        // Update only password
        await pool.execute(
          'UPDATE users SET password = ? WHERE id = ?',
          [hashedPassword, currentUser.id]
        );
      }
    } else if (name) {
      // Update only name
      await pool.execute(
        'UPDATE users SET name = ? WHERE id = ?',
        [name, currentUser.id]
      );
    }

    // Get updated user
    const [updatedUsers] = await pool.execute(
      'SELECT id, email, name, role, created_at as createdAt FROM users WHERE id = ?',
      [currentUser.id]
    ) as any[];

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      user: updatedUsers[0]
    });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

