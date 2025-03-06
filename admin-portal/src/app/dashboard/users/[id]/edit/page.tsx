'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, Firestore } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { User } from '@/types';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import PageNavigation from '@/components/ui/PageNavigation';

type FormData = Omit<User, 'uid'>;

export default function EditUserPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

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
        reset({
          ...data,
          memberSince: data.memberSince?.toDate(),
          lastActive: data.lastActive?.toDate(),
          birthday: data.birthday?.toDate()
        } as FormData);
      } catch (error) {
        console.error('Error fetching user:', error);
        setError('Failed to load user');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [params.id, reset]);

  const onSubmit = async (data: FormData) => {
    if (!firestore) return;
    
    setSaving(true);
    try {
      await updateDoc(doc(firestore as Firestore, 'users', params.id), data);
      router.push(`/dashboard/users/${params.id}`);
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button 
            onClick={() => router.push('/dashboard/users')}
            className="text-red-700 font-medium hover:text-red-800 mt-2"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageNavigation
        backUrl={`/dashboard/users/${params.id}`}
        backLabel="Back to User"
        title="Edit User"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  {...register('name', { required: 'Name is required' })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  {...register('role', { required: 'Role is required' })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Select role</option>
                  <option value="user">User</option>
                  <option value="trainer">Trainer</option>
                  <option value="admin">Admin</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Credits</label>
                <input
                  type="number"
                  {...register('credits', { 
                    required: 'Credits is required',
                    min: { value: 0, message: 'Credits cannot be negative' }
                  })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {errors.credits && (
                  <p className="mt-1 text-sm text-red-600">{errors.credits.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
                <input
                  type="number"
                  {...register('height', { 
                    min: { value: 0, message: 'Height cannot be negative' }
                  })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {errors.height && (
                  <p className="mt-1 text-sm text-red-600">{errors.height.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                <input
                  type="number"
                  {...register('weight', { 
                    min: { value: 0, message: 'Weight cannot be negative' }
                  })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {errors.weight && (
                  <p className="mt-1 text-sm text-red-600">{errors.weight.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Sex</label>
                <select
                  {...register('sex')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Select sex</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Observations</label>
              <textarea
                {...register('observations')}
                rows={4}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
