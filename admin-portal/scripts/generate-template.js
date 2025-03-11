const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

async function createContractTemplate() {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  
  // Add a page to the document
  const page = pdfDoc.addPage([612, 792]); // Letter size
  
  // Get the standard font
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Set margins
  const margin = 50;
  const width = page.getWidth() - 2 * margin;
  
  // Add title
  page.drawText('FITNESS MEMBERSHIP AGREEMENT', {
    x: margin,
    y: 730,
    size: 16,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  // Add FitSAGA logo text
  page.drawText('FitSAGA', {
    x: margin,
    y: 700,
    size: 14,
    font: helveticaBold,
    color: rgb(0.3, 0.3, 0.8),
  });
  
  // Add date
  page.drawText('Date:', {
    x: margin,
    y: 670,
    size: 12,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  // Add form fields
  const form = pdfDoc.getForm();
  
  // Client information section
  page.drawText('CLIENT INFORMATION', {
    x: margin,
    y: 630,
    size: 14,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  // Name field
  page.drawText('Name:', {
    x: margin,
    y: 600,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  
  const nameField = form.createTextField('client.name');
  nameField.setText('');
  nameField.addToPage(page, { 
    x: margin + 100, 
    y: 590, 
    width: 300, 
    height: 20,
    borderWidth: 1,
    borderColor: rgb(0, 0, 0),
  });
  
  // Email field
  page.drawText('Email:', {
    x: margin,
    y: 560,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  
  const emailField = form.createTextField('client.email');
  emailField.setText('');
  emailField.addToPage(page, { 
    x: margin + 100, 
    y: 550, 
    width: 300, 
    height: 20,
    borderWidth: 1,
    borderColor: rgb(0, 0, 0),
  });
  
  // Phone field
  page.drawText('Phone:', {
    x: margin,
    y: 520,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  
  const phoneField = form.createTextField('client.phone');
  phoneField.setText('');
  phoneField.addToPage(page, { 
    x: margin + 100, 
    y: 510, 
    width: 300, 
    height: 20,
    borderWidth: 1,
    borderColor: rgb(0, 0, 0),
  });
  
  // Membership details section
  page.drawText('MEMBERSHIP DETAILS', {
    x: margin,
    y: 470,
    size: 14,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  // Membership type
  page.drawText('Membership Type:', {
    x: margin,
    y: 440,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  
  const membershipField = form.createTextField('membership.type');
  membershipField.setText('');
  membershipField.addToPage(page, { 
    x: margin + 150, 
    y: 430, 
    width: 250, 
    height: 20,
    borderWidth: 1,
    borderColor: rgb(0, 0, 0),
  });
  
  // Start date
  page.drawText('Start Date:', {
    x: margin,
    y: 400,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  
  const startDateField = form.createTextField('membership.startDate');
  startDateField.setText('');
  startDateField.addToPage(page, { 
    x: margin + 150, 
    y: 390, 
    width: 250, 
    height: 20,
    borderWidth: 1,
    borderColor: rgb(0, 0, 0),
  });
  
  // End date
  page.drawText('End Date:', {
    x: margin,
    y: 360,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  
  const endDateField = form.createTextField('membership.endDate');
  endDateField.setText('');
  endDateField.addToPage(page, { 
    x: margin + 150, 
    y: 350, 
    width: 250, 
    height: 20,
    borderWidth: 1,
    borderColor: rgb(0, 0, 0),
  });
  
  // Payment details section
  page.drawText('PAYMENT DETAILS', {
    x: margin,
    y: 310,
    size: 14,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  // Payment amount
  page.drawText('Payment Amount:', {
    x: margin,
    y: 280,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  
  const paymentField = form.createTextField('payment.amount');
  paymentField.setText('');
  paymentField.addToPage(page, { 
    x: margin + 150, 
    y: 270, 
    width: 250, 
    height: 20,
    borderWidth: 1,
    borderColor: rgb(0, 0, 0),
  });
  
  // Payment frequency
  page.drawText('Payment Frequency:', {
    x: margin,
    y: 240,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  
  const frequencyField = form.createTextField('payment.frequency');
  frequencyField.setText('');
  frequencyField.addToPage(page, { 
    x: margin + 150, 
    y: 230, 
    width: 250, 
    height: 20,
    borderWidth: 1,
    borderColor: rgb(0, 0, 0),
  });
  
  // Terms and conditions
  page.drawText('TERMS AND CONDITIONS', {
    x: margin,
    y: 190,
    size: 14,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  // Add some terms text
  const termsText = 
    'By signing this agreement, the client agrees to abide by all rules and regulations set forth by FitSAGA. ' +
    'The client acknowledges that they have read and understood the terms of this membership agreement. ' +
    'This contract may be terminated with 30 days written notice.';
  
  const textWidth = width;
  const fontSize = 10;
  const lineHeight = 15;
  
  // Split the text into lines that fit within the width
  let remainingText = termsText;
  let yPosition = 170;
  
  while (remainingText.length > 0 && yPosition > 100) {
    let lineLength = 0;
    let lineText = '';
    
    // Find how many characters fit on this line
    while (lineLength < remainingText.length) {
      const testLine = remainingText.substring(0, lineLength + 1);
      const textWidth = helveticaFont.widthOfTextAtSize(testLine, fontSize);
      
      if (textWidth > width) {
        break;
      }
      
      lineLength++;
    }
    
    // Find the last space before the cutoff
    if (lineLength < remainingText.length) {
      const lastSpace = remainingText.substring(0, lineLength).lastIndexOf(' ');
      if (lastSpace > 0) {
        lineLength = lastSpace;
      }
    }
    
    // Extract the line and remove it from the remaining text
    lineText = remainingText.substring(0, lineLength).trim();
    remainingText = remainingText.substring(lineLength).trim();
    
    // Draw the line
    page.drawText(lineText, {
      x: margin,
      y: yPosition,
      size: fontSize,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= lineHeight;
  }
  
  // Signature section
  page.drawText('SIGNATURES', {
    x: margin,
    y: 100,
    size: 14,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  // Client signature
  page.drawText('Client Signature:', {
    x: margin,
    y: 70,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  
  const clientSignatureField = form.createTextField('signature.client');
  clientSignatureField.addToPage(page, { 
    x: margin + 150, 
    y: 50, 
    width: 200, 
    height: 50,
    borderWidth: 1,
    borderColor: rgb(0, 0, 0),
  });
  
  // Serialize the PDF to bytes
  const pdfBytes = await pdfDoc.save();
  
  // Write the PDF to a file
  const outputPath = path.join(__dirname, '..', 'templates', 'contract-template.pdf');
  await fs.writeFile(outputPath, pdfBytes);
  
  console.log(`Contract template created at: ${outputPath}`);
}

createContractTemplate().catch(console.error);
