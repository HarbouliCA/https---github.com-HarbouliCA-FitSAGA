import { NextRequest, NextResponse } from 'next/server';
import { getContract, uploadContractPdf } from '@/lib/dataAccess/contracts';
import { embedSignatureInPdf } from '@/services/contractService';
import { sendSignedContractEmail } from '@/services/emailService';
import { db } from '@/lib/firebaseAdmin';

// Using the correct pattern for Next.js App Router with async params
export async function POST(
  request: NextRequest,
  { params }: { params: { id?: string } }
) {
  try {
    // Validate contract ID
    if (!params?.id) {
      return NextResponse.json({ error: 'Contract ID is required' }, { status: 400 });
    }
    
    const contractId = params.id;
    
    // Get contract data
    const contract = await getContract(contractId);
    
    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }
    
    // Check if contract is already signed
    if (contract.status === 'signed') {
      return NextResponse.json(
        { error: 'Contract has already been signed' }, 
        { status: 400 }
      );
    }
    
    // Get signature data from request
    const { signature } = await request.json();
    
    if (!signature) {
      return NextResponse.json(
        { error: 'Signature is required' }, 
        { status: 400 }
      );
    }
    
    // Embed signature in PDF
    const signedPdfBuffer = await embedSignatureInPdf(
      contract.pdfUrl,
      signature,
      contract.clientName
    );
    
    // Upload signed PDF
    const signedPdfUrl = await uploadContractPdf(
      `${contractId}_signed`,
      Buffer.from(signedPdfBuffer)
    );
    
    // Update contract record with signature and status
    const now = new Date();
    
    // Check if db is defined before using it
    if (!db) {
      throw new Error('Firebase Firestore is not initialized');
    }
    
    await db.collection('contracts').doc(contractId).update({
      status: 'signed',
      signedAt: now,
      signedPdfUrl: signedPdfUrl
    });
    
    // Send confirmation email with signed contract
    try {
      await sendSignedContractEmail(
        contract.clientEmail,
        signedPdfUrl,
        contract.clientName
      );
    } catch (emailError) {
      console.error('Error sending signed contract email:', emailError);
      // Continue even if email fails
    }
    
    return NextResponse.json({ 
      success: true,
      signedPdfUrl,
      message: 'Contract signed successfully' 
    });
  } catch (error) {
    console.error('Error processing contract signature:', error);
    return NextResponse.json(
      { error: 'Failed to process contract signature' }, 
      { status: 500 }
    );
  }
}
