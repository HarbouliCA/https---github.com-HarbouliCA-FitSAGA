import { NextRequest, NextResponse } from 'next/server';
import { initAdminSDK } from '@/lib/firebase-admin';

// Initialize Firebase Admin SDK
const { db: adminDb } = initAdminSDK();

// PATCH /api/clients/[id]/credits - Adjust client credits
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id;
    const { amount, reason } = await request.json();
    
    if (typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'Amount must be a number' },
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
    const currentCredits = clientData?.credits || 0;
    const newCredits = Math.max(0, currentCredits + amount); // Ensure credits don't go below 0
    
    // Update client credits
    await clientRef.update({
      credits: newCredits,
      updatedAt: new Date()
    });
    
    // Record credit transaction
    await adminDb.collection('creditTransactions').add({
      clientId,
      amount,
      reason: reason || (amount > 0 ? 'Credit adjustment' : 'Credit deduction'),
      previousBalance: currentCredits,
      newBalance: newCredits,
      timestamp: new Date(),
      adminId: request.headers.get('X-Admin-Id') || 'system'
    });
    
    return NextResponse.json({
      success: true,
      previousCredits: currentCredits,
      newCredits,
      adjustment: amount
    });
  } catch (error) {
    console.error('Error adjusting client credits:', error);
    return NextResponse.json(
      { error: 'Failed to adjust client credits' },
      { status: 500 }
    );
  }
}
