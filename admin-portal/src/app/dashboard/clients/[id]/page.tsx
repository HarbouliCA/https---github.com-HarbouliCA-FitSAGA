"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import CreditsAdjustmentModal from "@/components/clients/CreditsAdjustmentModal";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

interface EmergencyContact {
  name?: string;
  phone?: string;
  relationship?: string;
}

interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
}

interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
}

interface Client {
  id: string;
  name: string;
  accessStatus?: string;
  address?: string;
  createdAt?: string;
  credits?: number; // if available from client record
  gymCredits: number | "unlimited";
  dateOfBirth?: string;
  dietaryRestrictions?: string;
  email?: string;
  emergencyContact?: EmergencyContact;
  fidelityScore?: number;
  fitnessGoals?: string[];
  gender?: string;
  healthGoals?: string[];
  height?: number | null;
  lastActive?: string;
  memberSince?: string;
  notificationPreferences?: NotificationPreferences;
  notificationSettings?: NotificationSettings;
  observations?: string | null;
  onboardingCompleted?: boolean;
  profileImage?: string | null;
  recentBookings?: any[];
  role?: string;
  subscriptionExpiry?: string;
  subscriptionPlan: string; // plan id stored in client record
  telephone?: string;
  updatedAt?: string;
  weight?: number | null;
  intervalCredits: number;
  accountNumber?: string;
  bicCode?: string;
  accountHolder?: string;
  bankName?: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  credits: number;
  intervalCredits: number;
  unlimited: boolean;
}

export default function ClientDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [planData, setPlanData] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [planLoading, setPlanLoading] = useState(true);
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    async function fetchClient() {
      try {
        console.log('Fetching client data for ID:', id);
        const response = await fetch(`/api/clients/${id}?t=${Date.now()}`, { cache: "no-store" });
        const data: Client = await response.json();
        console.log('Fetched client data:', data); // Log the entire client data
        console.log('Bank details:', {
          accountNumber: data.accountNumber,
          bicCode: data.bicCode,
          accountHolder: data.accountHolder,
          bankName: data.bankName
        });
        setClient(data);
      } catch (error) {
        console.error("Error fetching client data:", error);
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      fetchClient();
    }
  }, [id, refreshTrigger]);

  useEffect(() => {
    async function fetchSubscriptionPlan() {
      if (client) {
        try {
          const planId = client.subscriptionPlan;
          if (planId) {
            const response = await fetch(`/api/subscription-plans/${planId}`);
            const data = await response.json();
            setPlanData(data);
            setPlanLoading(false);
          }
        } catch (error) {
          console.error("Error fetching subscription plan:", error);
          setPlanLoading(false);
        }
      }
    }
    
    if (client) {
      fetchSubscriptionPlan();
    }
  }, [client]);

  if (loading) {
    return <div className="p-6 text-center">Loading client data...</div>;
  }

  if (!client) {
    return <div className="p-6 text-center">No client found.</div>;
  }

  // Use the fetched subscription plan data; if not available, fallback to default values.
  const plan = {
    name: planData?.name || 'No Plan',
    credits: planData?.credits || 0,
    intervalCredits: planData?.intervalCredits || 0
  };

  // Calculate gym access credits
  const gymAccessCredits = client.gymCredits === "unlimited" 
    ? "Unlimited" 
    : client.gymCredits;

  // Ensure the correct interval credits are displayed
  const intervalSessionCreditsFromClient = client?.intervalCredits || 0;

  // Calculate computed total credits using the updated client record values:
  const computedTotalCredits = client.gymCredits === "unlimited" 
    ? "Unlimited" 
    : Number(client.gymCredits) + intervalSessionCreditsFromClient;

  // Log the health goals outside of the JSX
  console.log('Health Goals:', client.healthGoals);

  return (
    <div>
      {/* Header with navigation and edit button */}
      <div className="flex justify-between items-center p-6 bg-gray-50">
        <Link 
          href="/dashboard/clients" 
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Clients
        </Link>
        
        <Link 
          href={`/dashboard/clients/${id}/edit`}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </Link>
      </div>

      <div className="space-y-6 p-6">
        {/* General Information Card */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Datos generales</h2>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 items-center bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-600">Núm. de miembro del club</span>
              <span>{client.id}</span>
            </div>
            
            <div className="grid grid-cols-2 items-center p-3">
              <span className="text-gray-600">Nombre</span>
              <span>{client.name}</span>
            </div>

            <div className="grid grid-cols-2 items-center bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-600">Apellido</span>
              <span>{client.accessStatus || "N/A"}</span>
            </div>

            <div className="grid grid-cols-2 items-center p-3">
              <span className="text-gray-600">Email</span>
              <span>{client.email || "N/A"}</span>
            </div>

            <div className="grid grid-cols-2 items-center bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-600">Teléfono</span>
              <span>{client.telephone || "N/A"}</span>
            </div>

            <div className="grid grid-cols-2 items-center p-3">
              <span className="text-gray-600">Estado</span>
              <span className="text-green-600">{client.accessStatus || "N/A"}</span>
            </div>

            <div className="grid grid-cols-2 items-center bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-600">Cliente desde</span>
              <span>{client.memberSince || "N/A"}</span>
            </div>
          </div>
        </Card>

        {/* Subscription Plan Card */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Plan de Suscripción</h2>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 items-center bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-600">Plan Actual</span>
              <span>{planData?.name || 'Loading...'}</span>
            </div>
            
            <div className="grid grid-cols-2 items-center p-3">
              <span className="text-gray-600">Fecha de Inicio</span>
              <span>{client.createdAt || "N/A"}</span>
            </div>

            <div className="grid grid-cols-2 items-center bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-600">Fecha de Renovación</span>
              <span>{client.subscriptionExpiry || "N/A"}</span>
            </div>
          </div>
        </Card>

        {/* Credit Details Card */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Credit Details</h2>
            <button
              onClick={() => setIsCreditsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
            >
              <span>Adjust Credits</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 items-center bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-600">Gym Access Credits</span>
              <span className="font-semibold">{gymAccessCredits}</span>
            </div>
            
            <div className="grid grid-cols-2 items-center p-3">
              <span className="text-gray-600">Interval Session Credits</span>
              <span className="font-semibold">{intervalSessionCreditsFromClient}</span>
            </div>

            <div className="grid grid-cols-2 items-center bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-600">Total Available Credits</span>
              <span className="font-semibold text-lg">{computedTotalCredits}</span>
            </div>

            <div className="grid grid-cols-2 items-center p-3">
              <span className="text-gray-600">Last Updated</span>
              <span>{client.updatedAt || "N/A"}</span>
            </div>
          </div>
        </Card>

        {/* Health & Fitness Card */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Health & Fitness</h2>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 items-center bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-600">Health Goals</span>
              <span>
                {client.healthGoals && typeof client.healthGoals === 'string'
                  ? client.healthGoals
                  : 'N/A'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 items-center p-3">
              <span className="text-gray-600">Dietary Restrictions</span>
              <span>{client.dietaryRestrictions || 'N/A'}</span>
            </div>
          </div>
        </Card>

        {/* Bank Details Section */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Detalles bancarios</h2>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 items-center bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-600">Número de cuenta</span>
              <span>{client.accountNumber || 'N/A'}</span>
            </div>
            
            <div className="grid grid-cols-2 items-center p-3">
              <span className="text-gray-600">Código BIC</span>
              <span>{client.bicCode || 'N/A'}</span>
            </div>

            <div className="grid grid-cols-2 items-center bg-gray-50 p-3 rounded-lg">
              <span className="text-gray-600">Titular de la cuenta</span>
              <span>{client.accountHolder || 'N/A'}</span>
            </div>

            <div className="grid grid-cols-2 items-center p-3">
              <span className="text-gray-600">Nombre del banco</span>
              <span>{client.bankName || 'N/A'}</span>
            </div>
          </div>
        </Card>

        <CreditsAdjustmentModal
          isOpen={isCreditsModalOpen}
          onClose={() => setIsCreditsModalOpen(false)}
          clientId={client.id}
          clientName={client.name}
          subscriptionTier={plan.name}
          currentGymCredits={client.gymCredits}
          currentIntervalCredits={client.intervalCredits}
          onCreditsUpdated={() => setRefreshTrigger(prev => prev + 1)}
        />
      </div>
    </div>
  );
}
