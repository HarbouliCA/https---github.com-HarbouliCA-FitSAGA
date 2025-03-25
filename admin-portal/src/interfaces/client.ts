export interface Client {
  id: string;
  name: string;
  accessStatus?: string;
  address?: string;
  createdAt?: string;
  credits?: number | {
    total: number | string | "unlimited";
    intervalCredits?: number;
    lastRefilled?: Date;
    [key: string]: any; // Allow for other properties
  };
  gymCredits?: number | "unlimited" | string;
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
  subscriptionPlan: string;
  subscriptionTier?: string;
  telephone?: string;
  updatedAt?: string;
  weight?: number | null;
  intervalCredits?: number;
  accountNumber?: string;
  bicCode?: string;
  accountHolder?: string;
  bankName?: string;
} 