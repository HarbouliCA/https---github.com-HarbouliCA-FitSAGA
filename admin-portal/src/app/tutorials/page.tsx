'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where, Firestore } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Tutorial } from '@/types';
import Link from 'next/link';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function TutorialsPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'musculation' | 'diete'>('all');

  useEffect(() => {
    // Only run this effect on the client side
    if (typeof window === 'undefined' || !firestore) return;
    
    const fetchTutorials = async () => {
      setLoading(true);
      try {
        let tutorialsQuery;
        
        if (filter === 'all') {
          tutorialsQuery = query(
            collection(firestore as Firestore, 'tutorials'),
            orderBy('createdAt', 'desc')
          );
        } else {
          tutorialsQuery = query(
            collection(firestore as Firestore, 'tutorials'),
            where('section', '==', filter),
            orderBy('createdAt', 'desc')
          );
        }
        
        const tutorialsSnapshot = await getDocs(tutorialsQuery);
        
        const fetchedTutorials = tutorialsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate()
          } as Tutorial;
        });
        
        // Filter by search term if provided
        const filteredTutorials = searchTerm
          ? fetchedTutorials.filter(tutorial => 
              tutorial.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              tutorial.description.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : fetchedTutorials;
        
        setTutorials(filteredTutorials);
      } catch (error) {
        console.error('Error fetching tutorials:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTutorials();
  }, [filter, searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is already handled by the useEffect dependency
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tutorials</h1>
        <Link href="/tutorials/create" className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Create New Tutorial
        </Link>
      </div>
      
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search tutorials..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="absolute right-2 top-2 text-gray-500">
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
          </form>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-gray-700">Filter:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'musculation' | 'diete')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Tutorials</option>
            <option value="musculation">Musculation</option>
            <option value="diete">Diete</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : tutorials.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-500">No tutorials found. Create your first tutorial!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutorials.map((tutorial) => (
            <div key={tutorial.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="h-48 bg-gray-200 relative">
                {tutorial.imageUrl ? (
                  <img 
                    src={tutorial.imageUrl} 
                    alt={tutorial.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    No image
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-primary-600 text-white text-xs px-2 py-1 rounded">
                  {tutorial.section === 'musculation' ? 'Musculation' : 'Diete'}
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2 truncate">{tutorial.name}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{tutorial.description}</p>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {new Date(tutorial.createdAt).toLocaleDateString()}
                  </span>
                  <Link 
                    href={`/tutorials/${tutorial.id}`}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
