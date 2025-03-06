'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, Firestore } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Activity } from '@/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageUploader from '@/components/ui/ImageUploader';

const ACTIVITY_TYPES = {
  kingboxing: 'Kingboxing',
  yoga: 'Yoga',
  musculation: 'Musculation',
  free_access: 'Free Access',
  other: 'Other'
} as const;

type ActivityType = keyof typeof ACTIVITY_TYPES;

export default function EditActivityPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ActivityType>('other');
  const [creditValue, setCreditValue] = useState(0);
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined' || !firestore) return;

    const fetchActivity = async () => {
      setLoading(true);
      setError(null);
      try {
        const activityDoc = await getDoc(doc(firestore as Firestore, 'activities', params.id));
        
        if (!activityDoc.exists()) {
          setError('Activity not found');
          return;
        }

        const data = activityDoc.data() as Activity;
        setName(data.name);
        setDescription(data.description);
        setType(data.type as ActivityType);
        setCreditValue(data.creditValue);
        setImageUrl(data.imageUrl || '');
      } catch (error) {
        console.error('Error fetching activity:', error);
        setError('Failed to load activity details');
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (!name.trim()) {
        throw new Error('Activity name is required');
      }

      if (!description.trim()) {
        throw new Error('Activity description is required');
      }

      if (creditValue < 0) {
        throw new Error('Credit value must be a positive number');
      }

      const activityData = {
        name: name.trim(),
        description: description.trim(),
        type: type || 'other',
        creditValue,
        imageUrl: imageUrl || null,
        updatedAt: new Date()
      };

      const cleanedData = Object.entries(activityData).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      await updateDoc(doc(firestore as Firestore, 'activities', params.id), cleanedData);
      router.push(`/activities/${params.id}`);
    } catch (error) {
      console.error('Error updating activity:', error);
      setError(error instanceof Error ? error.message : 'Failed to update activity');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUploaded = (url: string) => {
    setImageUrl(url);
  };

  const handleImageError = (error: string) => {
    setError(`Image upload error: ${error}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error && !saving) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
            <div className="mt-4">
              <Link href="/activities" className="text-red-700 underline hover:text-red-600">
                Return to Activities
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
          <Link href={`/activities/${params.id}`} className="text-gray-500 hover:text-gray-700">
            ← Back to Activity
          </Link>
          <h1 className="page-title">Edit Activity</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {error && saving && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Activity Name *
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description *
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            required
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
            Activity Type
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as ActivityType)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            {Object.entries(ACTIVITY_TYPES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="creditValue" className="block text-sm font-medium text-gray-700">
            Credit Value
          </label>
          <input
            type="number"
            id="creditValue"
            value={creditValue}
            onChange={(e) => setCreditValue(Math.max(0, parseInt(e.target.value) || 0))}
            min="0"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Activity Image
          </label>
          <ImageUploader
            folder="activities"
            onImageUploaded={handleImageUploaded}
            onError={handleImageError}
            currentImageUrl={imageUrl}
          />
        </div>

        <div className="flex justify-end space-x-3">
          <Link
            href={`/activities/${params.id}`}
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
