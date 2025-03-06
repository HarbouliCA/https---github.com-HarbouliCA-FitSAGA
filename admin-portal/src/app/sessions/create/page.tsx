'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { collection, addDoc, getDocs, query, serverTimestamp, Firestore } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Activity } from '@/types';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

type FormInputs = {
  title: string;
  activityId: string;
  description: string;
  startDate: string;
  startTime: string;
  endTime: string;
  capacity: number;
  location: string;
  instructor: string;
};

export default function CreateSessionPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activities, setActivities] = useState<Activity[]>([]);
  const router = useRouter();
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormInputs>({
    defaultValues: {
      capacity: 10,
    }
  });
  
  useEffect(() => {
    // Only run this effect on the client side
    if (typeof window === 'undefined' || !firestore) return;
    
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const activitiesQuery = query(collection(firestore as Firestore, 'activities'));
        const activitiesSnapshot = await getDocs(activitiesQuery);
        
        const activitiesList: Activity[] = [];
        activitiesSnapshot.forEach((doc) => {
          activitiesList.push({ id: doc.id, ...doc.data() } as Activity);
        });
        
        setActivities(activitiesList);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivities();
  }, []);
  
  const onSubmit: SubmitHandler<FormInputs> = async (data) => {
    setLoading(true);
    setError('');
    
    try {
      if (!firestore) {
        throw new Error('Firebase services not initialized');
      }
      
      // Combine date and time
      const startDateTime = new Date(`${data.startDate}T${data.startTime}`);
      const endDateTime = new Date(`${data.startDate}T${data.endTime}`);
      
      // Validate that end time is after start time
      if (endDateTime <= startDateTime) {
        setError('End time must be after start time');
        setLoading(false);
        return;
      }
      
      // Create session in Firestore
      await addDoc(collection(firestore as Firestore, 'sessions'), {
        title: data.title,
        activityId: data.activityId,
        description: data.description,
        startTime: startDateTime,
        endTime: endDateTime,
        capacity: Number(data.capacity),
        bookedCount: 0,
        location: data.location,
        instructor: data.instructor,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      router.push('/sessions');
    } catch (error: any) {
      console.error('Error creating session:', error);
      setError(error.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/sessions" className="text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="page-title">Create New Session</h1>
      </div>
      
      <div className="card max-w-3xl">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="title" className="form-label">Session Title</label>
              <input
                id="title"
                type="text"
                className={`input-field ${errors.title ? 'border-red-500' : ''}`}
                {...register('title', { required: 'Session title is required' })}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="activityId" className="form-label">Activity</label>
              <select
                id="activityId"
                className={`input-field ${errors.activityId ? 'border-red-500' : ''}`}
                {...register('activityId', { required: 'Activity is required' })}
              >
                <option value="">Select an activity</option>
                {activities.map((activity) => (
                  <option key={activity.id} value={activity.id}>
                    {activity.name} ({activity.creditValue} credits)
                  </option>
                ))}
              </select>
              {errors.activityId && (
                <p className="mt-1 text-sm text-red-600">{errors.activityId.message}</p>
              )}
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="description" className="form-label">Description</label>
              <textarea
                id="description"
                rows={3}
                className={`input-field ${errors.description ? 'border-red-500' : ''}`}
                {...register('description', { required: 'Description is required' })}
              ></textarea>
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="startDate" className="form-label">Date</label>
              <input
                id="startDate"
                type="date"
                className={`input-field ${errors.startDate ? 'border-red-500' : ''}`}
                {...register('startDate', { required: 'Date is required' })}
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
              )}
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="startTime" className="form-label">Start Time</label>
                <input
                  id="startTime"
                  type="time"
                  className={`input-field ${errors.startTime ? 'border-red-500' : ''}`}
                  {...register('startTime', { required: 'Start time is required' })}
                />
                {errors.startTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
                )}
              </div>
              
              <div className="flex-1">
                <label htmlFor="endTime" className="form-label">End Time</label>
                <input
                  id="endTime"
                  type="time"
                  className={`input-field ${errors.endTime ? 'border-red-500' : ''}`}
                  {...register('endTime', { required: 'End time is required' })}
                />
                {errors.endTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="capacity" className="form-label">Capacity</label>
              <input
                id="capacity"
                type="number"
                className={`input-field ${errors.capacity ? 'border-red-500' : ''}`}
                {...register('capacity', { 
                  required: 'Capacity is required',
                  valueAsNumber: true,
                  min: {
                    value: 1,
                    message: 'Capacity must be at least 1'
                  }
                })}
              />
              {errors.capacity && (
                <p className="mt-1 text-sm text-red-600">{errors.capacity.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="location" className="form-label">Location</label>
              <input
                id="location"
                type="text"
                className={`input-field ${errors.location ? 'border-red-500' : ''}`}
                {...register('location', { required: 'Location is required' })}
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="instructor" className="form-label">Instructor</label>
              <input
                id="instructor"
                type="text"
                className={`input-field ${errors.instructor ? 'border-red-500' : ''}`}
                {...register('instructor', { required: 'Instructor is required' })}
              />
              {errors.instructor && (
                <p className="mt-1 text-sm text-red-600">{errors.instructor.message}</p>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Link href="/sessions" className="btn-outline">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
