import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Client } from '@/types/client';
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';

/**
 * Generates a client contract PDF based on the template and client information
 */
export async function generateClientContract(client: Client, templatePath: string) {
  try {
    // Load template PDF
    const templateBytes = await fs.readFile(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    const form = pdfDoc.getForm();
    
    // Get the current date
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Fill in client details if form fields exist
    try {
      // These are the field names from our generated template
      form.getTextField('client.name')?.setText(client.name || '');
      form.getTextField('client.email')?.setText(client.email || '');
      form.getTextField('client.phone')?.setText(client.telephone || '');
      
      // Membership details
      form.getTextField('membership.type')?.setText('Premium Fitness Membership');
      form.getTextField('membership.startDate')?.setText(currentDate);
      
      // Calculate end date (1 year from now)
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);
      form.getTextField('membership.endDate')?.setText(endDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }));
      
      // Payment details
      form.getTextField('payment.amount')?.setText('$99.99');
      form.getTextField('payment.frequency')?.setText('Monthly');
    } catch (error) {
      console.warn('Some form fields were not found in the template', error);
      // Continue with the process even if some fields are missing
    }
    
    // Save and return as buffer
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error('Error generating contract:', error);
    throw error;
  }
}

/**
 * Creates a new PDF contract if no template is available
 */
export async function createContractFromScratch(client: Client) {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    
    // Add a title
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Set title
    page.drawText('FitSAGA MEMBERSHIP CONTRACT', {
      x: 50,
      y: 800,
      size: 18,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    
    // Add date
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    page.drawText(`Date: ${currentDate}`, {
      x: 50,
      y: 770,
      size: 12,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    // Add client information section
    page.drawText('CLIENT INFORMATION', {
      x: 50,
      y: 730,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    
    // Client details
    const clientDetails = [
      `Name: ${client.name}`,
      `Email: ${client.email}`,
      `Phone: ${client.telephone || 'N/A'}`,
      `Address: ${client.address || 'N/A'}`,
      `Member Since: ${client.memberSince 
        ? new Date(client.memberSince).toLocaleDateString() 
        : currentDate}`
    ];
    
    clientDetails.forEach((detail, index) => {
      page.drawText(detail, {
        x: 50,
        y: 700 - (index * 20),
        size: 12,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
    });
    
    // Add contract terms section
    page.drawText('CONTRACT TERMS AND CONDITIONS', {
      x: 50,
      y: 580,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    
    // Add some placeholder terms
    const terms = [
      '1. Membership Terms: This contract outlines the terms and conditions of your membership with FitSAGA.',
      '2. Payment: The member agrees to pay all fees associated with the membership plan selected.',
      '3. Rules and Regulations: The member agrees to follow all rules and regulations of FitSAGA facilities.',
      '4. Liability: FitSAGA is not liable for any injuries or damages that occur on the premises.',
      '5. Termination: FitSAGA reserves the right to terminate membership for violation of terms.',
      '6. Cancellation: Members may cancel their membership according to the cancellation policy.'
    ];
    
    terms.forEach((term, index) => {
      // Split long terms into multiple lines
      const words = term.split(' ');
      let line = '';
      let lineIndex = 0;
      
      words.forEach(word => {
        const testLine = line + word + ' ';
        if (testLine.length * 6 > 500) { // Approximate width calculation
          page.drawText(line, {
            x: 50,
            y: 550 - (index * 40) - (lineIndex * 20),
            size: 10,
            font: helveticaFont,
            color: rgb(0, 0, 0),
          });
          line = word + ' ';
          lineIndex++;
        } else {
          line = testLine;
        }
      });
      
      if (line.length > 0) {
        page.drawText(line, {
          x: 50,
          y: 550 - (index * 40) - (lineIndex * 20),
          size: 10,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
      }
    });
    
    // Add signature section
    page.drawText('SIGNATURES', {
      x: 50,
      y: 300,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    
    // Client signature
    page.drawText('Client Signature:', {
      x: 50,
      y: 270,
      size: 12,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    // Draw a line for signature
    page.drawLine({
      start: { x: 150, y: 270 },
      end: { x: 350, y: 270 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    
    // Date
    page.drawText('Date:', {
      x: 50,
      y: 240,
      size: 12,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    // Draw a line for date
    page.drawLine({
      start: { x: 150, y: 240 },
      end: { x: 350, y: 240 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    
    // FitSAGA representative signature
    page.drawText('FitSAGA Representative:', {
      x: 50,
      y: 210,
      size: 12,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    // Draw a line for signature
    page.drawLine({
      start: { x: 200, y: 210 },
      end: { x: 400, y: 210 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    
    // Footer
    page.drawText('FitSAGA Fitness - Your Path to Wellness', {
      x: 200,
      y: 50,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    // Save and return as buffer
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error('Error creating contract from scratch:', error);
    throw new Error('Failed to create contract');
  }
}

/**
 * Embeds a signature into an existing PDF
 * @param pdfUrl URL or path of the PDF to embed signature into
 * @param signatureDataUrl Base64 encoded signature image
 * @param signerName Name of the signer
 * @returns Buffer of the signed PDF
 */
export async function embedSignatureInPdf(
  pdfUrl: string,
  signatureDataUrl: string,
  signerName: string
): Promise<Buffer> {
  try {
    let pdfBytes: ArrayBuffer;
    
    // Handle different types of PDF sources
    if (pdfUrl.startsWith('http')) {
      // Remote URL - use fetch
      const pdfResponse = await fetch(pdfUrl);
      pdfBytes = await pdfResponse.arrayBuffer();
    } else if (pdfUrl.startsWith('/contracts/')) {
      // Local path in public directory
      const filePath = path.join(process.cwd(), 'public', pdfUrl);
      pdfBytes = await fs.readFile(filePath);
    } else {
      // Direct file path
      pdfBytes = await fs.readFile(pdfUrl);
    }
    
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Get the last page of the document for the signature
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];
    
    // Extract the image data from the data URL
    const signatureImageData = signatureDataUrl.split(',')[1];
    const signatureImage = Buffer.from(signatureImageData, 'base64');
    
    // Embed the signature image
    const signatureJpgImage = await pdfDoc.embedPng(signatureImage);
    
    // Calculate dimensions and position
    const { width, height } = lastPage.getSize();
    
    // Adjust signature dimensions and position for FitSAGA_Signed_Contract.pdf
    // The signature should be placed in the designated signature box
    const signatureWidth = 150;
    const signatureHeight = 75;
    
    // Position for the signature - adjusted for the specific template
    // These coordinates target the signature box in the FitSAGA contract template
    const signatureX = 150; // X position for signature box
    const signatureY = 270; // Y position for signature box
    
    // Draw the signature
    lastPage.drawImage(signatureJpgImage, {
      x: signatureX,
      y: signatureY,
      width: signatureWidth,
      height: signatureHeight,
    });
    
    // Add text for the signer's name - positioned below the signature
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    lastPage.drawText(`${signerName}`, {
      x: signatureX,
      y: signatureY - 15,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });
    
    // Add date - positioned below the signer's name
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    lastPage.drawText(`${currentDate}`, {
      x: signatureX + 200, // Position date to the right of signature
      y: signatureY,
      size: 10,
      font,
      color: rgb(0, 0, 0),
    });
    
    // Save the modified PDF
    const signedPdfBytes = await pdfDoc.save();
    
    // Return as Buffer
    return Buffer.from(signedPdfBytes);
  } catch (error) {
    console.error('Error embedding signature in PDF:', error);
    throw new Error('Failed to embed signature in PDF');
  }
}
