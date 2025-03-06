import { collection, getDocs, doc, updateDoc, Firestore } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Tutorial, Exercise } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function migrateExerciseIds() {
  if (!firestore) return;

  const tutorialsRef = collection(firestore as Firestore, 'tutorials');
  const snapshot = await getDocs(tutorialsRef);
  
  for (const tutorialDoc of snapshot.docs) {
    const tutorial = tutorialDoc.data() as Tutorial;
    let needsUpdate = false;
    
    if (Array.isArray(tutorial.days)) {
      const updatedDays = tutorial.days.map(day => {
        if (!day.id) {
          needsUpdate = true;
          day.id = uuidv4();
        }

        if (Array.isArray(day.exercises)) {
          day.exercises = day.exercises.map((exercise: Exercise) => {
            if (!exercise.id) {
              needsUpdate = true;
              return {
                ...exercise,
                id: uuidv4()
              };
            }
            return exercise;
          });
        }

        return day;
      });
      
      if (needsUpdate) {
        await updateDoc(doc(firestore as Firestore, 'tutorials', tutorialDoc.id), {
          days: updatedDays
        });
        console.log(`Updated exercises for tutorial: ${tutorialDoc.id}`);
      }
    }
  }
  
  console.log('Exercise ID migration completed');
}
