export interface SubscriptionPlan {
    id: string;
    name: string;
    type: 'individual' | 'family' | 'special';
    planCategory: 'credits_8' | 'credits_12' | 'unlimited' | 'interval' | 'pilates' | 'registration';
    price: number;
    currency: string;
    credits: number;
    intervalCredits: number;
    unlimited: boolean;
    familySize?: number; // For different family tiers (small, medium, large)
    familyTier?: 'small' | 'medium' | 'large'; // Representing the different price points
    description?: string;
    features?: string[];
    registrationFee?: number;
    isRegistrationFee?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }
  
  export interface ClientSubscription {
    planId: string;
    startDate: Date;
    endDate: Date;
    status: 'active' | 'cancelled' | 'expired';
    autoRenew: boolean;
  }
  
  export interface ClientCredits {
    total: number;
    intervalCredits: number;
    lastRefilled: Date;
  }
  
  export interface FamilyMember {
    name: string;
    email?: string;
    phone?: string;
  }