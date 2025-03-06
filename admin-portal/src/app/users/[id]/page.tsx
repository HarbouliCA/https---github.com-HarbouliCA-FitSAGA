'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, deleteDoc, Firestore } from 'firebase/firestore';
import { firestore, auth } from '@/lib/firebase';
import { User } from '@/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PencilIcon, ArrowLeftIcon, TrashIcon } from '@heroicons/react/24/outline';

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
      router.push('/users');
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
          <Link href="/users" className="text-red-700 font-medium hover:text-red-800 mt-2 inline-block">
            Back to Users
          </Link>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const currentUser = auth?.currentUser;
  const isCurrentUser = currentUser?.uid === user.uid;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/users" className="text-gray-600 hover:text-gray-900 flex items-center">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Users
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
              <div className="flex items-center space-x-4">
                <Link
                  href={`/users/${user.uid}/edit`}
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-xl font-semibold mb-4">User Information</h2>
                <div className="space-y-4">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Email</span>
                    <span className="font-medium">{user.email}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Role</span>
                    <span className="font-medium capitalize">{user.role}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Credits</span>
                    <span className="font-medium">{user.credits}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Access Status</span>
                    <span className={`font-medium ${
                      user.accessStatus === 'green' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {user.accessStatus === 'green' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Physical Information</h2>
                <div className="space-y-4">
                  {user.height && (
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-600">Height</span>
                      <span className="font-medium">{user.height} cm</span>
                    </div>
                  )}
                  {user.weight && (
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-600">Weight</span>
                      <span className="font-medium">{user.weight} kg</span>
                    </div>
                  )}
                  {user.birthday && (
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-600">Birthday</span>
                      <span className="font-medium">
                        {user.birthday.toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {user.sex && (
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-600">Sex</span>
                      <span className="font-medium capitalize">{user.sex}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {user.observations && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Observations</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{user.observations}</p>
              </div>
            )}

            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Activity</h2>
              <div className="space-y-4">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Member Since</span>
                  <span className="font-medium">
                    {user.memberSince.toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Last Active</span>
                  <span className="font-medium">
                    {user.lastActive.toLocaleDateString()}
                  </span>
                </div>
                {user.fidelityScore !== undefined && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Fidelity Score</span>
                    <span className="font-medium">{user.fidelityScore}</span>
                  </div>
                )}
              </div>
            </div>
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
