'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Instructor } from '@/types';
import { 
  PencilSquareIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface InstructorListProps {
  instructors: Instructor[];
  onToggleAccess?: (instructor: Instructor, newStatus: 'green' | 'red') => Promise<void>;
}

export function InstructorList({ instructors, onToggleAccess }: InstructorListProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleToggleAccess = async (instructor: Instructor, newStatus: 'green' | 'red') => {
    if (!onToggleAccess) return;
    
    try {
      setLoading(instructor.uid);
      await onToggleAccess(instructor, newStatus);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Working Since</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {instructors.map((instructor) => (
              <tr key={instructor.uid} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {instructor.photoURL ? (
                      <img
                        src={instructor.photoURL}
                        alt={instructor.fullName}
                        className="h-8 w-8 rounded-full mr-3"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">
                          {instructor.fullName.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="text-sm font-medium text-gray-900">
                      {instructor.fullName}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {instructor.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {instructor.telephone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {instructor.workingSince.toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    instructor.accessStatus === 'green'
                      ? 'bg-green-100 text-green-800'
                      : instructor.accessStatus === 'red'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {instructor.accessStatus === 'green' ? 'Active' : instructor.accessStatus === 'red' ? 'Inactive' : 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  {onToggleAccess && (
                    <>
                      <button
                        onClick={() => handleToggleAccess(instructor, 'green')}
                        disabled={loading === instructor.uid || instructor.accessStatus === 'green'}
                        className={`text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed ${
                          loading === instructor.uid ? 'animate-pulse' : ''
                        }`}
                      >
                        <CheckCircleIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleToggleAccess(instructor, 'red')}
                        disabled={loading === instructor.uid || instructor.accessStatus === 'red'}
                        className={`text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed ${
                          loading === instructor.uid ? 'animate-pulse' : ''
                        }`}
                      >
                        <XCircleIcon className="h-5 w-5" />
                      </button>
                    </>
                  )}
                  <Link
                    href={`/dashboard/instructors/${instructor.uid}/edit`}
                    className="text-primary-600 hover:text-primary-900"
                  >
                    <PencilSquareIcon className="h-5 w-5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
