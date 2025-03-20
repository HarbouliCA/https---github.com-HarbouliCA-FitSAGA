import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { SubscriptionPlan } from '@/types/subscriptionPlan';
import { DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore';

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }
    
    const plansSnapshot = await db.collection('subscriptionPlans').get();
    const plans = plansSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      id: doc.id,
      ...doc.data()
    })) as SubscriptionPlan[];
    
    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }
    
    const planData = await request.json();
    
    // Validate required fields
    if (!planData.name || !planData.price || planData.credits === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Add timestamp
    const now = new Date();
    const planWithTimestamp = {
      ...planData,
      createdAt: now,
      updatedAt: now
    };
    
    // Create new plan in Firestore
    const docRef = await db.collection('subscriptionPlans').add(planWithTimestamp);
    
    return NextResponse.json({ 
      id: docRef.id,
      ...planWithTimestamp
    });
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}