import { Contract } from '@/types/contract';
import { db, storage } from '@/lib/firebaseAdmin';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

const CONTRACTS_COLLECTION = 'contracts';
const CONTRACTS_STORAGE_PATH = 'contracts';
const LOCAL_STORAGE_PATH = path.join(process.cwd(), 'public', 'contracts');

/**
 * Creates a new contract record in Firestore
 */
export async function createContractRecord(contractData: Omit<Contract, 'id'>) {
  try {
    const contractId = uuidv4();
    
    const contract: Contract = {
      id: contractId,
      ...contractData,
    };
    
    await db.collection(CONTRACTS_COLLECTION).doc(contractId).set(contract);
    return contract.id;
  } catch (error) {
    console.error('Error creating contract record:', error);
    throw new Error('Failed to create contract record');
  }
}

/**
 * Uploads a contract PDF to local storage and returns a URL
 * This is a fallback method when Firebase Storage is not available
 */
export async function uploadContractPdf(contractId: string, pdfBuffer: Buffer): Promise<string> {
  try {
    console.log('Attempting to upload contract PDF...');
    
    // First try Firebase Storage
    try {
      const fileName = `${contractId}.pdf`;
      const filePath = `${CONTRACTS_STORAGE_PATH}/${fileName}`;
      
      // Get the default bucket
      const bucket = storage.bucket();
      
      if (!bucket) {
        throw new Error('Storage bucket not configured');
      }
      
      console.log(`Uploading to bucket: ${bucket.name}`);
      
      // Create the file in the bucket
      const file = bucket.file(filePath);
      
      // Upload the file
      await file.save(pdfBuffer, {
        metadata: {
          contentType: 'application/pdf'
        }
      });
      
      // Make the file publicly accessible
      await file.makePublic();
      
      // Get the public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
      console.log(`File uploaded successfully to Firebase. Public URL: ${publicUrl}`);
      
      return publicUrl;
    } catch (firebaseError) {
      console.error('Firebase Storage upload failed, falling back to local storage:', firebaseError);
      
      // If Firebase Storage fails, fall back to local storage
      // Create directory if it doesn't exist
      try {
        await fs.mkdir(LOCAL_STORAGE_PATH, { recursive: true });
      } catch (mkdirError) {
        console.error('Error creating directory:', mkdirError);
      }
      
      const fileName = `${contractId}.pdf`;
      const filePath = path.join(LOCAL_STORAGE_PATH, fileName);
      
      // Write the file to local storage
      await fs.writeFile(filePath, pdfBuffer);
      
      // Return a URL that points to the local file
      const publicUrl = `/contracts/${fileName}`;
      console.log(`File uploaded successfully to local storage. Public URL: ${publicUrl}`);
      
      return publicUrl;
    }
  } catch (error) {
    console.error('Error uploading contract PDF:', error);
    throw new Error('Failed to upload contract PDF');
  }
}

/**
 * Updates a contract record with the PDF URL
 */
export async function updateContractUrl(contractId: string, pdfUrl: string) {
  try {
    await db.collection(CONTRACTS_COLLECTION).doc(contractId).update({
      pdfUrl
    });
  } catch (error) {
    console.error('Error updating contract URL:', error);
    throw new Error('Failed to update contract URL');
  }
}

/**
 * Gets a contract by ID
 */
export async function getContract(contractId: string): Promise<Contract | null> {
  try {
    const contractRef = db.collection(CONTRACTS_COLLECTION).doc(contractId);
    const contractSnap = await contractRef.get();
    
    if (!contractSnap.exists) {
      return null;
    }
    
    return contractSnap.data() as Contract;
  } catch (error) {
    console.error('Error getting contract:', error);
    throw new Error('Failed to get contract');
  }
}

/**
 * Updates a contract's status
 */
export async function updateContractStatus(contractId: string, status: Contract['status']) {
  try {
    await db.collection(CONTRACTS_COLLECTION).doc(contractId).update({
      status
    });
  } catch (error) {
    console.error('Error updating contract status:', error);
    throw new Error('Failed to update contract status');
  }
}

/**
 * Gets the most recent contract for a client
 */
export async function getLatestClientContract(clientId: string): Promise<Contract | null> {
  try {
    const contractsRef = db.collection(CONTRACTS_COLLECTION);
    const q = contractsRef
      .where('clientId', '==', clientId)
      .orderBy('createdAt', 'desc')
      .limit(1);
    
    const snapshot = await q.get();
    
    if (snapshot.empty) {
      return null;
    }
    
    return snapshot.docs[0].data() as Contract;
  } catch (error) {
    console.error('Error getting latest client contract:', error);
    throw new Error('Failed to get latest client contract');
  }
}
