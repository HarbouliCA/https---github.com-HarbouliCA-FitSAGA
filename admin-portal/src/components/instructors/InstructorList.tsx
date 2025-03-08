'use client';

import { Instructor } from '@/types';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { UserCircleIcon } from '@heroicons/react/24/outline';

interface InstructorListProps {
  instructors: Instructor[];
  onToggleAccess?: (instructor: Instructor, newStatus: 'green' | 'red') => void;
}

export function InstructorList({ instructors, onToggleAccess }: InstructorListProps) {
  const router = useRouter();

  const handleRowClick = (instructorId: string) => {
    router.push(`/dashboard/instructors/${instructorId}`);
  };

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="min-w-full divide-y divide-gray-200">
        <div className="bg-gray-50">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="col-span-3">Name</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Phone</div>
            <div className="col-span-2">Working Since</div>
            <div className="col-span-2">Status</div>
          </div>
        </div>
        <div className="bg-white divide-y divide-gray-200">
          {instructors.map((instructor) => (
            <div
              key={instructor.uid}
              onClick={() => handleRowClick(instructor.uid)}
              className="grid grid-cols-12 gap-4 px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors duration-150 group"
            >
              <div className="col-span-3 flex items-center">
                <div className="flex-shrink-0 h-10 w-10 relative">
                  {instructor.photoURL ? (
                    <Image
                      src={instructor.photoURL}
                      alt={instructor.fullName}
                      fill
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserCircleIcon className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-900 group-hover:text-primary-600">
                    {instructor.fullName}
                  </div>
                </div>
              </div>
              <div className="col-span-3 flex items-center">
                <div className="text-sm text-gray-900">{instructor.email}</div>
              </div>
              <div className="col-span-2 flex items-center">
                <div className="text-sm text-gray-900">{instructor.telephone}</div>
              </div>
              <div className="col-span-2 flex items-center">
                <div className="text-sm text-gray-900">
                  {instructor.workingSince?.toLocaleDateString()}
                </div>
              </div>
              <div className="col-span-2 flex items-center space-x-2">
                <div
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    instructor.accessStatus === 'green'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleAccess?.(
                      instructor,
                      instructor.accessStatus === 'green' ? 'red' : 'green'
                    );
                  }}
                >
                  {instructor.accessStatus === 'green' ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
