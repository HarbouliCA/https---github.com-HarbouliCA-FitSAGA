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

export type ActivityType = 'ENTREMIENTO_PERSONAL' | 'KICK_BOXING' | 'SALE_FITNESS' | 'CLASES_DERIGIDAS';

export interface ActivityFormData {
  type: ActivityType;
  name: string;
  description?: string;
  capacity: number;
  duration: number;
  creditValue?: number;
}

export interface Activity extends ActivityFormData {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  creditValue: number;
}

export interface RecurringRule {
  frequency: 'daily' | 'weekly' | 'monthly';
  repeatEvery: number;
  weekdays?: string[];
  endDate: Date;
  parentSessionId?: string;
}

export interface SessionFormData {
  activityId: string;
  activityName: string;
  activityType: ActivityType;
  startTime: Date;
  endTime: Date;
  capacity: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  recurring?: RecurringRule | null;
  instructorId: string;
  instructorName: string;
  isRecurring?: boolean;
}

export interface Session {
  id: string;
  activityId: string;
  activityName: string;
  activityType: ActivityType;
  title?: string;
  description?: string;
  notes?: string;
  startTime: Date;
  endTime: Date;
  capacity: number;
  enrolledCount: number;
  bookedCount?: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  recurring: RecurringRule | null;
  instructorId: string;
  instructorName: string;
  instructor?: string;
  instructorPhotoURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InstructorSession {
  id: string;
  activityName: string;
  instructorId: string;
  startTime: Date;
  endTime: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export const activityDisplayNames: Record<ActivityType, string> = {
  'ENTREMIENTO_PERSONAL': 'Entrenamiento Personal',
  'KICK_BOXING': 'Kick Boxing',
  'SALE_FITNESS': 'Sale Fitness',
  'CLASES_DERIGIDAS': 'Clases Dirigidas'
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

export type Booking = {
  id: string;
  userId: string;
  sessionId: string;
  status: 'confirmed' | 'cancelled' | 'attended';
  creditsUsed: number;
  bookedAt: Date;
};

export interface BankDetails {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  iban?: string;
}

export interface Instructor {
  uid: string;
  fullName: string;
  email: string;
  dateOfBirth: Date;
  telephone: string;
  workingSince: Date;
  address: string;
  bankDetails: BankDetails;
  role: 'instructor';
  accessStatus: 'green' | 'red';
  createdAt: Date;
  updatedAt: Date;
  lastActive?: Date;
  photoURL?: string;
}

export interface InstructorFormData {
  fullName: string;
  email: string;
  password?: string;
  dateOfBirth: Date;
  telephone: string;
  workingSince: Date;
  address: string;
  bankDetails: BankDetails;
  photoURL?: string;
}

export * from './client';
