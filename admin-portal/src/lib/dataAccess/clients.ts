import { db } from '@/lib/firebaseAdmin';
import { Client } from '@/types/client';

const CLIENTS_COLLECTION = 'clients';

/**
 * Retrieves a client by ID
 */
export async function getClient(clientId: string): Promise<Client | null> {
  try {
    // Check if db is defined before using it
    if (!db) {
      throw new Error('Firebase Firestore is not initialized');
    }
    
    const clientRef = db.collection(CLIENTS_COLLECTION).doc(clientId);
    const clientSnap = await clientRef.get();
    
    if (!clientSnap.exists) {
      return null;
    }
    
    // Include the ID in the returned client object
    return {
      id: clientId,
      ...clientSnap.data()
    } as Client;
  } catch (error) {
    console.error('Error getting client:', error);
    throw new Error('Failed to get client');
  }
}
