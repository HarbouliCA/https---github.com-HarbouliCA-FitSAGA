'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, Firestore } from 'firebase/firestore';
import { useFirebase } from '@/contexts/FirebaseContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { Staff } from '@/types';
import { PageNavigation } from '@/components/layout/PageNavigation';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function StaffListPage() {
  const router = useRouter();
  const { firestore } = useFirebase();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<Staff['role'] | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'ALL'>('ALL');

  const canManageStaff = hasPermission('manage_staff');

  useEffect(() => {
    const fetchStaff = async () => {
      if (!firestore) return;

      try {
        const querySnapshot = await getDocs(collection(firestore as Firestore, 'staff'));
        const staffData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          dateOfBirth: doc.data().dateOfBirth?.toDate(),
          employedSince: doc.data().employedSince?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        })) as Staff[];

        setStaff(staffData);
        setFilteredStaff(staffData);
      } catch (error) {
        console.error('Error fetching staff:', error);
        setError('Failed to load staff members');
      } finally {
        setLoading(false);
      }
    };

    if (!permissionsLoading) {
      fetchStaff();
    }
  }, [firestore, permissionsLoading]);

  useEffect(() => {
    let filtered = [...staff];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(member => 
        member.firstName.toLowerCase().includes(query) ||
        member.lastName.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query)
      );
    }

    // Apply role filter
    if (roleFilter !== 'ALL') {
      filtered = filtered.filter(member => member.role === roleFilter);
    }

    // Apply status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(member => member.status === statusFilter);
    }

    setFilteredStaff(filtered);
  }, [staff, searchQuery, roleFilter, statusFilter]);

  if (loading || permissionsLoading) {
    return (
      <div className="space-y-6">
        <PageNavigation 
          title="Staff"
          actions={canManageStaff ? [
            {
              label: 'Add Staff',
              href: '/dashboard/staff/create',
              icon: PlusIcon
            }
          ] : undefined}
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
          title="Staff"
          actions={canManageStaff ? [
            {
              label: 'Add Staff',
              href: '/dashboard/staff/create',
              icon: PlusIcon
            }
          ] : undefined}
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
        title="Staff"
        actions={canManageStaff ? [
          {
            label: 'Add Staff',
            href: '/dashboard/staff/create',
            icon: PlusIcon
          }
        ] : undefined}
      />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        {/* Search and Filters */}
        <div className="p-4 border-b border-gray-200 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="sm:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as Staff['role'] | 'ALL')}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="ALL">All Roles</option>
                <option value="DIRECTOR">Director</option>
                <option value="SECRETARY">Secretary</option>
                <option value="INSTRUCTOR">Instructor</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'active' | 'inactive' | 'ALL')}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="ALL">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Staff List */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff Member
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                {canManageStaff && (
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStaff.map((member) => (
                <tr 
                  key={member.id}
                  onClick={() => router.push(`/dashboard/staff/${member.id}`)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                        {member.firstName[0]}{member.lastName[0]}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {member.firstName} {member.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {member.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.role}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  {canManageStaff && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/staff/${member.id}/edit`);
                        }}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Edit
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredStaff.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">No staff members found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
