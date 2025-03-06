'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, Firestore } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Session } from '@/types';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import PageNavigation from '@/components/ui/PageNavigation';

type FormData = {
  activityId: string;
  activityName: string;
  title: string;
  description?: string;
  notes?: string;
  startTime: Date;
  endTime: Date;
  capacity: number;
  bookedCount: number;
  instructor?: string;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    repeatEvery: number;
    weekdays?: string[];
    endDate: Date;
    parentSessionId?: string;
  };
};

export default function EditSessionPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  useEffect(() => {
    const fetchSession = async () => {
      if (!firestore) return;

      try {
        const sessionDoc = await getDoc(doc(firestore as Firestore, 'sessions', params.id));
        
        if (!sessionDoc.exists()) {
          setError('Session not found');
          setLoading(false);
          return;
        }

        const data = sessionDoc.data();
        reset({
          ...data,
          startTime: data.startTime?.toDate(),
          endTime: data.endTime?.toDate()
        } as FormData);
      } catch (error) {
        console.error('Error fetching session:', error);
        setError('Failed to load session');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [params.id, reset]);

  const onSubmit = async (data: FormData) => {
    if (!firestore) return;
    
    setSaving(true);
    try {
      const updateData = {
        ...data,
        updatedAt: new Date(),
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        capacity: Number(data.capacity),
        bookedCount: Number(data.bookedCount),
        recurring: data.recurring ? {
          ...data.recurring,
          endDate: new Date(data.recurring.endDate),
          repeatEvery: Number(data.recurring.repeatEvery)
        } : undefined
      };
      await updateDoc(doc(firestore as Firestore, 'sessions', params.id), updateData);
      router.push(`/dashboard/sessions/${params.id}`);
    } catch (error) {
      console.error('Error updating session:', error);
      setError('Failed to update session');
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
            onClick={() => router.push('/dashboard/sessions')}
            className="text-red-700 font-medium hover:text-red-800 mt-2"
          >
            Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageNavigation
        backUrl={`/dashboard/sessions/${params.id}`}
        backLabel="Back to Session"
        title="Edit Session"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  {...register('title', { required: 'Title is required' })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Activity Name</label>
                <input
                  type="text"
                  {...register('activityName', { required: 'Activity name is required' })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {errors.activityName && (
                  <p className="mt-1 text-sm text-red-600">{errors.activityName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Activity ID</label>
                <input
                  type="text"
                  {...register('activityId', { required: 'Activity ID is required' })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {errors.activityId && (
                  <p className="mt-1 text-sm text-red-600">{errors.activityId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Instructor</label>
                <input
                  type="text"
                  {...register('instructor')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Start Time</label>
                <input
                  type="datetime-local"
                  {...register('startTime', { required: 'Start time is required' })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {errors.startTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">End Time</label>
                <input
                  type="datetime-local"
                  {...register('endTime', { required: 'End time is required' })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {errors.endTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Capacity</label>
                <input
                  type="number"
                  {...register('capacity', { 
                    required: 'Capacity is required',
                    min: { value: 1, message: 'Capacity must be at least 1' }
                  })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {errors.capacity && (
                  <p className="mt-1 text-sm text-red-600">{errors.capacity.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Booked Count</label>
                <input
                  type="number"
                  {...register('bookedCount', { 
                    required: 'Booked count is required',
                    min: { value: 0, message: 'Booked count cannot be negative' }
                  })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                {errors.bookedCount && (
                  <p className="mt-1 text-sm text-red-600">{errors.bookedCount.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>

              <div className="md:col-span-2 border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recurring Schedule</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Frequency</label>
                    <select
                      {...register('recurring.frequency')}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="">Not recurring</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Repeat Every</label>
                    <input
                      type="number"
                      {...register('recurring.repeatEvery', {
                        min: { value: 1, message: 'Must be at least 1' }
                      })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                    {errors.recurring?.repeatEvery && (
                      <p className="mt-1 text-sm text-red-600">{errors.recurring.repeatEvery.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <input
                      type="date"
                      {...register('recurring.endDate')}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Parent Session ID</label>
                    <input
                      type="text"
                      {...register('recurring.parentSessionId')}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                  </div>
                </div>
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
        </div>
      </form>
    </div>
  );
}
