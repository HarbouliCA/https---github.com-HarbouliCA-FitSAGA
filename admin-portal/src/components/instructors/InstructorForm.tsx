'use client';

import { useState } from 'react';
import { InstructorFormData, BankDetails } from '@/types';
import { BankDetailsForm } from './BankDetailsForm';

interface InstructorFormProps {
  initialData?: Partial<InstructorFormData>;
  onSubmit: (data: InstructorFormData) => void;
  disabled?: boolean;
  submitLabel?: string;
  showPassword?: boolean;
}

const formatDateForInput = (date: Date | undefined | null): string => {
  if (!date) return '';
  try {
    return date instanceof Date ? date.toISOString().split('T')[0] : '';
  } catch (error) {
    console.error('Invalid date:', error);
    return '';
  }
};

export function InstructorForm({ 
  initialData,
  onSubmit,
  disabled = false,
  submitLabel = 'Save',
  showPassword = false
}: InstructorFormProps) {
  const [formData, setFormData] = useState<InstructorFormData>({
    fullName: initialData?.fullName || '',
    email: initialData?.email || '',
    password: initialData?.password || '',
    dateOfBirth: initialData?.dateOfBirth || new Date(),
    telephone: initialData?.telephone || '',
    workingSince: initialData?.workingSince || new Date(),
    address: initialData?.address || '',
    bankDetails: initialData?.bankDetails || {
      bankName: '',
      accountHolder: '',
      accountNumber: '',
      iban: ''
    },
    photoURL: initialData?.photoURL
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              disabled={disabled}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-100 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={disabled}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-100 sm:text-sm"
            />
          </div>

          {showPassword && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={disabled}
                required
                minLength={6}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-100 sm:text-sm"
              />
            </div>
          )}

          <div>
            <label htmlFor="telephone" className="block text-sm font-medium text-gray-700">
              Telephone
            </label>
            <input
              type="tel"
              id="telephone"
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              disabled={disabled}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-100 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
              Date of Birth
            </label>
            <input
              type="date"
              id="dateOfBirth"
              value={formatDateForInput(formData.dateOfBirth)}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: new Date(e.target.value) })}
              disabled={disabled}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-100 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="workingSince" className="block text-sm font-medium text-gray-700">
              Working Since
            </label>
            <input
              type="date"
              id="workingSince"
              value={formatDateForInput(formData.workingSince)}
              onChange={(e) => setFormData({ ...formData, workingSince: new Date(e.target.value) })}
              disabled={disabled}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-100 sm:text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <textarea
              id="address"
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              disabled={disabled}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-100 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Bank Details */}
      <BankDetailsForm
        value={formData.bankDetails}
        onChange={(bankDetails) => setFormData({ ...formData, bankDetails })}
        disabled={disabled}
      />

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={disabled}
          className="btn-primary"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
