'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, Firestore, DocumentReference } from 'firebase/firestore';
import { useFirebase } from '@/contexts/FirebaseContext';
import { Activity } from '@/types/activity';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { PageNavigation } from '@/components/layout/PageNavigation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface FormData {
  activityId: string;
  activityName: string;
  startTime: Date;
  endTime: Date;
  capacity: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  isRecurring: boolean;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    repeatEvery: number;
    weekdays?: string[];
    endDate: Date;
  };
}

interface SessionData {
  activityId: string;
  activityName: string;
  startTime: Date;
  endTime: Date;
  capacity: number;
  enrolledCount: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  recurring: {
    frequency: 'daily' | 'weekly' | 'monthly';
    repeatEvery: number;
    weekdays?: string[];
    endDate: Date;
    parentSessionId?: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

const weekdays = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
] as const;

export default function CreateSessionPage() {
  const router = useRouter();
  const { firestore } = useFirebase();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      isRecurring: false,
      capacity: 10,
      status: 'scheduled',
      startTime: new Date(),
      endTime: new Date(new Date().setHours(new Date().getHours() + 1)),
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
            difficulty: data.difficulty || 'beginner',
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
      setValue('capacity', activity.capacity);

      // Update end time based on activity duration
      const startTime = watch('startTime');
      if (startTime && activity.duration) {
        const endTime = new Date(startTime.getTime());
        endTime.setMinutes(endTime.getMinutes() + activity.duration);
        setValue('endTime', endTime);
      }
    }
  };

  function generateSessionDates(data: FormData): Date[] {
    if (!data.recurring) return [];

    const dates: Date[] = [];
    const startDate = new Date(data.startTime);
    const endDate = new Date(data.recurring.endDate);
    const repeatEvery = data.recurring.repeatEvery;

    // Get the day of week for the start date (0-6, where 0 is Sunday)
    const startDay = startDate.getDay();

    // Map weekday names to numbers
    const weekdayMap: { [key: string]: number } = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    };

    // Convert selected weekdays to numbers
    const selectedDays = data.recurring.weekdays?.map(day => weekdayMap[day]) || [];

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      if (data.recurring.frequency === 'daily') {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + repeatEvery);
      } else if (data.recurring.frequency === 'weekly' && selectedDays.length > 0) {
        // For weekly frequency, check if the current day is selected
        if (selectedDays.includes(currentDate.getDay())) {
          dates.push(new Date(currentDate));
        }
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (data.recurring.frequency === 'monthly') {
        dates.push(new Date(currentDate));
        currentDate.setMonth(currentDate.getMonth() + repeatEvery);
      }
    }

    return dates;
  }

  const onSubmit = async (data: FormData) => {
    if (!firestore || !selectedActivity) return;

    setSaving(true);
    setError(null);

    try {
      if (data.isRecurring && data.recurring) {
        const sessionDates = generateSessionDates(data);
        let parentSessionId: string | null = null;

        for (const [index, date] of sessionDates.entries()) {
          const startTime = new Date(date);
          startTime.setHours(data.startTime.getHours(), data.startTime.getMinutes(), 0);

          const endTime = new Date(date);
          endTime.setHours(data.endTime.getHours(), data.endTime.getMinutes(), 0);

          const recurring: NonNullable<SessionData['recurring']> = {
            frequency: data.recurring.frequency,
            repeatEvery: Number(data.recurring.repeatEvery),
            endDate: data.recurring.endDate,
            ...(data.recurring.frequency === 'weekly' && data.recurring.weekdays?.length && {
              weekdays: data.recurring.weekdays
            }),
            ...(parentSessionId && index > 0 && {
              parentSessionId
            })
          };

          const sessionData: SessionData = {
            activityId: data.activityId,
            activityName: selectedActivity.name,
            startTime,
            endTime,
            capacity: Number(data.capacity),
            enrolledCount: 0,
            status: data.status,
            recurring: data.isRecurring ? recurring : null,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          const docRef: DocumentReference = await addDoc(collection(firestore as Firestore, 'sessions'), sessionData);
          if (index === 0) {
            parentSessionId = docRef.id;
          }
        }
      } else {
        const sessionData: SessionData = {
          activityId: data.activityId,
          activityName: selectedActivity.name,
          startTime: data.startTime,
          endTime: data.endTime,
          capacity: Number(data.capacity),
          enrolledCount: 0,
          status: data.status,
          recurring: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await addDoc(collection(firestore as Firestore, 'sessions'), sessionData);
      }

      router.push('/dashboard/sessions');
    } catch (error) {
      console.error('Error creating session:', error);
      setError('Failed to create session');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageNavigation 
          title="Create Session"
          backUrl="/dashboard/sessions"
        />
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 p-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageNavigation 
        title="Create Session"
        backUrl="/dashboard/sessions"
      />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="activityId" className="block text-sm font-medium text-gray-700">Activity</label>
              <select
                id="activityId"
                {...register('activityId', { required: true })}
                onChange={handleActivityChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="">Select an activity</option>
                {activities.map((activity) => (
                  <option key={activity.id} value={activity.id}>
                    {activity.name}
                  </option>
                ))}
              </select>
              {errors.activityId && (
                <p className="mt-1 text-sm text-red-600">Please select an activity</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">Start Time</label>
                <Controller
                  control={control}
                  name="startTime"
                  render={({ field }) => (
                    <DatePicker
                      selected={field.value}
                      onChange={(date) => {
                        field.onChange(date);
                        if (selectedActivity && date) {
                          const endTime = new Date(date.getTime());
                          endTime.setMinutes(endTime.getMinutes() + selectedActivity.duration);
                          setValue('endTime', endTime);
                        }
                      }}
                      showTimeSelect
                      dateFormat="MMMM d, yyyy h:mm aa"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  )}
                />
              </div>

              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">End Time</label>
                <Controller
                  control={control}
                  name="endTime"
                  render={({ field }) => (
                    <DatePicker
                      selected={field.value}
                      onChange={field.onChange}
                      showTimeSelect
                      dateFormat="MMMM d, yyyy h:mm aa"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                  )}
                />
              </div>
            </div>

            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">Capacity</label>
              <input
                type="number"
                {...register('capacity', { required: true, min: 1 })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
              {errors.capacity && (
                <p className="mt-1 text-sm text-red-600">Please enter a valid capacity</p>
              )}
            </div>

            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('isRecurring')}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="isRecurring" className="ml-2 block text-sm font-medium text-gray-700">
                  Recurring Session
                </label>
              </div>
            </div>

            {isRecurring && (
              <div className="space-y-4 border-t border-gray-200 pt-4">
                <div>
                  <label htmlFor="recurring.frequency" className="block text-sm font-medium text-gray-700">Frequency</label>
                  <select
                    {...register('recurring.frequency')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="recurring.repeatEvery" className="block text-sm font-medium text-gray-700">
                    Repeat Every
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="number"
                      {...register('recurring.repeatEvery', { min: 1 })}
                      className="block w-full rounded-none rounded-l-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    />
                    <span className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
                      {frequency === 'daily' ? 'days' : frequency === 'weekly' ? 'weeks' : 'months'}
                    </span>
                  </div>
                </div>

                {frequency === 'weekly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Repeat On</label>
                    <div className="mt-2 space-y-2">
                      {weekdays.map((day) => (
                        <div key={day.value} className="flex items-center">
                          <input
                            type="checkbox"
                            value={day.value}
                            {...register('recurring.weekdays')}
                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <label className="ml-2 text-sm text-gray-700">{day.label}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="recurring.endDate" className="block text-sm font-medium text-gray-700">End Date</label>
                  <Controller
                    control={control}
                    name="recurring.endDate"
                    render={({ field }) => (
                      <DatePicker
                        selected={field.value}
                        onChange={field.onChange}
                        minDate={new Date()}
                        dateFormat="MMMM d, yyyy"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                    )}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                'Create Session'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
