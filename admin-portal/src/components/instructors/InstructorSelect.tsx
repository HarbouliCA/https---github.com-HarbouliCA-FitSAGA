'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, Firestore } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Instructor } from '@/types';
import Image from 'next/image';
import { UserCircleIcon } from '@heroicons/react/24/outline';

interface InstructorSelectProps {
  value?: string;
  onChange: (instructorId: string, instructorName: string) => void;
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

export function InstructorSelect({
  value,
  onChange,
  disabled = false,
  className = '',
  required = false
}: InstructorSelectProps) {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchInstructors = async () => {
      if (!firestore) return;

      try {
        const instructorsQuery = query(
          collection(firestore as Firestore, 'instructors'),
          where('accessStatus', '==', 'green') // Only fetch active instructors
        );
        
        const querySnapshot = await getDocs(instructorsQuery);
        const fetchedInstructors = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            uid: doc.id,
            fullName: data.fullName || '',
            email: data.email || '',
            photoURL: data.photoURL || '',
            accessStatus: data.accessStatus || 'red',
            dateOfBirth: data.dateOfBirth?.toDate(),
            workingSince: data.workingSince?.toDate(),
            telephone: data.telephone || '',
            address: data.address || '',
            bankDetails: data.bankDetails || {},
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            lastActive: data.lastActive?.toDate()
          } as Instructor;
        });

        // Sort instructors by name
        fetchedInstructors.sort((a, b) => a.fullName.localeCompare(b.fullName));
        setInstructors(fetchedInstructors);
      } catch (err) {
        console.error('Error fetching instructors:', err);
        setError('Failed to load instructors');
      } finally {
        setLoading(false);
      }
    };

    fetchInstructors();
  }, []);

  const filteredInstructors = searchTerm
    ? instructors.filter(instructor =>
        instructor.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instructor.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : instructors;

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        <input
          type="text"
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Search instructors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={disabled}
        />
      </div>
      <select
        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
        value={value || ''}
        onChange={(e) => {
          const instructor = instructors.find(i => i.uid === e.target.value);
          if (instructor) {
            onChange(instructor.uid, instructor.fullName);
          }
        }}
        disabled={disabled}
        required={required}
      >
        <option value="">Select an instructor</option>
        {filteredInstructors.map((instructor) => (
          <option key={instructor.uid} value={instructor.uid}>
            {instructor.fullName}
          </option>
        ))}
      </select>
      
      {/* Preview of selected instructor */}
      {value && (
        <div className="mt-2">
          {instructors.map((instructor) => 
            instructor.uid === value ? (
              <div key={instructor.uid} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                {instructor.photoURL ? (
                  <Image
                    src={instructor.photoURL}
                    alt={instructor.fullName}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <UserCircleIcon className="h-8 w-8 text-gray-400" />
                )}
                <div>
                  <div className="font-medium">{instructor.fullName}</div>
                  <div className="text-sm text-gray-500">{instructor.email}</div>
                </div>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
