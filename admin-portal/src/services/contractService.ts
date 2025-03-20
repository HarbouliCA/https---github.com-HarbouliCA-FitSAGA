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
    // Import required modules from pdf-lib
    const { PDFDocument, rgb, StandardFonts } = await import('pdf-lib');
    
    // Get the PDF as bytes
    // Update the file path handling in your contractService.ts
let pdfBytes: Uint8Array;
if (pdfUrl.startsWith('http')) {
  // If URL is remote, fetch it
  const response = await fetch(pdfUrl);
  pdfBytes = new Uint8Array(await response.arrayBuffer());
} else {
  // If URL is a local file path, use fs
  const fs = await import('fs/promises');
  const path = await import('path');
  
  let resolvedPath = pdfUrl;
  
  // Handle different path formats
  if (pdfUrl.startsWith('/contracts/') || pdfUrl.startsWith('contracts/')) {
    // If it's a relative path starting with /contracts/
    resolvedPath = path.join(process.cwd(), 'public', pdfUrl);
  } else if (!pdfUrl.includes(':\\')) {
    // Any other relative path
    resolvedPath = path.join(process.cwd(), 'public', 'contracts', pdfUrl);
  }
  
  console.log('Attempting to read PDF from:', resolvedPath);
  try {
    pdfBytes = await fs.readFile(resolvedPath);
  } catch (e) {
    // If the original path fails, try one more approach as fallback
    const fallbackPath = path.join(process.cwd(), 'public', 'contracts', path.basename(pdfUrl));
    console.log('First attempt failed, trying fallback path:', fallbackPath);
    pdfBytes = await fs.readFile(fallbackPath);
  }
}
    
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Get the last page for signature
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];
    const { width, height } = lastPage.getSize();
    
    // Extract the image data from the data URL
    const signatureData = signatureDataUrl.split(',')[1];
    const signatureImage = await pdfDoc.embedPng(
      Buffer.from(signatureData, 'base64')
    );
    
    // Calculate the signature dimensions - maintain aspect ratio but limit size
    const signatureMaxWidth = 200;
    const signatureMaxHeight = 80;
    const imgDims = signatureImage.scale(1);
    
    let signatureWidth = imgDims.width;
    let signatureHeight = imgDims.height;
    
    if (signatureWidth > signatureMaxWidth) {
      const scale = signatureMaxWidth / signatureWidth;
      signatureWidth = signatureMaxWidth;
      signatureHeight = signatureHeight * scale;
    }
    
    if (signatureHeight > signatureMaxHeight) {
      const scale = signatureMaxHeight / signatureHeight;
      signatureHeight = signatureMaxHeight;
      signatureWidth = signatureWidth * scale;
    }
    
    // Try to find signature field
    let signatureX = width / 2 - signatureWidth / 2; // Center horizontally by default
    let signatureY = 150; // Default position from bottom
    let useFormField = false;
    
    try {
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      
      // Look for fields that might be for signatures
      const signatureField = fields.find(field => {
        const name = field.getName().toLowerCase();
        return name.includes('sign') || name.includes('signature');
      });
      
      if (signatureField) {
        const fieldName = signatureField.getName();
        console.log(`Found signature field: ${fieldName}`);
        
        // Get field position - this depends on field type
        try {
          const widget = signatureField.acroField.getWidgets()[0];
          if (widget) {
            const rect = widget.getRectangle();
            signatureX = rect.x + 5; // Add a small margin
            signatureY = rect.y + 5; // Add a small margin
            useFormField = true;
            
            // Optional: Remove or flatten the form field
            form.removeField(signatureField);
          }
        } catch (e) {
          console.error('Error getting signature field position:', e);
        }
      }
    } catch (e) {
      console.log('No form fields found or error accessing form:', e);
    }
    
    // If no form field was found, use a better position based on the page
    if (!useFormField) {
      // Position for signature - approximately 70% down the page, centered horizontally
      signatureX = width / 2 - signatureWidth / 2;
      signatureY = height * 0.3; // 30% from bottom of page
    }
    
    // Draw the signature
    lastPage.drawImage(signatureImage, {
      x: signatureX,
      y: signatureY,
      width: signatureWidth,
      height: signatureHeight,
    });
    
    // Add signer name and date below signature
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontSize = 10;
    const textY = signatureY - 20; // Position text below signature
    
    // Add signer name
    lastPage.drawText(signerName, {
      x: signatureX,
      y: textY,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    // Add date
    const dateString = new Date().toLocaleDateString();
    lastPage.drawText(`Date: ${dateString}`, {
      x: signatureX + signatureWidth - 80, // Right-aligned
      y: textY,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    // Save the PDF
    const signedPdfBytes = await pdfDoc.save();
    
    return Buffer.from(signedPdfBytes);
  } catch (error) {
    console.error('Error embedding signature in PDF:', error);
    throw new Error(`Failed to embed signature: ${error instanceof Error ? error.message : String(error)}`);
  }
}