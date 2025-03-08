'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, updateDoc, doc, Firestore, limit, startAfter, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Instructor } from '@/types';
import Link from 'next/link';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { InstructorList } from '@/components/instructors/InstructorList';

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const fetchInstructors = async (searchValue = '') => {
    if (typeof window === 'undefined' || !firestore) return;
    
    setLoading(true);
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
      
      const instructorsSnapshot = await getDocs(instructorsQuery);
      
      if (instructorsSnapshot.empty) {
        setHasMore(false);
        if (!lastVisible) setInstructors([]);
        setLoading(false);
        return;
      }
      
      const lastDoc = instructorsSnapshot.docs[instructorsSnapshot.docs.length - 1];
      setLastVisible(lastDoc);
      
      const fetchedInstructors = instructorsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          uid: doc.id,
          dateOfBirth: data.dateOfBirth?.toDate(),
          workingSince: data.workingSince?.toDate(),
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate(),
          lastActive: data.lastActive?.toDate()
        } as Instructor;
      });
      
      let filteredInstructors = fetchedInstructors;
      if (searchValue) {
        filteredInstructors = fetchedInstructors.filter(instructor => 
          instructor.fullName?.toLowerCase().includes(searchValue.toLowerCase()) || 
          instructor.email?.toLowerCase().includes(searchValue.toLowerCase())
        );
      }
      
      if (lastVisible && !searchValue) {
        setInstructors(prev => [...prev, ...filteredInstructors]);
      } else {
        setInstructors(filteredInstructors);
      }
      
      setHasMore(instructorsSnapshot.docs.length === 10);
    } catch (error) {
      console.error('Error fetching instructors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructors(searchTerm);
  }, [searchTerm, filter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLastVisible(null);
    fetchInstructors(searchTerm);
  };

  const toggleInstructorAccess = async (instructor: Instructor, newStatus: 'green' | 'red') => {
    if (!firestore) {
      console.error('Firebase services not initialized');
      return;
    }
    
    try {
      await updateDoc(doc(firestore as Firestore, 'instructors', instructor.uid), {
        accessStatus: newStatus
      });
      
      // Update local state
      setInstructors(instructors.map(i => 
        i.uid === instructor.uid ? { ...i, accessStatus: newStatus } : i
      ));
    } catch (error) {
      console.error('Error updating instructor status:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Instructors</h1>
        <Link 
          href="/dashboard/instructors/create" 
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-1" />
          Add Instructor
        </Link>
      </div>
      
      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 p-4">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Search by name or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>
      </div>
      
      {/* Instructors List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : instructors.length > 0 ? (
        <>
          <InstructorList 
            instructors={instructors}
            onToggleAccess={toggleInstructorAccess}
          />
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
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No instructors found
        </div>
      )}
    </div>
  );
}
