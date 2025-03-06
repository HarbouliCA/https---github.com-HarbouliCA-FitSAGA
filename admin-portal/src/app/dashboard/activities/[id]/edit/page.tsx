'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, Firestore } from 'firebase/firestore';
import { useFirebase } from '@/contexts/FirebaseContext';
import { Activity, ActivityFormData } from '@/types/activity';
import { PageNavigation } from '@/components/layout/PageNavigation';

export default function EditActivityPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const { firestore } = useFirebase();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    const fetchActivity = async () => {
      if (!firestore) return;

      try {
        const docRef = doc(firestore as Firestore, 'activities', params.id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            name: data.name || '',
            description: data.description || '',
            type: data.type || 'ENTREMIENTO_PERSONAL',
            duration: Number(data.duration) || 60,
            capacity: Number(data.capacity) || 10,
            difficulty: data.difficulty || 'beginner',
            creditValue: Number(data.creditValue) || 1
          });
        } else {
          setError('Activity not found');
        }
      } catch (error) {
        console.error('Error fetching activity:', error);
        setError('Failed to load activity');
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [firestore, params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;

    setSaving(true);
    setError(null);

    try {
      const docRef = doc(firestore as Firestore, 'activities', params.id);
      const now = new Date();
      
      await updateDoc(docRef, {
        ...formData,
        updatedAt: now
      });

      router.push(`/dashboard/activities/${params.id}`);
    } catch (error) {
      console.error('Error updating activity:', error);
      setError('Failed to update activity');
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' || name === 'capacity' || name === 'creditValue' ? Number(value) : value
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageNavigation 
          title="Edit Activity"
          backUrl={`/dashboard/activities/${params.id}`}
        />
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 p-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageNavigation 
          title="Edit Activity"
          backUrl={`/dashboard/activities/${params.id}`}
        />
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageNavigation 
        title={`Edit ${formData.name}`}
        backUrl={`/dashboard/activities/${params.id}`}
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
              disabled={saving}
              className="btn-primary flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
