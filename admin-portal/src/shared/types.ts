// Base user interface
export interface User {
  uid: string;
  fullName: string;
  email: string;
  password?: string; // hashed, only used during creation
  phoneNumber: string;
  role: 'admin' | 'instructor' | 'client';
  createdAt: string;
  updatedAt: string;
  accessStatus: 'active' | 'suspended' | 'inactive' | 'green';
  lastLogin?: string;
  photoURL?: string;
  dateOfBirth?: string;
}

// Bank details interface
export interface BankDetails {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  iban?: string;
}

// Instructor interface
export interface Instructor extends User {
  role: 'instructor';
  dateOfBirth: string; // timestamp
  telephone: string;
  workingSince: string; // timestamp
  address: string;
  specialties?: string[];
  certifications?: string[];
  bankDetails: BankDetails;
}

// Emergency contact interface
export interface EmergencyContact {
  name: string;
  relationship: string;
  phoneNumber: string;
}

// Client interface
export interface Client extends User {
  role: 'client';
  memberSince: string;
  fitnessGoals: string[];
  healthConditions?: string[];
  emergencyContact: EmergencyContact;
}

// Activity interface
export interface Activity {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  duration: number; // in minutes
  maxParticipants: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  equipment: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Session interface
export interface Session {
  id: string;
  activityId: string;
  instructorId: string;
  startTime: string;
  endTime: string;
  participants: string[]; // array of client UIDs
  maxParticipants: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

// Forum post interface
export interface ForumPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorRole: 'admin' | 'instructor' | 'client';
  tags: string[];
  likes: number;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

// Comment interface
export interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorRole: 'admin' | 'instructor' | 'client';
  likes: number;
  createdAt: string;
  updatedAt: string;
}
