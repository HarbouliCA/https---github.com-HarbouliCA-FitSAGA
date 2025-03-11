export interface Contract {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  status: 'draft' | 'pending_signature' | 'signed' | 'expired';
  createdAt: Date;
  signedAt?: Date;
  pdfUrl: string;
  signedPdfUrl?: string;
  expiresAt?: Date;
}
