'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, deleteDoc, Firestore } from 'firebase/firestore';
import { firestore, auth } from '@/lib/firebase';
import { User } from '@/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PencilIcon, ArrowLeftIcon, TrashIcon } from '@heroicons/react/24/outline';
import PageNavigation from '@/components/ui/PageNavigation';

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      if (!firestore) return;

      try {
        const userDoc = await getDoc(doc(firestore as Firestore, 'users', params.id));
        
        if (!userDoc.exists()) {
          setError('User not found');
          setLoading(false);
          return;
        }

        const data = userDoc.data();
        setUser({
          ...data,
          uid: userDoc.id,
          memberSince: data.memberSince?.toDate?.() || new Date(data.memberSince),
          lastActive: data.lastActive?.toDate?.() || new Date(data.lastActive),
          birthday: data.birthday?.toDate?.() || (data.birthday ? new Date(data.birthday) : undefined)
        } as User);
      } catch (error) {
        console.error('Error fetching user:', error);
        setError('Failed to load user');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [params.id]);

  const handleDelete = async () => {
    if (!firestore || !user) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(firestore as Firestore, 'users', user.uid));
      router.push('/dashboard/users');
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <Link href="/dashboard/users" className="text-red-700 font-medium hover:text-red-800 mt-2 inline-block">
            Back to Users
          </Link>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const currentUser = auth?.currentUser;
  const isCurrentUser = currentUser?.uid === user.uid;

  const actions = (
    <div className="flex items-center space-x-4">
      <Link
        href={`/dashboard/users/${user.uid}/edit`}
        className="text-gray-400 hover:text-gray-600"
      >
        <PencilIcon className="h-5 w-5" />
      </Link>
      {!isCurrentUser && (
        <button
          onClick={() => setShowDeleteModal(true)}
          className="text-red-400 hover:text-red-600"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <PageNavigation
        backUrl="/dashboard/users"
        backLabel="Back to Users"
        title={user.name}
        actions={actions}
      />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Email</label>
                  <div className="mt-1 text-sm text-gray-900">{user.email}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Role</label>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {user.role}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Credits</label>
                  <div className="mt-1 text-sm text-gray-900">{user.credits}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Access Status</label>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.accessStatus === 'green'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.accessStatus === 'green' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Additional Information</h2>
              <div className="space-y-4">
                {user.height && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Height</label>
                    <div className="mt-1 text-sm text-gray-900">{user.height} cm</div>
                  </div>
                )}
                {user.weight && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Weight</label>
                    <div className="mt-1 text-sm text-gray-900">{user.weight} kg</div>
                  </div>
                )}
                {user.birthday && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Birthday</label>
                    <div className="mt-1 text-sm text-gray-900">
                      {user.birthday.toLocaleDateString()}
                    </div>
                  </div>
                )}
                {user.sex && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Sex</label>
                    <div className="mt-1 text-sm text-gray-900">{user.sex}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Activity Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Member Since</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {user.memberSince.toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Last Active</label>
                  <div className="mt-1 text-sm text-gray-900">
                    {user.lastActive.toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {user.observations && (
              <div className="md:col-span-2">
                <h2 className="text-xl font-semibold mb-4">Observations</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{user.observations}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Delete User</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {user.name}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn-danger"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
