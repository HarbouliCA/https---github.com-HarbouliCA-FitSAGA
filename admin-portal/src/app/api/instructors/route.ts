import { NextResponse } from 'next/server';
import { adminAuth, adminFirestore } from '@/lib/firebase-admin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Instructor } from '@/types';

export async function POST(request: Request) {
  try {
    // Check if user is authenticated and is admin
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Validate request body
    let data;
    try {
      data = await request.json();
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid request body - JSON parsing failed' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!data.email || !data.password || !data.fullName || !data.dateOfBirth || !data.telephone || !data.workingSince || !data.address || !data.bankDetails) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate bank details
    if (!data.bankDetails.bankName || !data.bankDetails.accountHolder || !data.bankDetails.accountNumber) {
      return NextResponse.json(
        { message: 'Missing required bank details' },
        { status: 400 }
      );
    }

    // Check if Firebase Admin is initialized
    if (!adminAuth || !adminFirestore) {
      console.error('Firebase Admin not initialized');
      return NextResponse.json(
        { message: 'Internal server error - Firebase Admin not initialized' },
        { status: 500 }
      );
    }

    // Create the user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email: data.email,
      password: data.password,
      displayName: data.fullName,
      disabled: false
    });

    // Set custom claims for the instructor role
    await adminAuth.setCustomUserClaims(userRecord.uid, {
      role: 'instructor'
    });

    // Create instructor document in Firestore
    const now = new Date();
    const instructorData: Omit<Instructor, 'photoURL' | 'lastActive'> = {
      uid: userRecord.uid,
      fullName: data.fullName,
      email: data.email,
      dateOfBirth: new Date(data.dateOfBirth),
      telephone: data.telephone,
      workingSince: new Date(data.workingSince),
      address: data.address,
      bankDetails: {
        bankName: data.bankDetails.bankName,
        accountHolder: data.bankDetails.accountHolder,
        accountNumber: data.bankDetails.accountNumber,
        // Only include IBAN if it exists and is not empty
        ...(data.bankDetails.iban && { iban: data.bankDetails.iban })
      },
      role: 'instructor',
      accessStatus: 'green',
      createdAt: now,
      updatedAt: now
    };

    // Add optional fields if they exist
    const finalInstructorData = {
      ...instructorData,
      ...(data.photoURL && {
        photoURL: (() => {
          try {
            const url = new URL(data.photoURL);
            return url.protocol === 'http:' || url.protocol === 'https:' ? data.photoURL : null;
          } catch {
            return null;
          }
        })()
      }),
      lastActive: now
    };

    // Only update auth profile if photoURL is valid
    if (finalInstructorData.photoURL) {
      await adminAuth.updateUser(userRecord.uid, { photoURL: finalInstructorData.photoURL });
    }

    await adminFirestore.collection('instructors').doc(userRecord.uid).set(finalInstructorData);

    return NextResponse.json({ 
      uid: userRecord.uid,
      message: 'Instructor created successfully'
    });
  } catch (error) {
    console.error('Error creating instructor:', error);
    
    // Handle specific Firebase Auth errors
    if (error instanceof Error) {
      if (error.message.includes('auth/email-already-exists')) {
        return NextResponse.json(
          { message: 'Email already exists' },
          { status: 409 }
        );
      }
      if (error.message.includes('auth/invalid-email')) {
        return NextResponse.json(
          { message: 'Invalid email format' },
          { status: 400 }
        );
      }
      if (error.message.includes('auth/weak-password')) {
        return NextResponse.json(
          { message: 'Password is too weak' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to create instructor' },
      { status: 500 }
    );
  }
}
