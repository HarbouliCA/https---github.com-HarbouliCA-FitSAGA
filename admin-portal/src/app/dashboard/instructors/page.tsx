'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, Firestore, limit, where, startAfter } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Instructor } from '@/types';
import Link from 'next/link';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const router = useRouter();

  const fetchInstructors = async (searchValue = '') => {
    if (!firestore) return;

    try {
      let instructorsQuery;
      
      if (searchValue) {
        instructorsQuery = query(
          collection(firestore as Firestore, 'instructors'),
          orderBy('fullName'),
          limit(10)
        );
      } else if (filter === 'active') {
        instructorsQuery = lastVisible
          ? query(
              collection(firestore as Firestore, 'instructors'),
              where('accessStatus', '==', 'green'),
              orderBy('fullName'),
              startAfter(lastVisible),
              limit(10)
            )
          : query(
              collection(firestore as Firestore, 'instructors'),
              where('accessStatus', '==', 'green'),
              orderBy('fullName'),
              limit(10)
            );
      } else if (filter === 'inactive') {
        instructorsQuery = lastVisible
          ? query(
              collection(firestore as Firestore, 'instructors'),
              where('accessStatus', '==', 'red'),
              orderBy('fullName'),
              startAfter(lastVisible),
              limit(10)
            )
          : query(
              collection(firestore as Firestore, 'instructors'),
              where('accessStatus', '==', 'red'),
              orderBy('fullName'),
              limit(10)
            );
      } else {
        instructorsQuery = lastVisible
          ? query(
              collection(firestore as Firestore, 'instructors'),
              orderBy('fullName'),
              startAfter(lastVisible),
              limit(10)
            )
          : query(
              collection(firestore as Firestore, 'instructors'),
              orderBy('fullName'),
              limit(10)
            );
      }
      
      const querySnapshot = await getDocs(instructorsQuery);
      
      if (querySnapshot.empty) {
        setHasMore(false);
        if (!lastVisible) setInstructors([]);
        setLoading(false);
        return;
      }
      
      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastVisible(lastDoc);
      
      const instructorsData = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id,
        dateOfBirth: doc.data().dateOfBirth?.toDate(),
        workingSince: doc.data().workingSince?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastActive: doc.data().lastActive?.toDate()
      })) as Instructor[];
      
      let filteredInstructors = instructorsData;
      if (searchValue) {
        filteredInstructors = instructorsData.filter(instructor => 
          instructor.fullName?.toLowerCase().includes(searchValue.toLowerCase()) || 
          instructor.email?.toLowerCase().includes(searchValue.toLowerCase())
        );
      }
      
      if (lastVisible && !searchValue) {
        setInstructors(prev => [...prev, ...filteredInstructors]);
      } else {
        setInstructors(filteredInstructors);
      }
      
      setHasMore(querySnapshot.docs.length === 10);
    } catch (err) {
      console.error('Error fetching instructors:', err);
      setError('Failed to load instructors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructors(searchTerm);
  }, [searchTerm, filter]);

  const handleRowClick = (instructorId: string) => {
    router.push(`/dashboard/instructors/${instructorId}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLastVisible(null);
    fetchInstructors(searchTerm);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Instructors</h1>
        <Link href="/dashboard/instructors/create" className="btn-primary">
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Instructor
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 p-4">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search instructors..."
              className="form-input pl-10"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="form-select"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>
      </div>

      {/* Instructors Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="min-w-full divide-y divide-gray-200">
          <div className="bg-gray-50">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-3">Name</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-2">Phone</div>
              <div className="col-span-2">Working Since</div>
              <div className="col-span-2">Last Active</div>
            </div>
          </div>
          <div className="bg-white divide-y divide-gray-200">
            {instructors.length === 0 ? (
              <div className="px-6 py-4 text-center text-gray-500">
                No instructors found. Add your first instructor to get started.
              </div>
            ) : (
              instructors.map((instructor) => (
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
                          <span className="text-gray-500 font-medium">
                            {instructor.fullName?.charAt(0)?.toUpperCase()}
                          </span>
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
                  <div className="col-span-2 flex items-center">
                    <div className="text-sm text-gray-900">
                      {instructor.lastActive?.toLocaleDateString() || 'Never'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={() => fetchInstructors(searchTerm)}
            className="btn-secondary"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
