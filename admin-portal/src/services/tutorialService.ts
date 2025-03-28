import { Tutorial, Day, Exercise } from '../interfaces/tutorial';
import { firestore } from '../lib/firebase';
import { collection, getDocs, query, where, addDoc, updateDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';

export class TutorialService {
  private collectionName = 'tutorials';

  async createTutorial(tutorial: Omit<Tutorial, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date();
    const tutorialData = {
      ...tutorial,
      createdAt: now,
      updatedAt: now
    };
    
    const docRef = await addDoc(collection(firestore, this.collectionName), tutorialData);
    return docRef.id;
  }

  async updateTutorial(id: string, tutorial: Partial<Tutorial>): Promise<void> {
    const tutorialRef = doc(firestore, this.collectionName, id);
    await updateDoc(tutorialRef, {
      ...tutorial,
      updatedAt: new Date()
    });
  }

  async getTutorialById(id: string): Promise<Tutorial | null> {
    const tutorialRef = doc(firestore, this.collectionName, id);
    const tutorialSnap = await getDoc(tutorialRef);
    
    if (!tutorialSnap.exists()) return null;
    
    return {
      ...tutorialSnap.data(),
      id: tutorialSnap.id
    } as Tutorial;
  }

  async getTutorialsByAuthor(authorId: string): Promise<Tutorial[]> {
    const tutorialsCollection = collection(firestore, this.collectionName);
    const q = query(tutorialsCollection, where('authorId', '==', authorId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as Tutorial));
  }

  async deleteTutorial(id: string): Promise<void> {
    const tutorialRef = doc(firestore, this.collectionName, id);
    await deleteDoc(tutorialRef);
  }

  calculateTotalDuration(tutorial: Tutorial): number {
    let totalDuration = 0;
    
    tutorial.days.forEach(day => {
      day.exercises.forEach(exercise => {
        // Video duration would need to be fetched from metadata
        // For now, we'll calculate based on reps, sets and rest times
        const exerciseDuration = exercise.sets * (
          // Assuming each rep takes about 3 seconds (this would be replaced with actual video duration)
          (exercise.repetitions * 3) + 
          // Rest between sets
          exercise.restTimeBetweenSets
        ) + 
        // Rest after exercise
        exercise.restTimeAfterExercise;
        
        totalDuration += exerciseDuration;
      });
    });
    
    return totalDuration; // in seconds
  }
}

export default new TutorialService(); 