import { NextRequest, NextResponse } from 'next/server';
import { initAdminSDK } from '@/lib/firebase-admin';

// Initialize Firebase Admin SDK
const { db: adminDb, auth: adminAuth } = initAdminSDK();

// PATCH /api/clients/[id]/access - Change client access status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id;
    const { status, reason } = await request.json();
    
    if (!status || !['active', 'suspended', 'inactive'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status (active, suspended, or inactive) is required' },
        { status: 400 }
      );
    }
    
    // Get client document
    const clientRef = adminDb.collection('clients').doc(clientId);
    const clientDoc = await clientRef.get();
    
    if (!clientDoc.exists) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }
    
    const clientData = clientDoc.data();
    const previousStatus = clientData?.accessStatus || 'active';
    
    // Update client access status in Firestore
    await clientRef.update({
      accessStatus: status,
      updatedAt: new Date()
    });
    
    // Update user disabled status in Firebase Auth
    await adminAuth.updateUser(clientId, {
      disabled: status === 'suspended'
    });
    
    // Record access status change
    await adminDb.collection('accessStatusChanges').add({
      clientId,
      previousStatus,
      newStatus: status,
      reason: reason || `Access status changed to ${status}`,
      timestamp: new Date(),
      adminId: request.headers.get('X-Admin-Id') || 'system'
    });
    
    return NextResponse.json({
      success: true,
      previousStatus,
      newStatus: status
    });
  } catch (error) {
    console.error('Error changing client access status:', error);
    return NextResponse.json(
      { error: 'Failed to change client access status' },
      { status: 500 }
    );
  }
}
