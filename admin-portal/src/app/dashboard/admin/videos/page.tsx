'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import metadataService from '@/services/metadataService';
import { VideoMetadata } from '@/interfaces/tutorial';
import MetadataImport from '@/components/tutorials/MetadataImport';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

export default function AdminVideosPage() {
  const { data: session, status } = useSession();
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const fetchVideos = async () => {
    try {
      setIsLoading(true);
      const metadata = await metadataService.getAllMetadata();
      setVideos(metadata);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load video metadata');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user?.role !== 'admin') {
      redirect('/dashboard');
    } else {
      fetchVideos();
    }
  }, [session, status]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setImportError(null);
      const reader = new FileReader();
      
      reader.onload = async (e: ProgressEvent<FileReader>) => {
        try {
          const csvData = e.target?.result as string;
          console.log("CSV data loaded, processing...");
          
          // Call the service to import the data
          const result = await metadataService.importMetadataFromCSV(csvData);
          
          if (result) {
            toast.success('Videos imported successfully!');
            // Refresh the video list
            await fetchVideos();
          } else {
            toast.error('Failed to import videos');
            setImportError('Failed to import videos');
          }
        } catch (error) {
          console.error('Error processing CSV:', error);
          toast.error('Error processing CSV file');
          setImportError('Error processing CSV file');
        } finally {
          setIsImporting(false);
        }
      };
      
      reader.onerror = () => {
        toast.error('Error reading file');
        setImportError('Error reading file');
        setIsImporting(false);
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Error uploading file');
      setImportError('Error uploading file');
      setIsImporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Video Metadata Management</h1>
        <p className="text-gray-600">
          Manage exercise video metadata for the tutorial creation system.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <MetadataImport />
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Video Library ({videos.length})</h2>
            
            {error && (
              <div className="bg-red-50 text-red-500 p-4 rounded-md mb-6">
                {error}
              </div>
            )}
            
            {videos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No videos found. Import video metadata to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Video
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Activity
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Body Part
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {videos.map((video) => (
                      <tr key={video.videoId}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-16 h-16 relative bg-gray-100 rounded">
                            {video.thumbnailUrl ? (
                              <Image
                                src={video.thumbnailUrl}
                                alt={video.name}
                                fill
                                className="object-cover rounded"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                                No thumbnail
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{video.name}</div>
                          <div className="text-sm text-gray-500">{video.filename}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {video.activity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {video.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {video.bodyPart}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {isImporting && <p className="text-blue-500">Importing videos, please wait...</p>}
            {importError && <p className="text-red-500">Error: {importError}</p>}

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Import Video Metadata</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isImporting}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
              <p className="mt-1 text-sm text-gray-500">
                Upload a CSV file with video metadata. The first row should contain headers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 