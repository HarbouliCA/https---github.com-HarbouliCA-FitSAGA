'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Instructor, InstructorFormData } from '@/types';
import { InstructorForm } from '@/components/instructors/InstructorForm';
import { ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
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
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/instructors/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete instructor');
      }

      router.push('/dashboard/instructors');
    } catch (err) {
      console.error('Error deleting instructor:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete instructor');
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
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
        <button
          onClick={() => setShowDeleteModal(true)}
          className="btn-danger"
          disabled={deleting}
        >
          {deleting ? 'Deleting...' : 'Delete Instructor'}
        </button>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50">
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <h3 className="text-base font-semibold leading-6 text-gray-900">
                        Delete Instructor
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to delete this instructor? This action cannot be undone.
                          The instructor will lose access to all systems and their data will be permanently removed.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
