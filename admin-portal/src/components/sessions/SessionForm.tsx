import { useState } from 'react';
import { Activity } from '@/types';
import { validateSessionData } from '@/utils/validation';

interface SessionFormData {
  activityId: string;
  instructorId: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  recurrence: {
    type: 'none' | 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: string;
  };
  maxCapacity: number;
  notes: string;
  description: string;
  link?: string;
}

interface SessionFormProps {
  activities: Activity[];
  instructors: Array<{ id: string; name: string }>;
  onSubmit: (data: SessionFormData) => Promise<void>;
}

export default function SessionForm({ activities, instructors, onSubmit }: SessionFormProps) {
  const [formData, setFormData] = useState<SessionFormData>({
    activityId: '',
    instructorId: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    recurrence: {
      type: 'none',
      interval: 1
    },
    maxCapacity: 1,
    notes: '',
    description: '',
    link: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const validationError = validateSessionData(formData);
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Activité *
          </label>
          <select
            name="activityId"
            value={formData.activityId}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">Sélectionner une activité</option>
            {activities.map(activity => (
              <option key={activity.id} value={activity.id}>
                {activity.name}
              </option>
            ))}
          </select>
        </div>

        {/* Autres champs du formulaire... */}
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => window.history.back()}
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Création...' : 'Créer la session'}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}
    </form>
  );
}