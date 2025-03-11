import { NextRequest, NextResponse } from 'next/server';
import { getClient } from '@/lib/dataAccess/clients';
import { generateClientContract, createContractFromScratch } from '@/services/contractService';
import { createContractRecord, uploadContractPdf, updateContractUrl } from '@/lib/dataAccess/contracts';
import { sendContractEmail } from '@/services/emailService';
import fs from 'fs/promises';
import path from 'path';

// Using the correct pattern for Next.js App Router dynamic routes
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate client ID
    const clientId = params.id;
    
    // Get client data
    const client = await getClient(clientId);
    
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    // Check if we should send email
    const { sendEmail = true } = await request.json();
    
    // Get template path
    const templatePath = path.join(process.cwd(), 'templates', 'contract-template.pdf');
    
    // Generate contract PDF
    let contractPdf: Buffer;
    
    try {
      // Try to use template
      contractPdf = await generateClientContract(client, templatePath);
    } catch (error) {
      console.log('Template not found, creating contract from scratch');
      // If template doesn't exist, create from scratch
      contractPdf = await createContractFromScratch(client);
    }
    
    // Create contract record in database
    const contractId = await createContractRecord({
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.email,
      status: 'pending_signature',
      createdAt: new Date(),
      pdfUrl: '',
    });
    
    // Upload PDF to storage
    const contractUrl = await uploadContractPdf(contractId, contractPdf);
    
    // Update contract record with URL
    await updateContractUrl(contractId, contractUrl);
    
    // Send email if requested
    let emailResult = null;
    let emailError = null;
    
    if (sendEmail) {
      try {
        emailResult = await sendContractEmail(
          client.email,
          contractUrl,
          client.name,
          contractId
        );
      } catch (error) {
        console.error('Error sending contract email:', error);
        emailError = 'Failed to send email, but contract was generated successfully';
      }
    }
    
    return NextResponse.json({
      success: true,
      contractId,
      contractUrl,
      emailSent: !!emailResult,
      emailError,
      message: emailError ? 'Contract generated but email failed' : 'Contract generated and email sent'
    });
  } catch (error) {
    console.error('Error handling contract generation:', error);
    return NextResponse.json(
      { error: 'Failed to generate contract' },
      { status: 500 }
    );
  }
}
