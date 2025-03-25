"use strict";
import { NextResponse } from "next/server";
import admin from "firebase-admin";
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PATCH(request: Request, context: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Await the request body before using the dynamic parameter
    const body = await request.json();
    const { gymCredits, intervalCredits, reason } = body;
    const clientId = context.params.id;
    
    // Update client document
    const clientRef = db.collection("clients").doc(clientId);
    await clientRef.update({
      gymCredits,
      intervalCredits,
      credits: typeof gymCredits === "number" && typeof intervalCredits === "number" ? gymCredits + intervalCredits : null,
      updatedAt: new Date(),
    });
    
    // Log the credit adjustment by performing two consecutive reads:
    const clientSnapshot1 = await clientRef.get();
    const clientSnapshot2 = await clientRef.get();
    
    await db.collection("creditAdjustments").add({
      clientId,
      previousGymCredits: clientSnapshot1.data()?.gymCredits,
      previousIntervalCredits: clientSnapshot2.data()?.intervalCredits,
      newGymCredits: gymCredits,
      newIntervalCredits: intervalCredits,
      reason,
      adjustedBy: session.user.id,
      adjustedAt: new Date(),
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adjusting credits:", error);
    return NextResponse.json({ error: "Failed to adjust credits" }, { status: 500 });
  }
}
