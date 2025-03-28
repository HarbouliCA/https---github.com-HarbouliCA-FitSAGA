'use client';

import { useState, useEffect } from 'react';
import { VideoMetadata } from '@/interfaces/tutorial';
import metadataService from '@/services/metadataService';
import azureStorageService from '@/services/azureStorageService';
import Image from 'next/image';

interface VideoBrowserProps {
  onSelectVideo: (video: VideoMetadata) => void;
}

export default function VideoBrowser({ onSelectVideo }: VideoBrowserProps) {
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<VideoMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [activityFilter, setActivityFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [bodyPartFilter, setBodyPartFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Available filter options
  const [activities, setActivities] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [bodyParts, setBodyParts] = useState<string[]>([]);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const allMetadata = await metadataService.getAllMetadata();
        setVideos(allMetadata);
        setFilteredVideos(allMetadata);
        
        // Extract unique filter options
        const uniqueActivities = [...new Set(allMetadata.map(video => video.activity))];
        const uniqueTypes = [...new Set(allMetadata.map(video => video.type))];
        const uniqueBodyParts = [...new Set(allMetadata.map(video => video.bodyPart))];
        
        setActivities(uniqueActivities);
        setTypes(uniqueTypes);
        setBodyParts(uniqueBodyParts);
      } catch (err) {
        setError('Failed to load videos. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  useEffect(() => {
    // Apply filters
    let result = [...videos];
    
    if (activityFilter) {
      result = result.filter(video => video.activity === activityFilter);
    }
    
    if (typeFilter) {
      result = result.filter(video => video.type === typeFilter);
    }
    
    if (bodyPartFilter) {
      result = result.filter(video => video.bodyPart === bodyPartFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(video => 
        video.name.toLowerCase().includes(query) || 
        video.activity.toLowerCase().includes(query) ||
        video.type.toLowerCase().includes(query) ||
        video.bodyPart.toLowerCase().includes(query)
      );
    }
    
    setFilteredVideos(result);
  }, [videos, activityFilter, typeFilter, bodyPartFilter, searchQuery]);

  const resetFilters = () => {
    setActivityFilter('');
    setTypeFilter('');
    setBodyPartFilter('');
    setSearchQuery('');
  };

  if (loading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>;
  
  if (error) return <div className="text-red-500 p-4">{error}</div>;

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-semibold mb-4">Select Exercise Video</h2>
      
      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div>
          <input
            type="text"
            placeholder="Search videos..."
            className="w-full p-2 border rounded-md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Activity</label>
            <select 
              className="w-full p-2 border rounded-md"
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
            >
              <option value="">All Activities</option>
              {activities.map(activity => (
                <option key={activity} value={activity}>{activity}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select 
              className="w-full p-2 border rounded-md"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              {types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Body Part</label>
            <select 
              value={bodyPartFilter} 
              onChange={(e) => setBodyPartFilter(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="">All Body Parts</option>
              {bodyParts.map((bodyPart, index) => (
                <option key={`bodyPart-${index}-${bodyPart}`} value={bodyPart}>
                  {bodyPart}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button 
            onClick={resetFilters}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Reset Filters
          </button>
        </div>
      </div>
      
      {/* Video Grid */}
      {filteredVideos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No videos match your filters. Try adjusting your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredVideos.map((video, index) => (
            <div 
              key={`video-${video.videoId || index}`} 
              className="border p-4 rounded cursor-pointer"
              onClick={() => onSelectVideo(video)}
            >
              <div className="relative h-40 bg-gray-100">
                {video.thumbnailUrl ? (
                  <div className="h-full w-full relative">
                    <img 
                      src={`/api/image-proxy?path=${encodeURIComponent(
                        video.thumbnailUrl.replace('https://sagafit.blob.core.windows.net/sagathumbnails/', '')
                      )}`} 
                      alt={video.name || `Video thumbnail ${index + 1}`}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span>No thumbnail</span>
                  </div>
                )}
              </div>
              <div className="mt-2">
                <h3 className="font-medium">{video.name || video.videoId}</h3>
                <p className="text-sm text-gray-600">{video.bodyPart}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 