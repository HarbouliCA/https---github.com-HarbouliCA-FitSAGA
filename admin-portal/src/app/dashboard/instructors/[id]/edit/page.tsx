'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Instructor, InstructorFormData } from '@/types';
import { InstructorForm } from '@/components/instructors/InstructorForm';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface PageProps {
  params: {
    id: string;
  };
}

export default function EditInstructorPage({ params }: PageProps) {
  const router = useRouter();
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInstructor = async () => {
      if (!firestore) return;

      try {
        const instructorDoc = await getDoc(doc(firestore as Firestore, 'instructors', params.id));
        
        if (!instructorDoc.exists()) {
          setError('Instructor not found');
          return;
        }

        const data = instructorDoc.data();
        setInstructor({
          ...data,
          uid: instructorDoc.id,
          dateOfBirth: data.dateOfBirth?.toDate(),
          workingSince: data.workingSince?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          lastActive: data.lastActive?.toDate()
        } as Instructor);
      } catch (err) {
        console.error('Error fetching instructor:', err);
        setError('Failed to load instructor details');
      } finally {
        setLoading(false);
      }
    };

    fetchInstructor();
  }, [params.id]);

  const handleSubmit = async (data: InstructorFormData) => {
    if (!firestore || !instructor) {
      setError('Firebase services not initialized or instructor not loaded');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Update instructor document in Firestore
      const instructorData = {
        fullName: data.fullName,
        email: data.email,
        dateOfBirth: data.dateOfBirth,
        telephone: data.telephone,
        workingSince: data.workingSince,
        address: data.address,
        bankDetails: data.bankDetails,
        updatedAt: serverTimestamp(),
        photoURL: data.photoURL
      };

      await updateDoc(
        doc(firestore as Firestore, 'instructors', params.id),
        instructorData
      );

      // Update the user document as well to keep names in sync
      await updateDoc(
        doc(firestore as Firestore, 'users', params.id),
        {
          name: data.fullName,
          email: data.email,
          updatedAt: serverTimestamp()
        }
      );

      router.push(`/dashboard/instructors/${params.id}`);
    } catch (err) {
      console.error('Error updating instructor:', err);
      setError(err instanceof Error ? err.message : 'Failed to update instructor');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !instructor) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error || 'Failed to load instructor'}</p>
        <Link href="/dashboard/instructors" className="btn-secondary mt-4">
          Back to Instructors
        </Link>
      </div>
    );
  }

  const initialData: InstructorFormData = {
    fullName: instructor.fullName,
    email: instructor.email,
    password: '', // Not needed for edit
    dateOfBirth: instructor.dateOfBirth,
    telephone: instructor.telephone,
    workingSince: instructor.workingSince,
    address: instructor.address,
    bankDetails: instructor.bankDetails,
    photoURL: instructor.photoURL
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href={`/dashboard/instructors/${params.id}`}
            className="btn-secondary flex items-center"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Edit Instructor</h1>
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
            initialData={initialData}
            onSubmit={handleSubmit}
            disabled={saving}
            submitLabel={saving ? 'Saving...' : 'Save Changes'}
            showPassword={false}
          />
        </div>
      </div>
    </div>
  );
}
