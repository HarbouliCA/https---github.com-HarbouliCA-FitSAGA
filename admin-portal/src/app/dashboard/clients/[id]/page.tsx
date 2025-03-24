"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import CreditsAdjustmentModal from "@/components/clients/CreditsAdjustmentModal";

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
  dateOfBirth?: string;
  dietaryRestrictions?: string;
  email?: string;
  emergencyContact?: EmergencyContact;
  fidelityScore?: number;
  fitnessGoals?: string[];
  gender?: string;
  healthGoals?: string;
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
  const [client, setClient] = useState<Client | null>(null);
  const [planData, setPlanData] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [planLoading, setPlanLoading] = useState(true);
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
  const [refreshData, setRefreshData] = useState(0);

  useEffect(() => {
    async function fetchClient() {
      try {
        const response = await fetch(`/api/clients/${id}`);
        const data: Client = await response.json();
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
  }, [id, refreshData]);

  useEffect(() => {
    async function fetchSubscriptionPlan() {
      if (client) {
        try {
          const response = await fetch(
            `/api/subscription-plans/${client.subscriptionPlan}`
          );
          const data: SubscriptionPlan = await response.json();
          setPlanData(data);
        } catch (error) {
          console.error("Error fetching subscription plan data:", error);
        } finally {
          setPlanLoading(false);
        }
      }
    }
    fetchSubscriptionPlan();
  }, [client]);

  if (loading) {
    return <div className="p-6 text-center">Loading client data...</div>;
  }

  if (!client) {
    return <div className="p-6 text-center">No client found.</div>;
  }

  // Use the fetched subscription plan data; if not available, fallback to default values.
  const plan = planData || {
    id: client.subscriptionPlan,
    name: client.subscriptionPlan, // fallback displays ID
    credits: client.credits || 0,
    intervalCredits: client.intervalCredits,
    unlimited: false,
  };

  // Determine credit details based on subscription plan using known IDs:
  let gymAccessCredits: number | "unlimited";
  let intervalSessionCredits: number;
  if (plan.id === "8rYWfrb4gglJTfDfVm74") {
    // Basic Plan: Gym Access Credits: 8, Interval Credits: 0
    gymAccessCredits = 8;
    intervalSessionCredits = 0;
  } else if (plan.id === "cUZ0NyHWzejBstSraraL") {
    // Gold Plan: Gym Access Credits: 8, Interval Credits: 4
    gymAccessCredits = 8;
    intervalSessionCredits = 4;
  } else if (plan.id === "T8RoIBbuhSx9YPxIhibB") {
    // Premium Plan: Gym Access Credits: unlimited, Interval Credits: 4
    gymAccessCredits = "unlimited";
    intervalSessionCredits = 4;
  } else {
    // Fallback: use plan data if available
    if (plan.unlimited) {
      gymAccessCredits = "unlimited";
    } else {
      gymAccessCredits = plan.credits - plan.intervalCredits;
    }
    intervalSessionCredits = plan.intervalCredits;
  }

  // Calculate Total Credits based on plan data:
  const totalCredits =
    plan.unlimited ? "Unlimited" : plan.credits;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Client Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold mb-4">Client Detail</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p>
              <span className="font-semibold">Name:</span> {client.name}
            </p>
            <p>
              <span className="font-semibold">Access Status:</span>{" "}
              {client.accessStatus || "N/A"}
            </p>
            <p>
              <span className="font-semibold">Address:</span>{" "}
              {client.address || "N/A"}
            </p>
            <p>
              <span className="font-semibold">Email:</span>{" "}
              {client.email || "N/A"}
            </p>
            <p>
              <span className="font-semibold">Date of Birth:</span>{" "}
              {client.dateOfBirth || "N/A"}
            </p>
            <p>
              <span className="font-semibold">Dietary Restrictions:</span>{" "}
              {client.dietaryRestrictions || "N/A"}
            </p>
            <p>
              <span className="font-semibold">Telephone:</span>{" "}
              {client.telephone || "N/A"}
            </p>
          </div>
          <div>
            <p>
              <span className="font-semibold">Subscription Plan:</span>{" "}
              {plan.name}
            </p>
            <p>
              <span className="font-semibold">Subscription Expiry:</span>{" "}
              {client.subscriptionExpiry || "N/A"}
            </p>
            <p>
              <span className="font-semibold">Created At:</span>{" "}
              {client.createdAt || "N/A"}
            </p>
            <p>
              <span className="font-semibold">Last Active:</span>{" "}
              {client.lastActive || "N/A"}
            </p>
            <p>
              <span className="font-semibold">Member Since:</span>{" "}
              {client.memberSince || "N/A"}
            </p>
            <p>
              <span className="font-semibold">Updated At:</span>{" "}
              {client.updatedAt || "N/A"}
            </p>
          </div>
        </div>
        {/* Additional details */}
        <div className="mt-4">
          <p>
            <span className="font-semibold">Fidelity Score:</span>{" "}
            {client.fidelityScore ?? "N/A"}
          </p>
          <p>
            <span className="font-semibold">Gender:</span>{" "}
            {client.gender || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Health Goals:</span>{" "}
            {client.healthGoals || "N/A"}
          </p>
          <p>
            <span className="font-semibold">Height:</span>{" "}
            {client.height != null ? client.height : "N/A"}
            <span className="font-semibold ml-4">Weight:</span>{" "}
            {client.weight != null ? client.weight : "N/A"}
          </p>
          <p>
            <span className="font-semibold">Emergency Contact:</span>{" "}
            {client.emergencyContact?.name || "N/A"}{" "}
            {client.emergencyContact?.phone ? `(${client.emergencyContact.phone})` : ""}
          </p>
          <p>
            <span className="font-semibold">Notification Preferences:</span>{" "}
            Email: {client.notificationPreferences?.email ? "Yes" : "No"}, Push: {client.notificationPreferences?.push ? "Yes" : "No"}, SMS: {client.notificationPreferences?.sms ? "Yes" : "No"}
          </p>
          <p>
            <span className="font-semibold">Notification Settings:</span>{" "}
            Email: {client.notificationSettings?.email ? "Yes" : "No"}, Push: {client.notificationSettings?.push ? "Yes" : "No"}, SMS: {client.notificationSettings?.sms ? "Yes" : "No"}
          </p>
          <p>
            <span className="font-semibold">Onboarding Completed:</span>{" "}
            {client.onboardingCompleted ? "Yes" : "No"}
          </p>
          <p>
            <span className="font-semibold">Observations:</span>{" "}
            {client.observations || "N/A"}
          </p>
        </div>
      </div>
      {/* Credit Details Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-4">Credit Details</h2>
        {planLoading ? (
          <div>Loading subscription plan data...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p>
                <span className="font-semibold">Gym Access Credits:</span>{" "}
                {gymAccessCredits === "unlimited" ? "Unlimited access" : gymAccessCredits}
              </p>
            </div>
            <div>
              <p>
                <span className="font-semibold">Interval Session Credits:</span>{" "}
                {intervalSessionCredits}
              </p>
            </div>
            <div>
              <p>
                <span className="font-semibold">Total Credits:</span>{" "}
                {plan.unlimited ? "Unlimited" : plan.credits}
              </p>
            </div>
          </div>
        )}
      </div>
      {/* Adjust Credits Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsCreditsModalOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded shadow"
        >
          Adjust Credits
        </button>
      </div>
      <CreditsAdjustmentModal
        isOpen={isCreditsModalOpen}
        onClose={() => setIsCreditsModalOpen(false)}
        clientId={client.id}
        clientName={client.name}
        subscriptionTier={plan.name}
        currentGymCredits={gymAccessCredits}
        currentIntervalCredits={intervalSessionCredits}
        onCreditsUpdated={() => setRefreshData((r) => r + 1)}
      />
    </div>
  );
}
