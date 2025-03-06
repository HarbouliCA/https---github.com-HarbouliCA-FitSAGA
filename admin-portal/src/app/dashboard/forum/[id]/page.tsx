'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, Firestore } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { convertFirestoreTimestamp } from '@/lib/utils';
import PageNavigation from '@/components/ui/PageNavigation';
import { ForumThread, ThreadReply } from '../types';

export default function ForumThreadPage() {
  const params = useParams();
  const threadId = params?.id as string;
  const [thread, setThread] = useState<ForumThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchThread = async () => {
      if (!threadId || !firestore) return;

      try {
        const threadRef = doc(firestore as Firestore, 'forum_threads', threadId);
        const threadDoc = await getDoc(threadRef);

        if (!threadDoc.exists()) {
          setError('Thread not found');
          return;
        }

        const data = threadDoc.data();
        const threadData: ForumThread = {
          id: threadDoc.id,
          title: data.title,
          content: data.content,
          description: data.description || data.content.substring(0, 150) + '...',
          authorId: data.authorId,
          authorName: data.authorName,
          authorPhotoURL: data.authorPhotoURL,
          category: data.category,
          status: data.status,
          likes: data.likes || 0,
          replyCount: data.replyCount || 0,
          replies: (data.replies || []).map((reply: any) => ({
            ...reply,
            createdAt: reply.createdAt,
            updatedAt: reply.updatedAt
          })) as ThreadReply[],
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          lastActivity: data.lastActivity
        };
        setThread(threadData);
      } catch (error) {
        console.error('Error fetching thread:', error);
        setError('Failed to load thread');
      } finally {
        setLoading(false);
      }
    };

    fetchThread();
  }, [threadId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/dashboard/forum"
            className="text-primary-600 hover:text-primary-700"
          >
            ← Back to Forum
          </Link>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error || 'Thread not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <PageNavigation
        title={thread.title}
        backUrl="/dashboard/forum"
        backLabel="Back to Forum"
      />

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{thread.title}</h1>
              <p className="mt-1 text-gray-500">Posted by {thread.authorName || thread.authorId}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                thread.category === 'question'
                  ? 'bg-blue-100 text-blue-800'
                  : thread.category === 'discussion'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-purple-100 text-purple-800'
              }`}>
                {thread.category}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                thread.status === 'open'
                  ? 'bg-green-100 text-green-800'
                  : thread.status === 'closed'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {thread.status}
              </span>
            </div>
          </div>

          <div className="mt-4 prose prose-primary max-w-none">
            <p>{thread.content}</p>
          </div>

          <div className="mt-6 text-sm text-gray-500">
            Posted {convertFirestoreTimestamp(thread.createdAt).toLocaleDateString()}
          </div>
        </div>

        {thread.replies && thread.replies.length > 0 && (
          <div className="border-t border-gray-200">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Replies</h2>
              <div className="space-y-6">
                {thread.replies.map((reply, index) => (
                  <div key={reply.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="prose prose-sm max-w-none">
                      <p>{reply.content}</p>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      Posted {convertFirestoreTimestamp(reply.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
