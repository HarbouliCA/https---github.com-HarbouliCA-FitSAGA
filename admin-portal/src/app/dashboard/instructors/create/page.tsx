'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { InstructorFormData } from '@/types';
import { InstructorForm } from '@/components/instructors/InstructorForm';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function CreateInstructorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: InstructorFormData) => {
    if (!firestore) {
      setError('Firebase services not initialized');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create instructor through our backend API
      const response = await fetch('/api/instructors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          fullName: data.fullName,
          dateOfBirth: data.dateOfBirth,
          telephone: data.telephone,
          workingSince: data.workingSince,
          address: data.address,
          bankDetails: data.bankDetails,
          photoURL: data.photoURL || null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create instructor');
      }

      const { uid } = await response.json();

      // Create instructor document in Firestore
      const instructorData = {
        uid,
        fullName: data.fullName,
        email: data.email,
        dateOfBirth: data.dateOfBirth,
        telephone: data.telephone,
        workingSince: data.workingSince,
        address: data.address,
        bankDetails: data.bankDetails,
        role: 'instructor' as const,
        accessStatus: 'green' as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        photoURL: data.photoURL || null
      };

      await setDoc(
        doc(firestore as Firestore, 'instructors', uid),
        instructorData
      );

      // Also create a user document for authentication
      await setDoc(
        doc(firestore as Firestore, 'users', uid),
        {
          uid,
          email: data.email,
          name: data.fullName,
          role: 'instructor',
          memberSince: serverTimestamp(),
          lastActive: serverTimestamp(),
          onboardingCompleted: true,
          accessStatus: 'green',
          photoURL: data.photoURL || null
        }
      );

      router.push('/dashboard/instructors');
    } catch (err) {
      console.error('Error creating instructor:', err);
      setError(err instanceof Error ? err.message : 'Failed to create instructor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/instructors"
            className="btn-secondary flex items-center"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create Instructor</h1>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <InstructorForm
            onSubmit={handleSubmit}
            disabled={loading}
            submitLabel={loading ? 'Creating...' : 'Create Instructor'}
            showPassword={true}
          />
        </div>
      </div>
    </div>
  );
}
