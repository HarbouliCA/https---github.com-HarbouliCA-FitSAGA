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
    if (typeof window === 'undefined' || !firestore) return;
    
    setLoading(true);
    try {
      let usersQuery;
      
      if (searchValue) {
        usersQuery = query(
          collection(firestore as Firestore, 'users'),
          orderBy('name'),
          limit(10)
        );
      } else if (filter === 'active') {
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
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <Link 
          href="/dashboard/users/create" 
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-1" />
          Add User
        </Link>
      </div>
      
      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 p-4">
        <form onSubmit={handleSearch} className="flex gap-2">
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
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>
      </div>
      
      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
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
                    <div className="flex items-center">
                      {user.photoURL ? (
                        <img className="h-8 w-8 rounded-full mr-3" src={user.photoURL} alt="" />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                          <span className="text-gray-500 text-sm">{user.name?.[0]?.toUpperCase()}</span>
                        </div>
                      )}
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.credits}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.accessStatus === 'green' ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end items-center space-x-3">
                      <Link
                        href={`/dashboard/users/${user.uid}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        View
                      </Link>
                      <Link
                        href={`/dashboard/users/${user.uid}/edit`}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </Link>
                      {user.accessStatus === 'green' ? (
                        <button
                          onClick={() => toggleUserAccess(user, 'red')}
                          className="text-red-400 hover:text-red-600"
                        >
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleUserAccess(user, 'green')}
                          className="text-green-400 hover:text-green-600"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {loading && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        )}
        
        {!loading && users.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No users found</p>
          </div>
        )}
        
        {hasMore && !loading && (
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
  );
}
