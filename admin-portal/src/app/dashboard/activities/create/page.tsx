'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addDoc, collection, Firestore } from 'firebase/firestore';
import { useFirebase } from '@/contexts/FirebaseContext';
import { Activity, ActivityFormData, ActivityType } from '@/types/activity';
import { PageNavigation } from '@/components/layout/PageNavigation';

export default function CreateActivityPage() {
  const router = useRouter();
  const { firestore } = useFirebase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ActivityFormData>({
    name: '',
    description: '',
    type: 'ENTREMIENTO_PERSONAL',
    duration: 60,
    capacity: 10,
    difficulty: 'beginner',
    creditValue: 1
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;

    setLoading(true);
    setError(null);

    try {
      const now = new Date();
      const activityData: Omit<Activity, 'id'> = {
        ...formData,
        createdAt: now,
        updatedAt: now
      };

      await addDoc(collection(firestore as Firestore, 'activities'), activityData);
      router.push('/dashboard/activities');
    } catch (error) {
      console.error('Error creating activity:', error);
      setError('Failed to create activity');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' || name === 'capacity' || name === 'creditValue' ? Number(value) : value
    }));
  };

  return (
    <div className="space-y-6">
      <PageNavigation 
        title="Create Activity"
        backUrl="/dashboard/activities"
      />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="ENTREMIENTO_PERSONAL">Personal Training</option>
                <option value="KICK_BOXING">Kick Boxing</option>
                <option value="SALE_FITNESS">Fitness Room</option>
                <option value="CLASES_DERIGIDAS">Group Classes</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  min="1"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">Capacity</label>
                <input
                  type="number"
                  id="capacity"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  min="1"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="creditValue" className="block text-sm font-medium text-gray-700">Credit Value</label>
                <input
                  type="number"
                  id="creditValue"
                  name="creditValue"
                  value={formData.creditValue}
                  onChange={handleChange}
                  min="1"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">Difficulty</label>
              <select
                id="difficulty"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                'Create Activity'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
