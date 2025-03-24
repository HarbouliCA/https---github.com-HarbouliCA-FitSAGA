import { ClientSubscription, ClientCredits, FamilyMember } from './subscriptionPlan';

export interface Client {
  // Core fields - identical across platforms
  id: string;                   // Firebase UID
  email: string;                // Login email
  name: string;                 // Full name
  profileImage?: string;        // Profile photo URL
  
  // Personal information
  dateOfBirth: Date;            // Birthday
  gender: 'male' | 'female' | 'other';
  height?: number;              // In cm
  weight?: number;              // In kg
  address?: string;             // Physical address
  telephone?: string;           // Contact number
  
  // Account information
  role: 'client' | 'instructor' | 'admin';
  memberSince: Date;            // Registration date
  lastActive: Date;             // Last login timestamp
  accessStatus: 'active' | 'suspended' | 'inactive';
  
  // Credits & Subscription
  fidelityScore: number;        // Loyalty program points
  subscriptionTier?: string;    // Current subscription level
  subscriptionExpiry?: Date;    // When subscription ends
  subscription?: ClientSubscription;
  credits?: ClientCredits;
  familyMembers?: FamilyMember[];
  subscriptionPlan?: string; // The plan ID
  additionalCredits?: number;  
  // Health & Fitness
  observations?: string;        // Health notes, restrictions 
  fitnessGoals?: string[];      // Selected fitness goals
  
  // App-specific fields
  onboardingCompleted: boolean; // Mobile app onboarding status
  notificationSettings?: {      // User preferences for notifications
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientFormData {
  // Core fields
  email: string;
  name: string;
  profileImage?: string;
  subscriptionPlan?: string;
  additionalCredits?: number;
  
  // Personal information
  dateOfBirth: string; 
  gender: 'male' | 'female' | 'other';
  height?: number;
  weight?: number;
  address?: string;
  telephone?: string;
  
  // Account information
  role: 'client' | 'instructor' | 'admin';
  accessStatus: 'active' | 'suspended' | 'inactive';
  
  // Credits & Subscription
  credits: number;
  fidelityScore: number;
  subscriptionTier?: string;
  subscriptionExpiry?: string; 
  
  // Health & Fitness
  observations?: string;
  fitnessGoals?: string[];
  
  // App-specific fields
  notificationSettings?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

export type ClientFilterOptions = {
  status?: 'active' | 'suspended' | 'inactive';
  subscriptionTier?: string;
  minCredits?: number;
  maxCredits?: number;
  minFidelityScore?: number;
  startDate?: Date;
  endDate?: Date;
}
