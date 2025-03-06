'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where, updateDoc, doc, Firestore, limit, startAfter } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { User } from '@/types';
import Link from 'next/link';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const fetchUsers = async (searchValue = '') => {
    // Only run if on client side
    if (typeof window === 'undefined' || !firestore) return;
    
    setLoading(true);
    try {
      let usersQuery;
      
      if (searchValue) {
        // In a real app, you would use a more sophisticated search method
        // This is a simple client-side filter for demonstration
        usersQuery = query(
          collection(firestore as Firestore, 'users'),
          orderBy('name'),
          limit(10)
        );
      } else if (filter === 'active') {
        // Active users (those with credits > 0)
        usersQuery = lastVisible
          ? query(
              collection(firestore as Firestore, 'users'),
              where('credits', '>', 0),
              orderBy('credits', 'desc'),
              startAfter(lastVisible),
              limit(10)
            )
          : query(
              collection(firestore as Firestore, 'users'),
              where('credits', '>', 0),
              orderBy('credits', 'desc'),
              limit(10)
            );
      } else if (filter === 'inactive') {
        // Inactive users (those with credits = 0)
        usersQuery = lastVisible
          ? query(
              collection(firestore as Firestore, 'users'),
              where('credits', '==', 0),
              startAfter(lastVisible),
              limit(10)
            )
          : query(
              collection(firestore as Firestore, 'users'),
              where('credits', '==', 0),
              limit(10)
            );
      } else {
        usersQuery = lastVisible
          ? query(
              collection(firestore as Firestore, 'users'),
              orderBy('name'),
              startAfter(lastVisible),
              limit(10)
            )
          : query(
              collection(firestore as Firestore, 'users'),
              orderBy('name'),
              limit(10)
            );
      }
      
      const usersSnapshot = await getDocs(usersQuery);
      
      if (usersSnapshot.empty) {
        setHasMore(false);
        if (!lastVisible) setUsers([]);
        setLoading(false);
        return;
      }
      
      const lastDoc = usersSnapshot.docs[usersSnapshot.docs.length - 1];
      setLastVisible(lastDoc);
      
      const fetchedUsers = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          uid: doc.id,
          memberSince: data.memberSince?.toDate(),
          lastActive: data.lastActive?.toDate(),
          birthday: data.birthday?.toDate()
        } as User;
      });
      
      let filteredUsers = fetchedUsers;
      if (searchValue) {
        filteredUsers = fetchedUsers.filter(user => 
          user.name?.toLowerCase().includes(searchValue.toLowerCase()) || 
          user.email?.toLowerCase().includes(searchValue.toLowerCase())
        );
      }
      
      if (lastVisible && !searchValue) {
        setUsers(prev => [...prev, ...filteredUsers]);
      } else {
        setUsers(filteredUsers);
      }
      
      setHasMore(usersSnapshot.docs.length === 10);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(searchTerm);
  }, [searchTerm, filter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLastVisible(null);
    fetchUsers(searchTerm);
  };

  const toggleUserAccess = async (user: User, newStatus: 'green' | 'red') => {
    if (!firestore) {
      console.error('Firebase services not initialized');
      return;
    }
    
    try {
      await updateDoc(doc(firestore as Firestore, 'users', user.uid), {
        accessStatus: newStatus
      });
      
      // Update local state
      setUsers(users.map(u => 
        u.uid === user.uid ? { ...u, accessStatus: newStatus } : u
      ));
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="page-title">Users</h1>
        <Link 
          href="/users/create" 
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-1" />
          Add User
        </Link>
      </div>
      
      {/* Search */}
      <div className="card mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="input-field pl-10"
              placeholder="Search by name or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>
      </div>
      
      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.uid} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/users/${user.uid}`} className="text-primary-600 hover:text-primary-900">
                      {user.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="capitalize">{user.role}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {user.credits}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.accessStatus === 'green' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.accessStatus === 'green' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <Link
                      href={`/users/${user.uid}/edit`}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </Link>
                    {user.accessStatus === 'green' ? (
                      <button
                        onClick={() => toggleUserAccess(user, 'red')}
                        className="text-red-600 hover:text-red-900"
                      >
                        <XCircleIcon className="h-5 w-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleUserAccess(user, 'green')}
                        className="text-green-600 hover:text-green-900"
                      >
                        <CheckCircleIcon className="h-5 w-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {loading && (
            <div className="flex justify-center py-4">
              <div className="loading-spinner"></div>
            </div>
          )}
          
          {!loading && users.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              No users found
            </div>
          )}
          
          {hasMore && !loading && users.length > 0 && (
            <div className="flex justify-center py-4">
              <button
                onClick={() => fetchUsers(searchTerm)}
                className="btn-secondary"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
