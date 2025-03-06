'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, collection, getDocs, Firestore } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Session, Activity } from '@/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditSessionPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [activityId, setActivityId] = useState('');
  const [activityName, setActivityName] = useState('');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [capacity, setCapacity] = useState(1);

  useEffect(() => {
    if (typeof window === 'undefined' || !firestore) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch activities
        const activitiesSnapshot = await getDocs(collection(firestore as Firestore, 'activities'));
        const activitiesData = activitiesSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        } as Activity));
        setActivities(activitiesData);

        // Fetch session
        const sessionDoc = await getDoc(doc(firestore as Firestore, 'sessions', params.id));
        
        if (!sessionDoc.exists()) {
          setError('Session not found');
          return;
        }

        const data = sessionDoc.data();
        // Ensure all date fields are properly converted
        const startTimeDate = data.startTime?.toDate?.() || new Date(data.startTime);
        const endTimeDate = data.endTime?.toDate?.() || new Date(data.endTime);

        setStartTime(formatDateTimeForInput(startTimeDate));
        setEndTime(formatDateTimeForInput(endTimeDate));
        setActivityId(data.activityId || '');
        setActivityName(data.activityName || '');
        setTitle(data.title || '');
        setDescription(data.description || '');
        setNotes(data.notes || '');
        setCapacity(data.capacity || 1);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load session details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const formatDateTimeForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleActivityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedActivity = activities.find(a => a.id === e.target.value);
    if (selectedActivity) {
      setActivityId(selectedActivity.id);
      setActivityName(selectedActivity.name);
    } else {
      setActivityId('');
      setActivityName('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (!startTime) {
        throw new Error('Start time is required');
      }

      if (!endTime) {
        throw new Error('End time is required');
      }

      if (!activityId) {
        throw new Error('Activity is required');
      }

      if (!title.trim()) {
        throw new Error('Title is required');
      }

      if (capacity < 1) {
        throw new Error('Capacity must be at least 1');
      }

      const sessionData = {
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        activityId,
        activityName,
        title: title.trim(),
        description: description.trim() || null,
        notes: notes.trim() || null,
        capacity: capacity,
        updatedAt: new Date()
      };

      // Clean undefined values
      const cleanedData = Object.entries(sessionData).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      await updateDoc(doc(firestore as Firestore, 'sessions', params.id), cleanedData);
      router.push(`/sessions/${params.id}`);
    } catch (error) {
      console.error('Error updating session:', error);
      setError(error instanceof Error ? error.message : 'Failed to update session');
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

  if (error && !saving) {
    return (
      <div className="error-message">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
            <div className="mt-4">
              <Link href="/sessions" className="text-red-700 underline hover:text-red-600">
                Return to Sessions
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link href={`/sessions/${params.id}`} className="text-gray-500 hover:text-gray-700">
            ← Back to Session
          </Link>
          <h1 className="page-title">Edit Session</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {error && saving && (
          <div className="error-message">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="title" className="form-label">
            Session Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-input"
            required
          />
        </div>

        <div>
          <label htmlFor="activityId" className="form-label">
            Activity *
          </label>
          <select
            id="activityId"
            value={activityId}
            onChange={handleActivityChange}
            className="form-input"
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startTime" className="form-label">
              Start Time *
            </label>
            <input
              type="datetime-local"
              id="startTime"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div>
            <label htmlFor="endTime" className="form-label">
              End Time *
            </label>
            <input
              type="datetime-local"
              id="endTime"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="form-input"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="capacity" className="form-label">
            Capacity *
          </label>
          <input
            type="number"
            id="capacity"
            value={capacity}
            onChange={(e) => setCapacity(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
            className="form-input"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="form-label">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="form-input"
          />
        </div>

        <div>
          <label htmlFor="notes" className="form-label">
            Notes
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="form-input"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <Link
            href={`/sessions/${params.id}`}
            className="btn-secondary"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className={`btn-primary ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
