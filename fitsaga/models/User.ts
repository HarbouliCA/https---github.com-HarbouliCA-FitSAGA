export interface User {
  id: string;
  name: string;
  email: string;
  gender: 'male' | 'female' | 'other';
  birthdate: string;
  height: number;
  weight: number;
  observation?: string;
  fidelityScore: number;
  scoreCredit: number;
  profileImage?: string;
  hasAccess: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCredential {
  email: string;
  password: string;
}
