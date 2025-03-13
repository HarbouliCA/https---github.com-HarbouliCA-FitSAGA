/**
 * Shared type definitions for FitSAGA admin portal and mobile app
 * These types ensure consistency between platforms
 */

// User roles
export type UserRole = 'admin' | 'instructor' | 'client';

// User interface
export interface User {
  uid: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string | Date;
  lastLogin?: string | Date;
  photoURL?: string;
  phoneNumber?: string;
}

// Instructor interface
export interface Instructor extends User {
  role: 'instructor';
  dateOfBirth: string | Date;
  telephone: string;
  workingSince: string | Date;
  address: string;
  accessStatus: 'green' | 'yellow' | 'red'; // Active, Warning, Suspended
  bankDetails: {
    bankName: string;
    accountHolder: string;
    accountNumber: string;
    iban?: string;
  };
}

// Client interface
export interface Client extends User {
  role: 'client';
  dateOfBirth?: string | Date;
  telephone?: string;
  address?: string;
  memberSince: string | Date;
  accessStatus: 'active' | 'suspended' | 'inactive';
  credits: number;
  fidelityScore?: number;
  healthGoals?: string[];
  dietaryRestrictions?: string[];
  subscriptionTier?: string;
  subscriptionExpiry?: string | Date;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  notificationPreferences?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

// Session interface
export interface Session {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructorName: string;
  dateTime: string | Date;
  duration: number; // in minutes
  maxParticipants: number;
  currentParticipants: number;
  participants: string[]; // array of user IDs
  location: string;
  status: 'scheduled' | 'cancelled' | 'completed';
  activityType: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  imageUrl?: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

// Activity interface
export interface Activity {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  caloriesBurn?: number;
  imageUrl?: string;
  videoUrl?: string;
  instructions: string[];
  equipment?: string[];
  createdBy: string; // user ID
  createdAt: string | Date;
  updatedAt?: string | Date;
  isActive: boolean;
}

// Tutorial interface
export interface Tutorial {
  id: string;
  title: string;
  description: string;
  content: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  createdAt: string | Date;
  updatedAt?: string | Date;
  publishedAt?: string | Date;
  isPublished: boolean;
}

// Contract interface
export interface Contract {
  id: string;
  userId: string;
  title: string;
  description: string;
  filePath: string;
  status: 'pending' | 'signed' | 'expired';
  createdAt: string | Date;
  expiresAt: string | Date;
  signedAt?: string | Date;
  signature?: string;
}

// Booking interface
export interface Booking {
  id: string;
  userId: string;
  userName: string;
  sessionId: string;
  sessionTitle: string;
  bookedAt: string | Date;
  status: 'confirmed' | 'cancelled' | 'attended';
}

// Device interface for push notifications
export interface Device {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceName: string;
  lastUpdated: string | Date;
}

// Notification interface
export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string | Date;
  type: 'session' | 'contract' | 'announcement' | 'message';
}
