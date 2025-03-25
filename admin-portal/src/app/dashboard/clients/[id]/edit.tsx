import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Client } from '@/interfaces/client';

export default function EditClientPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    async function fetchClient() {
      try {
        const response = await fetch(`/api/clients/${id}`);
        const data: Client = await response.json();
        setClient(data);
      } catch (error) {
        console.error("Error fetching client data:", error);
      }
    }
    if (id) {
      fetchClient();
    }
  }, [id]);

  const handleSave = async () => {
    try {
      await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(client),
      });
      router.push(`/dashboard/clients/${id}`);
    } catch (error) {
      console.error("Error saving client data:", error);
    }
  };

  if (!client) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Edit Client</h2>
      <div className="space-y-4">
        {/* Health Goals */}
        <div>
          <label className="block text-gray-700">Health Goals</label>
          <input
            type="text"
            value={client.healthGoals?.join(', ') || ''}
            onChange={(e) => setClient({ ...client, healthGoals: e.target.value.split(',').map(goal => goal.trim()) })}
            className="mt-1 block w-full border-gray-300 rounded-md"
          />
        </div>

        {/* Dietary Restrictions */}
        <div>
          <label className="block text-gray-700">Dietary Restrictions</label>
          <input
            type="text"
            value={client.dietaryRestrictions || ''}
            onChange={(e) => setClient({ ...client, dietaryRestrictions: e.target.value })}
            className="mt-1 block w-full border-gray-300 rounded-md"
          />
        </div>

        <button onClick={handleSave} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
          Save
        </button>
      </div>
    </div>
  );
} 