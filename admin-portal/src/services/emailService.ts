import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

// Email configuration
const getEmailConfig = () => {
  return {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    // Add additional options for Gmail
    tls: {
      rejectUnauthorized: false // Allows self-signed certificates
    }
  };
};

/**
 * Resolves the correct path for a contract URL
 * Handles both Firebase Storage URLs and local file paths
 */
const resolveContractPath = (contractUrl: string): string => {
  // If it's a full URL (Firebase Storage), return as is
  if (contractUrl.startsWith('http')) {
    return contractUrl;
  }
  
  // If it's a local path (starts with /contracts/), resolve to the public directory
  if (contractUrl.startsWith('/contracts/')) {
    return path.join(process.cwd(), 'public', contractUrl);
  }
  
  // Default case, return as is
  return contractUrl;
};

/**
 * Logs email details when actual sending fails
 */
const logEmailFallback = (to: string, subject: string, contractUrl: string) => {
  console.log('=== EMAIL FALLBACK (Email sending failed) ===');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Contract URL: ${contractUrl}`);
  console.log('=== END EMAIL FALLBACK ===');
  
  // In a production environment, you might want to save this to a database
  // or queue for retry later
  return {
    messageId: 'fallback-' + Date.now(),
    fallback: true
  };
};

/**
 * Validates email configuration
 */
const validateEmailConfig = () => {
  const requiredVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD'];
  const missing = requiredVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    console.warn(`Missing email configuration: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
};

/**
 * Sends an email with the contract to the client
 */
export async function sendContractEmail(
  email: string, 
  contractUrl: string, 
  clientName: string,
  contractId: string
) {
  try {
    // Check if email configuration is valid
    if (!validateEmailConfig()) {
      console.warn('Email configuration is incomplete. Using fallback logging method.');
      return logEmailFallback(email, 'Your FitSAGA Membership Contract', contractUrl);
    }
    
    // Create transporter
    const transporter = nodemailer.createTransport(getEmailConfig());
    
    // Verify connection configuration
    try {
      await transporter.verify();
    } catch (verifyError) {
      console.error('Email transport verification failed:', verifyError);
      return logEmailFallback(email, 'Your FitSAGA Membership Contract', contractUrl);
    }
    
    // Signing URL (this would be a public URL where clients can sign the contract)
    const signingUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/contracts/${contractId}/sign`;
    
    // Resolve the correct path for the contract
    const resolvedContractPath = resolveContractPath(contractUrl);
    
    // Create email template
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"FitSAGA" <noreply@fitsaga.com>',
      to: email,
      subject: 'Your FitSAGA Membership Contract',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4f46e5;">FitSAGA Membership Contract</h1>
          <p>Hello ${clientName},</p>
          <p>Your FitSAGA membership contract is ready for your review and signature.</p>
          <p>Please click the button below to view and sign your contract:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${signingUrl}" style="background-color: #4f46e5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              View and Sign Contract
            </a>
          </div>
          <p>If you have any questions, please contact our support team.</p>
          <p>Thank you for choosing FitSAGA!</p>
        </div>
      `,
      attachments: [
        {
          filename: 'FitSAGA_Contract.pdf',
          path: resolvedContractPath,
        },
      ],
    };
    
    try {
      // Send email
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return info;
    } catch (sendError) {
      console.error('Error sending email:', sendError);
      return logEmailFallback(email, 'Your FitSAGA Membership Contract', contractUrl);
    }
  } catch (error) {
    console.error('Error in email service:', error);
    // Use fallback instead of throwing error to prevent API failure
    return logEmailFallback(email, 'Your FitSAGA Membership Contract', contractUrl);
  }
}

/**
 * Sends a confirmation email after the contract is signed
 */
export async function sendSignedContractEmail(
  email: string, 
  signedPdfUrl: string, 
  clientName: string
) {
  try {
    // Check if email configuration is valid
    if (!validateEmailConfig()) {
      console.warn('Email configuration is incomplete. Using fallback logging method.');
      return logEmailFallback(email, 'Your Signed FitSAGA Membership Contract', signedPdfUrl);
    }
    
    // Create transporter
    const transporter = nodemailer.createTransport(getEmailConfig());
    
    // Verify connection configuration
    try {
      await transporter.verify();
    } catch (verifyError) {
      console.error('Email transport verification failed:', verifyError);
      return logEmailFallback(email, 'Your Signed FitSAGA Membership Contract', signedPdfUrl);
    }
    
    // Resolve the correct path for the contract
    const resolvedContractPath = resolveContractPath(signedPdfUrl);
    
    // Create email template
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"FitSAGA" <noreply@fitsaga.com>',
      to: email,
      subject: 'Your Signed FitSAGA Membership Contract',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4f46e5;">FitSAGA Membership Contract - Signed</h1>
          <p>Hello ${clientName},</p>
          <p>Thank you for signing your FitSAGA membership contract.</p>
          <p>Attached is a copy of your signed contract for your records.</p>
          <p>We look forward to helping you achieve your fitness goals!</p>
          <p>The FitSAGA Team</p>
        </div>
      `,
      attachments: [
        {
          filename: 'FitSAGA_Signed_Contract.pdf',
          path: resolvedContractPath,
        },
      ],
    };
    
    try {
      // Send email
      const info = await transporter.sendMail(mailOptions);
      console.log('Signed contract email sent:', info.messageId);
      return info;
    } catch (sendError) {
      console.error('Error sending signed contract email:', sendError);
      return logEmailFallback(email, 'Your Signed FitSAGA Membership Contract', signedPdfUrl);
    }
  } catch (error) {
    console.error('Error in email service:', error);
    // Use fallback instead of throwing error to prevent API failure
    return logEmailFallback(email, 'Your Signed FitSAGA Membership Contract', signedPdfUrl);
  }
}
