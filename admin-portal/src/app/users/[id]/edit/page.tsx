'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, Firestore } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { User } from '@/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageNavigation from '@/components/ui/PageNavigation';
import { useForm, SubmitHandler } from 'react-hook-form';

type FormValues = {
  name: string;
  email: string;
  role: 'user' | 'trainer' | 'admin';
  credits: number;
  height?: number;
  weight?: number;
  birthday?: string;
  sex?: 'male' | 'female' | 'other';
  observations?: string;
  accessStatus: 'green' | 'red';
};

export default function EditUserPage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>();

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
        const userData = {
          ...data,
          uid: userDoc.id,
          memberSince: data.memberSince?.toDate?.() || new Date(data.memberSince),
          lastActive: data.lastActive?.toDate?.() || new Date(data.lastActive),
          birthday: data.birthday?.toDate?.() || (data.birthday ? new Date(data.birthday) : undefined)
        } as User;

        setUser(userData);
        reset({
          name: userData.name,
          email: userData.email,
          role: userData.role,
          credits: userData.credits,
          height: userData.height,
          weight: userData.weight,
          birthday: userData.birthday ? userData.birthday.toISOString().split('T')[0] : undefined,
          sex: userData.sex,
          observations: userData.observations,
          accessStatus: userData.accessStatus || 'green'
        });
      } catch (error) {
        console.error('Error fetching user:', error);
        setError('Failed to load user');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [params.id, reset]);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    if (!firestore) {
      setError('Firebase services not initialized');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const userRef = doc(firestore as Firestore, 'users', params.id);
      await updateDoc(userRef, {
        ...data,
        birthday: data.birthday ? new Date(data.birthday) : null,
        height: data.height || null,
        weight: data.weight || null,
        observations: data.observations || null,
        updatedAt: new Date()
      });

      router.push(`/users/${params.id}`);
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user');
    } finally {
      setSaving(false);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <PageNavigation
          backUrl={`/users/${user.uid}`}
          backLabel="Back to User Details"
          title={`Edit ${user.name}`}
        />

        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  {...register('name', { required: 'Name is required' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  {...register('email', { required: 'Email is required' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  id="role"
                  {...register('role', { required: 'Role is required' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="user">User</option>
                  <option value="trainer">Trainer</option>
                  <option value="admin">Admin</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="credits" className="block text-sm font-medium text-gray-700">
                  Credits
                </label>
                <input
                  type="number"
                  id="credits"
                  {...register('credits', { required: 'Credits is required' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
                {errors.credits && (
                  <p className="mt-1 text-sm text-red-600">{errors.credits.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="height" className="block text-sm font-medium text-gray-700">
                  Height (cm)
                </label>
                <input
                  type="number"
                  id="height"
                  {...register('height', { min: 0 })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  id="weight"
                  {...register('weight', { min: 0 })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              <div>
                <label htmlFor="birthday" className="block text-sm font-medium text-gray-700">
                  Birthday
                </label>
                <input
                  type="date"
                  id="birthday"
                  {...register('birthday')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              <div>
                <label htmlFor="sex" className="block text-sm font-medium text-gray-700">
                  Sex
                </label>
                <select
                  id="sex"
                  {...register('sex')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="observations" className="block text-sm font-medium text-gray-700">
                  Observations
                </label>
                <textarea
                  id="observations"
                  {...register('observations')}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>

              <div>
                <label htmlFor="accessStatus" className="block text-sm font-medium text-gray-700">
                  Access Status
                </label>
                <select
                  id="accessStatus"
                  {...register('accessStatus', { required: 'Access status is required' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="green">Active</option>
                  <option value="red">Inactive</option>
                </select>
                {errors.accessStatus && (
                  <p className="mt-1 text-sm text-red-600">{errors.accessStatus.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  router.back();
                }}
                className="btn-secondary"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
