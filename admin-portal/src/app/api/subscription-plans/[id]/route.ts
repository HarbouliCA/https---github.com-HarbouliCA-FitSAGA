import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }
    
    // Await params before accessing its properties
    const resolvedParams = await params;
    const planId = resolvedParams.id;
    const planDoc = await db.collection('subscriptionPlans').doc(planId).get();
    
    if (!planDoc.exists) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      id: planDoc.id,
      ...planDoc.data()
    });
  } catch (error) {
    console.error('Error fetching subscription plan:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }
    
    // Await params before accessing its properties
    const resolvedParams = await params;
    const planId = resolvedParams.id;
    const planData = await request.json();
    
    // Validate plan exists
    const planRef = db.collection('subscriptionPlans').doc(planId);
    const planDoc = await planRef.get();
    
    if (!planDoc.exists) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    
    // Update plan
    const updateData = {
      ...planData,
      updatedAt: new Date()
    };
    
    await planRef.update(updateData);
    
    return NextResponse.json({
      id: planId,
      ...updateData
    });
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }
    
    // Await params before accessing its properties
    const resolvedParams = await params;
    const planId = resolvedParams.id;
    
    // Check if plan exists
    const planRef = db.collection('subscriptionPlans').doc(planId);
    const planDoc = await planRef.get();
    
    if (!planDoc.exists) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    
    // TODO: Check if any clients are using this plan before deletion
    
    // Delete plan
    await planRef.delete();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subscription plan:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}