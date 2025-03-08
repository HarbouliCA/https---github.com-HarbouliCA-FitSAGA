'use client';

import { BankDetails } from '@/types';

interface BankDetailsFormProps {
  value: BankDetails;
  onChange: (bankDetails: BankDetails) => void;
  disabled?: boolean;
}

export function BankDetailsForm({ value, onChange, disabled = false }: BankDetailsFormProps) {
  // IBAN validation helper
  const validateIBAN = (iban: string): boolean => {
    // Basic IBAN format validation (simplified)
    const ibanRegex = /^[A-Z]{2}\d{2}[A-Z0-9]{4,}$/;
    return ibanRegex.test(iban.replace(/\s/g, ''));
  };

  // Format IBAN with spaces for better readability
  const formatIBAN = (iban: string): string => {
    return iban.replace(/\s/g, '').match(/.{1,4}/g)?.join(' ') || iban;
  };

  const handleIBANChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawIBAN = e.target.value.toUpperCase().replace(/[^\dA-Z]/g, '');
    onChange({
      ...value,
      iban: rawIBAN
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Bank Details</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">
            Bank Name
          </label>
          <input
            type="text"
            id="bankName"
            value={value.bankName}
            onChange={(e) => onChange({ ...value, bankName: e.target.value })}
            disabled={disabled}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-100 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="accountHolder" className="block text-sm font-medium text-gray-700">
            Account Holder
          </label>
          <input
            type="text"
            id="accountHolder"
            value={value.accountHolder}
            onChange={(e) => onChange({ ...value, accountHolder: e.target.value })}
            disabled={disabled}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-100 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
            Account Number
          </label>
          <input
            type="text"
            id="accountNumber"
            value={value.accountNumber}
            onChange={(e) => onChange({ ...value, accountNumber: e.target.value })}
            disabled={disabled}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-100 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="iban" className="block text-sm font-medium text-gray-700">
            IBAN (Optional)
          </label>
          <input
            type="text"
            id="iban"
            value={formatIBAN(value.iban || '')}
            onChange={handleIBANChange}
            disabled={disabled}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 disabled:bg-gray-100 sm:text-sm ${
              value.iban && !validateIBAN(value.iban)
                ? 'border-red-300 focus:border-red-500'
                : 'border-gray-300 focus:border-primary-500'
            }`}
          />
          {value.iban && !validateIBAN(value.iban) && (
            <p className="mt-1 text-sm text-red-600">
              Please enter a valid IBAN
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
