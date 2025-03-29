export interface Tutorial {
  id?: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  authorId: string;
  authorName?: string;
  createdAt: Date;
  updatedAt: Date;
  days: Day[];
}

export interface Day {
  id?: string;
  dayNumber: number;
  title: string;
  description: string;
  exercises: Exercise[];
}

export interface Exercise {
  id?: string;
  videoId: string;
  name: string;
  activity: string;
  type: string;
  bodyPart: string;
  repetitions: number;
  sets: number;
  restTimeBetweenSets: number; // in seconds
  restTimeAfterExercise: number; // in seconds
  thumbnailUrl?: string;
}

export interface VideoMetadata {
  videoId: string;
  filename: string;
  name: string;
  activity: string;
  type: string;
  bodyPart?: string;    // Capital P version for TypeScript consistency
  bodypart?: string;    // Lowercase p version to match Firebase data
  description?: string;
  thumbnailUrl: string;
  thumbnailId?: string;
  dayId?: string;
  dayName?: string;
  planId?: string;
} 