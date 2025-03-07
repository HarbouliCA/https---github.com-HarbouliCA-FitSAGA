export type StaffRole = 'ADMIN' | 'DIRECTOR' | 'SECRETARY' | 'INSTRUCTOR';

export interface Address {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface BankDetails {
  accountHolder: string;
  iban: string;
  bankName?: string;
}

export interface StaffFormData {
  firstName: string;
  lastName: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: Date;
  email: string;
  phone: string;
  employedSince: Date;
  role: StaffRole;
  address: Address;
  bankDetails: BankDetails;
  status: 'active' | 'inactive';
}

export interface Staff extends StaffFormData {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export const staffRoleDisplayNames: Record<StaffRole, string> = {
  'ADMIN': 'Administrator',
  'DIRECTOR': 'Director',
  'SECRETARY': 'Secretary',
  'INSTRUCTOR': 'Instructor'
};
