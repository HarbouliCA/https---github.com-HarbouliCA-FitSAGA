"use client";

import { useState, useEffect } from 'react';
import { SubscriptionPlan } from '@/types/subscriptionPlan';
import { toast } from 'react-hot-toast';
import AdminLayout from '@/components/layout/AdminLayout';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('/api/subscription-plans');
        if (response.ok) {
          const data = await response.json();
          setPlans(data);
        } else {
          toast.error('Failed to load subscription plans');
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
        toast.error('An error occurred while loading plans');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleDeletePlan = async (id: string) => {
    if (confirm('Are you sure you want to delete this plan?')) {
      try {
        const response = await fetch(`/api/subscription-plans/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setPlans(plans.filter(plan => plan.id !== id));
          toast.success('Plan deleted successfully');
        } else {
          toast.error('Failed to delete plan');
        }
      } catch (error) {
        console.error('Error deleting plan:', error);
        toast.error('An error occurred while deleting the plan');
      }
    }
  };

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center mb-6">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Subscription Plans</h1>
            <p className="mt-2 text-sm text-gray-700">
              Manage gym subscription plans, pricing, and features.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link href="/dashboard/subscription-plans/new" className="...">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
              >
                <PlusIcon className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" />
                Add Plan
              </button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <div className="spinner"></div>
            <p className="mt-2 text-gray-500">Loading plans...</p>
          </div>
        ) : (
          <div className="mt-8 flex flex-col">
            <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                          Name
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Type
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Price
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Credits
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Interval Credits
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
  Regular Credits
</th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {plans.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-gray-500">
                            No subscription plans found. Add your first plan.
                          </td>
                        </tr>
                      ) : (
                        plans.map((plan) => (
                          <tr key={plan.id}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                              {plan.name}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {plan.type === 'family' ? `Family (${plan.familySize || 2}+)` : 'Individual'}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {plan.price} {plan.currency || '€'}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {plan.unlimited ? 'Unlimited' : plan.credits}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {plan.intervalCredits || 0}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
  {plan.unlimited ? 'Unlimited' : (plan.credits - (plan.intervalCredits || 0))}
</td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <Link href={`/dashboard/subscription-plans/edit?id=${plan.id}`} passHref>
                                <button
                                  type="button"
                                  className="text-blue-600 hover:text-blue-900 mr-4"
                                >
                                  <PencilIcon className="h-5 w-5" aria-hidden="true" />
                                  <span className="sr-only">Edit</span>
                                </button>
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleDeletePlan(plan.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <TrashIcon className="h-5 w-5" aria-hidden="true" />
                                <span className="sr-only">Delete</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}