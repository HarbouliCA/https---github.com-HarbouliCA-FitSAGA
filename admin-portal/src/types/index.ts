export type User = {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  credits: number;
  role: 'user' | 'trainer' | 'admin';
  memberSince: Date;
  lastActive: Date;
  height?: number; // in cm
  weight?: number; // in kg
  birthday?: Date;
  sex?: 'male' | 'female' | 'other';
  observations?: string;
  fidelityScore?: number;
  onboardingCompleted: boolean;
  accessStatus?: 'green' | 'red';
};

export type Activity = {
  id: string;
  name: string;
  description: string;
  type: 'ENTREMIENTO_PERSONAL' | 'KICK_BOXING' | 'SALE_FITNESS' | 'CLASES_DERIGIDAS';
  creditValue: number;
  imageUrl?: string;
  duration: number; // Default duration in minutes
  capacity: number; // Default capacity for sessions
  equipmentNeeded?: string[]; // Equipment required for this activity
  difficulty: 'beginner' | 'intermediate' | 'advanced'; // Difficulty level
  createdAt: Date;
  updatedAt: Date;
};

export type Session = {
  id: string;
  activityId: string;
  activityName: string;
  title: string;
  description?: string;
  notes?: string;
  startTime: Date;
  endTime: Date;
  capacity: number;
  bookedCount: number;
  instructor: string; // Required instructor for each session
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    repeatEvery: number; // 1 = every day/week/month, 2 = every other day/week/month, etc.
    weekdays?: string[]; // ['monday', 'wednesday', 'friday'] - only for weekly frequency
    endDate: Date;
    parentSessionId?: string; // Reference to the original session in a recurring series
  };
  createdAt: Date;
  updatedAt: Date;
};

export type Booking = {
  id: string;
  userId: string;
  sessionId: string;
  status: 'confirmed' | 'cancelled' | 'attended';
  creditsUsed: number;
  bookedAt: Date;
};

export type Exercise = {
  id: string;
  name: string;
  description: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  equipment?: string[];
  muscleGroups?: string[];
  instructions: string[];
};

export type TutorialDay = {
  id: string;
  dayNumber: number;
  title: string;
  description: string;
  exercises: Exercise[];
};

export type Tutorial = {
  id: string;
  title: string;
  category: 'exercise' | 'nutrition';
  description: string;
  thumbnailUrl?: string;
  author: string;
  duration: number; // Total duration in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  createdAt: Date;
  days: TutorialDay[];
  goals?: string[];
  requirements?: string[];
};

export type ForumPost = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  imageUrl?: string;
  likes: number;
  comments: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ForumReply = {
  id: string;
  content: string;
  authorId: string;
  authorName?: string;
  likes?: number;
  createdAt: { seconds: number; nanoseconds: number };
  updatedAt: { seconds: number; nanoseconds: number };
};

export type ForumThread = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName?: string;
  imageUrl?: string;
  category: 'question' | 'discussion' | 'general';
  status: 'open' | 'closed' | 'resolved';
  likes?: number;
  replies: ForumReply[];
  replyCount: number;
  createdAt: { seconds: number; nanoseconds: number };
  updatedAt: { seconds: number; nanoseconds: number };
  lastActivity: { seconds: number; nanoseconds: number };
};
