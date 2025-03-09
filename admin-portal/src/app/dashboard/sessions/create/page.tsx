'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, getDoc, doc, writeBatch, Firestore, query, where, orderBy, limit } from 'firebase/firestore';
import { useFirebase } from '@/contexts/FirebaseContext';
import { Activity, SessionFormData, ActivityType, RecurringRule } from '@/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { PageNavigation } from '@/components/layout/PageNavigation';
import { InstructorSelect } from '@/components/instructors/InstructorSelect';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const weekdays = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
] as const;

interface RecurringSession {
  activityId: string;
  activityName: string;
  activityType: ActivityType;
  startTime: Date;
  endTime: Date;
  capacity: number;
  status: 'scheduled';
  enrolledCount: number;
  instructorId: string;
  instructorName: string;
  instructorPhotoURL?: string;
  recurring: RecurringRule;
  createdAt: Date;
  updatedAt: Date;
}

export default function CreateSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { firestore } = useFirebase();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<SessionFormData>({
    defaultValues: {
      capacity: 10,
      status: 'scheduled',
      startTime: new Date(),
      endTime: new Date(new Date().setHours(new Date().getHours() + 1)),
      isRecurring: false,
      activityType: 'ENTREMIENTO_PERSONAL',
      recurring: {
        frequency: 'weekly',
        repeatEvery: 1,
        weekdays: [],
        endDate: new Date(new Date().setDate(new Date().getDate() + 7))
      }
    }
  });

  const isRecurring = watch('isRecurring');
  const frequency = watch('recurring.frequency');

  // Check for instructor ID in URL params
  useEffect(() => {
    if (!searchParams) return;
    
    const instructorId = searchParams.get('instructorId');
    const instructorName = searchParams.get('instructorName');
    if (instructorId && instructorName) {
      setValue('instructorId', instructorId);
      setValue('instructorName', instructorName);
    }
  }, [searchParams, setValue]);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!firestore) return;

      try {
        const querySnapshot = await getDocs(collection(firestore as Firestore, 'activities'));
        const activitiesList = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || '',
            description: data.description || '',
            type: data.type || 'ENTREMIENTO_PERSONAL',
            duration: Number(data.duration) || 60,
            capacity: Number(data.capacity) || 10,
            creditValue: Number(data.creditValue) || 1,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          } satisfies Activity;
        });
        setActivities(activitiesList);
      } catch (error) {
        console.error('Error fetching activities:', error);
        setError('Failed to load activities');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [firestore]);

  const handleActivityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const activityId = e.target.value;
    const activity = activities.find(a => a.id === activityId) || null;
    setSelectedActivity(activity);

    if (activity) {
      setValue('activityId', activity.id);
      setValue('activityName', activity.name);
      setValue('activityType', activity.type);
      setValue('capacity', activity.capacity);

      // Update end time based on activity duration
      const startTime = watch('startTime');
      if (startTime && activity.duration) {
        const endTime = new Date(startTime.getTime());
        endTime.setMinutes(endTime.getMinutes() + activity.duration);
        setValue('endTime', endTime);
      }
    } else {
      setValue('activityId', '');
      setValue('activityName', '');
      setValue('activityType', 'ENTREMIENTO_PERSONAL');
      setValue('capacity', 10);
      
      // Reset end time to 1 hour after start time
      const startTime = watch('startTime');
      if (startTime) {
        const endTime = new Date(startTime.getTime());
        endTime.setHours(endTime.getHours() + 1);
        setValue('endTime', endTime);
      }
    }
  };

  // Update end time when start time changes
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'startTime' && selectedActivity) {
        const startTime = value.startTime as Date;
        if (startTime) {
          const endTime = new Date(startTime.getTime());
          endTime.setMinutes(endTime.getMinutes() + selectedActivity.duration);
          setValue('endTime', endTime);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue, selectedActivity]);

  const onSubmit = async (data: SessionFormData) => {
    if (!firestore) return;

    setSaving(true);
    setError(null);

    try {
      // Validate activity selection
      if (!selectedActivity) {
        setError('Please select an activity');
        setSaving(false);
        return;
      }

      // Validate instructor permissions
      const instructorDoc = await getDoc(doc(firestore, 'instructors', data.instructorId));
      if (!instructorDoc.exists()) {
        setError('Selected instructor not found');
        setSaving(false);
        return;
      }

      const instructor = instructorDoc.data();
      if (instructor.role !== 'instructor') {
        setError('Selected user is not an instructor');
        setSaving(false);
        return;
      }

      if (instructor.accessStatus === 'red') {
        setError('Selected instructor does not have active access');
        setSaving(false);
        return;
      }

      // Check instructor's existing sessions for time conflicts
      const sessionStartTime = new Date(data.startTime);
      const sessionEndTime = new Date(data.endTime);

      // Instead of querying by day range, query sessions that might overlap
      const existingSessionsQuery = query(
        collection(firestore, 'sessions'),
        where('instructorId', '==', data.instructorId),
        where('startTime', '<=', sessionEndTime),
        orderBy('startTime', 'desc'),
        limit(10)
      );

      try {
        const existingSessions = await getDocs(existingSessionsQuery);
        const hasTimeConflict = existingSessions.docs.some(doc => {
          const session = doc.data();
          const existingStart = session.startTime.toDate();
          const existingEnd = session.endTime.toDate();
          
          // Check if sessions overlap
          return (
            (sessionStartTime >= existingStart && sessionStartTime < existingEnd) ||
            (sessionEndTime > existingStart && sessionEndTime <= existingEnd) ||
            (sessionStartTime <= existingStart && sessionEndTime >= existingEnd)
          );
        });

        if (hasTimeConflict) {
          setError('Selected instructor has conflicting sessions during this time');
          setSaving(false);
          return;
        }
      } catch (error: any) {
        if (error?.message?.includes('requires an index')) {
          console.warn('Missing Firestore index, proceeding without time conflict check');
          // Continue without time conflict check until index is created
        } else {
          throw error;
        }
      }

      const baseSessionData = {
        activityId: selectedActivity.id,
        activityName: selectedActivity.name,
        activityType: selectedActivity.type,
        capacity: data.capacity,
        status: 'scheduled' as const,
        enrolledCount: 0,
        instructorId: data.instructorId,
        instructorName: data.instructorName,
        instructorPhotoURL: instructor.photoURL,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      if (!data.isRecurring) {
        // Create a single session
        const sessionData = {
          ...baseSessionData,
          startTime: data.startTime,
          endTime: data.endTime,
          recurring: null
        };

        const docRef = await addDoc(collection(firestore, 'sessions'), sessionData);
        router.push(`/dashboard/sessions/${docRef.id}`);
        return;
      }

      // Validate recurring settings
      if (!data.recurring?.frequency || !data.recurring?.endDate) {
        setError('Please fill in all recurring session details');
        setSaving(false);
        return;
      }

      const recurring = data.recurring;

      if (recurring.frequency === 'weekly' && (!recurring.weekdays || recurring.weekdays.length === 0)) {
        setError('Please select at least one weekday for weekly recurring sessions');
        setSaving(false);
        return;
      }

      // Handle recurring sessions
      const sessions: Array<Omit<RecurringSession, 'recurring'> & { recurring: Omit<RecurringRule, 'parentSessionId'> }> = [];
      const startDate = new Date(data.startTime);
      const endDate = new Date(recurring.endDate);
      const repeatEvery = recurring.repeatEvery || 1;

      // Validate date range
      if (endDate < startDate) {
        setError('End date cannot be before start date');
        setSaving(false);
        return;
      }

      // Maximum 3 months of recurring sessions
      const maxEndDate = new Date(startDate);
      maxEndDate.setMonth(maxEndDate.getMonth() + 3);
      if (endDate > maxEndDate) {
        setError('Recurring sessions can only be created for up to 3 months');
        setSaving(false);
        return;
      }

      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        const weekdayName = weekdays[dayOfWeek].value;
        
        const shouldCreateSession = recurring.frequency === 'daily' ||
          (recurring.frequency === 'weekly' && recurring.weekdays?.includes(weekdayName)) ||
          (recurring.frequency === 'monthly' && currentDate.getDate() === startDate.getDate());

        if (shouldCreateSession) {
          // Create session at current date
          const sessionStartTime = new Date(currentDate);
          sessionStartTime.setHours(startDate.getHours(), startDate.getMinutes());
          
          const sessionEndTime = new Date(sessionStartTime);
          const duration = data.endTime.getTime() - data.startTime.getTime();
          sessionEndTime.setTime(sessionStartTime.getTime() + duration);

          // Check if session time is in the future
          if (sessionStartTime > new Date()) {
            const recurringRule = {
              frequency: recurring.frequency,
              repeatEvery,
              weekdays: recurring.weekdays || [],
              endDate: recurring.endDate
            };

            sessions.push({
              ...baseSessionData,
              startTime: sessionStartTime,
              endTime: sessionEndTime,
              recurring: recurringRule
            });
          }
        }

        // Increment date based on frequency
        switch (recurring.frequency) {
          case 'daily':
            currentDate.setDate(currentDate.getDate() + repeatEvery);
            break;
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 1); // Check each day for weekly recurrence
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + repeatEvery);
            break;
        }
      }

      if (sessions.length === 0) {
        setError('No valid future sessions were created. Please check your recurring settings.');
        setSaving(false);
        return;
      }

      if (sessions.length > 50) {
        setError('Too many recurring sessions. Please reduce the date range or frequency.');
        setSaving(false);
        return;
      }

      // Check for time conflicts across all recurring sessions
      const allSessionTimes = sessions.map(session => ({
        start: session.startTime,
        end: session.endTime
      }));

      const hasRecurringConflict = allSessionTimes.some((session1, index1) =>
        allSessionTimes.some((session2, index2) =>
          index1 !== index2 && (
            (session1.start >= session2.start && session1.start < session2.end) ||
            (session1.end > session2.start && session1.end <= session2.end) ||
            (session1.start <= session2.start && session1.end >= session2.end)
          )
        )
      );

      if (hasRecurringConflict) {
        setError('Some recurring sessions have time conflicts. Please check your recurring settings.');
        setSaving(false);
        return;
      }

      // Create all sessions and link them
      const batch = writeBatch(firestore);
      
      // Create first session
      const firstSessionRef = doc(collection(firestore, 'sessions'));
      const firstSession = {
        ...sessions[0],
        recurring: {
          ...sessions[0].recurring,
          parentSessionId: null // First session has no parent
        }
      };
      batch.set(firstSessionRef, firstSession);

      // Create child sessions
      for (let i = 1; i < sessions.length; i++) {
        const docRef = doc(collection(firestore, 'sessions'));
        const session = {
          ...sessions[i],
          recurring: {
            ...sessions[i].recurring,
            parentSessionId: firstSessionRef.id // Link to parent session
          }
        };
        batch.set(docRef, session);
      }

      // Commit all sessions at once
      await batch.commit();
      router.push(`/dashboard/sessions/${firstSessionRef.id}`);
    } catch (err) {
      console.error('Error creating session(s):', err);
      setError('Failed to create session(s)');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <PageNavigation title="Create Session" />
        <div className="mt-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3 mt-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <PageNavigation title="Create Session" />
      
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6 max-w-2xl">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900">Session Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Activity
              </label>
              <select
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                onChange={handleActivityChange}
                required
              >
                <option value="">Select an activity</option>
                {activities.map((activity) => (
                  <option key={activity.id} value={activity.id}>
                    {activity.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Instructor
              </label>
              <InstructorSelect
                value={watch('instructorId')}
                onChange={(id, name) => {
                  setValue('instructorId', id);
                  setValue('instructorName', name);
                }}
                required
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Start Time
                </label>
                <Controller
                  control={control}
                  name="startTime"
                  render={({ field }) => (
                    <DatePicker
                      selected={field.value}
                      onChange={(date) => {
                        field.onChange(date);
                        if (selectedActivity?.duration && date) {
                          const endTime = new Date(date.getTime());
                          endTime.setMinutes(endTime.getMinutes() + selectedActivity.duration);
                          setValue('endTime', endTime);
                        }
                      }}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={15}
                      dateFormat="MMMM d, yyyy h:mm aa"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    />
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  End Time
                </label>
                <Controller
                  control={control}
                  name="endTime"
                  render={({ field }) => (
                    <DatePicker
                      selected={field.value}
                      onChange={field.onChange}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={15}
                      dateFormat="MMMM d, yyyy h:mm aa"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                      minDate={watch('startTime')}
                    />
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Capacity
                </label>
                <input
                  type="number"
                  {...register('capacity')}
                  min={1}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('isRecurring')}
                  id="isRecurring"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isRecurring" className="ml-2 block text-sm font-medium text-gray-700">
                  Recurring Session
                </label>
              </div>
            </div>

            {isRecurring && (
              <div className="space-y-4 pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Frequency
                  </label>
                  <select
                    {...register('recurring.frequency')}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Repeat Every
                  </label>
                  <div className="mt-1 flex items-center">
                    <input
                      type="number"
                      {...register('recurring.repeatEvery')}
                      min={1}
                      className="block w-24 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                    />
                    <span className="ml-2 text-sm text-gray-500">
                      {frequency === 'daily' ? 'Days' : frequency === 'weekly' ? 'Weeks' : 'Months'}
                    </span>
                  </div>
                </div>

                {frequency === 'weekly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Repeat On
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {weekdays.map((day) => (
                        <label key={day.value} className="inline-flex items-center">
                          <input
                            type="checkbox"
                            {...register('recurring.weekdays')}
                            value={day.value}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">{day.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <Controller
                    control={control}
                    name="recurring.endDate"
                    render={({ field }) => (
                      <DatePicker
                        selected={field.value}
                        onChange={field.onChange}
                        minDate={watch('startTime')}
                        dateFormat="MMMM d, yyyy"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                      />
                    )}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Creating...' : 'Create Session'}
          </button>
        </div>
      </form>
    </div>
  );
}
