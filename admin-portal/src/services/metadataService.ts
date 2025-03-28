import { VideoMetadata } from '../interfaces/tutorial';
import { firestore } from '@/lib/firebase';
import { collection, getDocs, query, where, addDoc, updateDoc, doc, orderBy } from 'firebase/firestore';

export class MetadataService {
  private collectionName = 'videoMetadata';

  async getAllMetadata(): Promise<VideoMetadata[]> {
    const metadataCollection = collection(firestore, this.collectionName);
    const snapshot = await getDocs(metadataCollection);
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      videoId: doc.id
    } as VideoMetadata));
  }

  async getMetadataByFilters(filters: {
    activity?: string;
    type?: string;
    bodyPart?: string;
  }): Promise<VideoMetadata[]> {
    let metadataQuery = collection(firestore, this.collectionName);
    const constraints = [];
    
    if (filters.activity) {
      constraints.push(where('activity', '==', filters.activity));
    }
    
    if (filters.type) {
      constraints.push(where('type', '==', filters.type));
    }
    
    if (filters.bodyPart) {
      constraints.push(where('bodyPart', '==', filters.bodyPart));
    }
    
    const q = query(metadataQuery, ...constraints);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      videoId: doc.id
    } as VideoMetadata));
  }

  async importMetadataFromCSV(csvData: string): Promise<boolean> {
    try {
      console.log("Starting CSV import process");
      const lines = csvData.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      console.log(`Found ${lines.length-1} records to import with headers: ${headers.join(', ')}`);
      
      // Batch for better performance
      const batch = [];
      const importedIds = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // Skip empty lines
        
        // Handle CSV values that may contain commas inside quotes
        const row = lines[i];
        const values: string[] = [];
        let inQuotes = false;
        let currentValue = '';
        
        for (let j = 0; j < row.length; j++) {
          const char = row[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(currentValue);
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        values.push(currentValue); // Add the last value
        
        if (values.length !== headers.length) {
          console.warn(`Skipping row ${i}, expected ${headers.length} values but got ${values.length}`);
          continue;
        }
        
        const metadata: Record<string, string> = {};
        headers.forEach((header, index) => {
          // Remove any surrounding quotes and trim
          let value = values[index].trim();
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
          }
          metadata[header] = value;
        });
        
        // If CSV has a 'filename' field but no 'path', use filename as path
        if ('filename' in metadata && metadata.filename && !('path' in metadata) || !metadata.path) {
          metadata.path = metadata.filename;
        }
        
        // Add timestamp
        metadata.createdAt = new Date().toISOString();
        
        console.log(`Adding document for video: ${metadata.name || 'unnamed'}`);
        
        // Add to batch
        batch.push(
          addDoc(collection(firestore, this.collectionName), metadata)
            .then(docRef => {
              importedIds.push(docRef.id);
              return docRef;
            })
        );
      }
      
      // Execute all additions in parallel
      await Promise.all(batch);
      console.log(`Successfully imported ${importedIds.length} videos`);
      
      return true;
    } catch (error) {
      console.error('Error importing metadata from CSV:', error);
      return false;
    }
  }

  async getMetadataById(videoId: string): Promise<VideoMetadata | null> {
    try {
      const docRef = doc(firestore, this.collectionName, videoId);
      const snapshot = await getDocs(query(collection(firestore, this.collectionName), where('__name__', '==', videoId)));
      
      if (snapshot.empty) return null;
      
      return {
        ...snapshot.docs[0].data(),
        videoId: snapshot.docs[0].id
      } as VideoMetadata;
    } catch (error) {
      console.error('Error getting metadata by ID:', error);
      return null;
    }
  }
}

export default new MetadataService(); 