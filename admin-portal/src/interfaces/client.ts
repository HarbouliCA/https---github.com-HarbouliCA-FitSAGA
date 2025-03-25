export interface Client {
  id: string;
  name: string;
  accessStatus?: string;
  address?: string;
  createdAt?: string;
  credits?: number; // if available from client record
  gymCredits: number | "unlimited";
  dateOfBirth?: string;
  dietaryRestrictions?: string;
  email?: string;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  fidelityScore?: number;
  fitnessGoals?: string[];
  gender?: string;
  healthGoals?: string[];
  height?: number | null;
  lastActive?: string;
  memberSince?: string;
  notificationPreferences?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  notificationSettings?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  observations?: string | null;
  onboardingCompleted?: boolean;
  profileImage?: string | null;
  recentBookings?: any[];
  role?: string;
  subscriptionExpiry?: string;
  subscriptionPlan: string; // plan id stored in client record
  telephone?: string;
  updatedAt?: string;
  weight?: number | null;
  intervalCredits: number;
} 