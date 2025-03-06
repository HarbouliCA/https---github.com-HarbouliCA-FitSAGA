'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, deleteDoc, Firestore } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Tutorial } from '@/types';
import { useRouter } from 'next/navigation';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import PageNavigation from '@/components/ui/PageNavigation';
import Image from 'next/image';

export default function TutorialDetailPage({ params }: { params: { id: string } }) {
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchTutorial = async () => {
      if (!firestore) return;

      try {
        const tutorialDoc = await getDoc(doc(firestore as Firestore, 'tutorials', params.id));
        
        if (!tutorialDoc.exists()) {
          setError('Tutorial not found');
          setLoading(false);
          return;
        }

        setTutorial({
          id: tutorialDoc.id,
          ...tutorialDoc.data()
        } as Tutorial);
      } catch (error) {
        console.error('Error fetching tutorial:', error);
        setError('Failed to load tutorial');
      } finally {
        setLoading(false);
      }
    };

    fetchTutorial();
  }, [params.id]);

  const handleDelete = async () => {
    if (!firestore || !tutorial) return;
    
    setIsDeleting(true);
    try {
      // TODO: Delete thumbnail and video from Azure Blob Storage
      await deleteDoc(doc(firestore as Firestore, 'tutorials', tutorial.id));
      router.push('/dashboard/tutorials');
    } catch (error) {
      console.error('Error deleting tutorial:', error);
      setError('Failed to delete tutorial');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button 
            onClick={() => router.push('/dashboard/tutorials')}
            className="text-red-700 font-medium hover:text-red-800 mt-2"
          >
            Back to Tutorials
          </button>
        </div>
      </div>
    );
  }

  if (!tutorial) return null;

  const actions = (
    <div className="flex items-center space-x-4">
      <button
        onClick={() => router.push(`/dashboard/tutorials/${params.id}/edit`)}
        className="text-gray-400 hover:text-gray-600"
      >
        <PencilIcon className="h-5 w-5" />
      </button>
      <button
        onClick={() => setShowDeleteModal(true)}
        className="text-red-400 hover:text-red-600"
      >
        <TrashIcon className="h-5 w-5" />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageNavigation
        backUrl="/dashboard/tutorials"
        backLabel="Back to Tutorials"
        title={tutorial.title}
        actions={actions}
      />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="p-6">
          <div className="grid grid-cols-1 gap-8">
            {/* Thumbnail Image */}
            {tutorial.thumbnailUrl && (
              <div className="relative w-full h-64">
                <Image
                  src={tutorial.thumbnailUrl}
                  alt={tutorial.title}
                  fill
                  className="object-cover rounded"
                />
              </div>
            )}

            {/* Video Player */}
            {tutorial.videoUrl && (
              <div className="aspect-w-16 aspect-h-9">
                <video
                  controls
                  className="w-full rounded"
                  poster={tutorial.thumbnailUrl}
                >
                  <source src={tutorial.videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            )}

            <div>
              <h2 className="text-xl font-semibold mb-4">Tutorial Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Category</label>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {tutorial.category}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Author</label>
                  <div className="mt-1 text-sm text-gray-900">{tutorial.author}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Duration</label>
                  <div className="mt-1 text-sm text-gray-900">{tutorial.duration} minutes</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Difficulty Level</label>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      tutorial.difficulty === 'beginner'
                        ? 'bg-green-100 text-green-800'
                        : tutorial.difficulty === 'intermediate'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {tutorial.difficulty}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {tutorial.description && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Description</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{tutorial.description}</p>
                </div>
              </div>
            )}

            {tutorial.content && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Content</h2>
                <div className="prose max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: tutorial.content }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Delete Tutorial</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {tutorial.title}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn-secondary"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn-danger"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
