// Define Timestamp and FieldValue types without importing from Firebase
// This avoids the import error while maintaining type safety
export type Timestamp = {
  seconds: number;
  nanoseconds: number;
  toDate(): Date;
  toMillis(): number;
};

export type FieldValue = {
  _methodName: string;
};

/**
 * Base User interface with common properties for all user types
 */
export interface User {
  uid: string;
  email: string;
  fullName: string;
  role: 'admin' | 'instructor' | 'client';
  telephone?: string;
  address?: string;
  profileImageUrl?: string;
  accessStatus: 'active' | 'suspended' | 'pending';
  createdAt: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}

/**
 * Instructor-specific properties
 */
export interface Instructor extends User {
  role: 'instructor';
  workingSince?: Timestamp | Date;
  specialties?: string[];
  certifications?: string[];
  bankDetails?: {
    bankName: string;
    accountHolder: string;
    iban: string;
    accountNumber?: string;
  };
}

/**
 * Client-specific properties
 */
export interface Client extends User {
  role: 'client';
  memberSince?: Timestamp | Date;
  fitnessGoals?: string[];
  healthConditions?: string[];
  emergencyContact?: {
    name: string;
    relationship: string;
    telephone: string;
  };
}

/**
 * Activity interface
 */
export interface Activity {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  isActive: boolean;
  createdBy: string; // instructor or admin uid
  createdAt: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
  imageUrl?: string;
  equipment?: string[];
  targetMuscles?: string[];
  instructions?: string[];
}

/**
 * Session interface
 */
export interface Session {
  id: string;
  title: string;
  activityId: string;
  activityType: string;
  instructorId: string;
  instructorName: string;
  dateTime: Timestamp | Date;
  duration: number; // in minutes
  location: string;
  maxParticipants: number;
  currentParticipants: number;
  status: 'scheduled' | 'cancelled' | 'completed';
  description?: string;
  participants?: string[]; // array of client uids
  createdAt: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}

/**
 * Tutorial interface
 */
export interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  videoUrl: string;
  thumbnailUrl?: string;
  createdBy: string; // instructor or admin uid
  createdAt: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
  isPublished: boolean;
  steps?: {
    title: string;
    description: string;
    imageUrl?: string;
  }[];
}

/**
 * Forum Post interface
 */
export interface ForumPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: 'admin' | 'instructor' | 'client';
  category: string;
  tags?: string[];
  createdAt: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
  likes: number;
  comments: ForumComment[];
}

/**
 * Forum Comment interface
 */
export interface ForumComment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: 'admin' | 'instructor' | 'client';
  createdAt: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
  likes: number;
}
