import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // Check if user is authenticated and is admin
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    
    // Create the user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email: data.email,
      password: data.password,
      displayName: data.fullName,
      photoURL: data.photoURL || null,
      disabled: false
    });

    // Set custom claims for the instructor role
    await adminAuth.setCustomUserClaims(userRecord.uid, {
      role: 'instructor'
    });

    return NextResponse.json({ uid: userRecord.uid });
  } catch (error) {
    console.error('Error creating instructor:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to create instructor' },
      { status: 500 }
    );
  }
}
