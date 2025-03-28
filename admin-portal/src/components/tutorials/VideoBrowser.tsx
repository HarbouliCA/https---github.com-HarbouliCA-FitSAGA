'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { VideoMetadata } from '@/interfaces/tutorial';
import metadataService from '@/services/metadataService';
import azureStorageService from '@/services/azureStorageService';
import Image from 'next/image';

interface VideoBrowserProps {
  onSelectVideo: (video: VideoMetadata) => void;
}

const ITEMS_PER_PAGE = 10;

export default function VideoBrowser({ onSelectVideo }: VideoBrowserProps) {
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<VideoMetadata[]>([]);
  const [displayedVideos, setDisplayedVideos] = useState<VideoMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Filter states
  const [activityFilter, setActivityFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [bodyPartFilter, setBodyPartFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Available filter options
  const [activities, setActivities] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [bodyParts, setBodyParts] = useState<string[]>([]);

  // Intersection Observer for infinite scroll
  const observer = useRef<IntersectionObserver>();
  const lastVideoElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Format video name to be more user-friendly
  const formatVideoName = (video: VideoMetadata): string => {
    if (!video.name) return video.activity || 'Untitled Video';
    
    // Remove numeric prefixes and file extensions
    let name = video.name.replace(/^\d+_/, '').replace(/\.\w+$/, '');
    
    // Convert to Title Case and replace underscores/dashes with spaces
    name = name.replace(/[_-]/g, ' ')
               .split(' ')
               .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
               .join(' ');
    
    return name;
  };

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const allMetadata = await metadataService.getAllMetadata();
        setVideos(allMetadata);
        setFilteredVideos(allMetadata);
        
        // Extract unique filter options
        const uniqueActivities = [...new Set(allMetadata.map(video => video.activity))].filter(Boolean);
        const uniqueTypes = [...new Set(allMetadata.map(video => video.type))].filter(Boolean);
        const uniqueBodyParts = [...new Set(allMetadata.map(video => video.bodyPart))].filter(Boolean);
        
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

  // Apply filters
  useEffect(() => {
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
        (video.name?.toLowerCase().includes(query) || '') ||
        (video.activity?.toLowerCase().includes(query) || '') ||
        (video.type?.toLowerCase().includes(query) || '') ||
        (video.bodyPart?.toLowerCase().includes(query) || '')
      );
    }
    
    setFilteredVideos(result);
    setPage(1); // Reset pagination when filters change
    setHasMore(true);
  }, [videos, activityFilter, typeFilter, bodyPartFilter, searchQuery]);

  // Handle pagination
  useEffect(() => {
    const startIndex = 0;
    const endIndex = page * ITEMS_PER_PAGE;
    const paginatedVideos = filteredVideos.slice(startIndex, endIndex);
    setDisplayedVideos(paginatedVideos);
    setHasMore(endIndex < filteredVideos.length);
  }, [filteredVideos, page]);

  const resetFilters = () => {
    setActivityFilter('');
    setTypeFilter('');
    setBodyPartFilter('');
    setSearchQuery('');
  };

  const getThumbnailProxyUrl = (thumbnailUrl: string) => {
    if (!thumbnailUrl) return '';
    
    try {
      // Extract the base path and SAS token
      const [basePath, sasToken] = thumbnailUrl.split('?');
      const match = basePath.match(/sagathumbnails\/(.+)$/);
      if (!match) return '';
      
      const path = decodeURIComponent(match[1]); // First decode in case it's already encoded
      
      // Always use the proxy endpoint without passing the SAS token
      // The proxy will handle the SAS token from environment variables
      return `/api/image-proxy?path=${encodeURIComponent(path)}`;
    } catch (error) {
      console.error('Error processing thumbnail URL:', error);
      return '';
    }
  };

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
              className="p-2 border rounded w-full"
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
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {displayedVideos.length} of {filteredVideos.length} videos
          </div>
          <button 
            onClick={resetFilters}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Reset Filters
          </button>
        </div>
      </div>
      
      {/* Video Grid */}
      {displayedVideos.length === 0 && !loading ? (
        <div className="text-center py-8 text-gray-500">
          No videos match your filters. Try adjusting your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayedVideos.map((video, index) => (
            <div 
              key={`video-${video.videoId || index}`}
              ref={index === displayedVideos.length - 1 ? lastVideoElementRef : undefined}
              className="border p-4 rounded cursor-pointer hover:border-blue-500 transition-colors"
              onClick={() => onSelectVideo(video)}
            >
              <div className="relative h-40 bg-gray-100 rounded overflow-hidden">
                {video.thumbnailUrl ? (
                  <div className="h-full w-full relative">
                    <Image
                      src={getThumbnailProxyUrl(video.thumbnailUrl)}
                      alt={formatVideoName(video)}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-gray-400">No thumbnail</span>
                  </div>
                )}
              </div>
              <div className="mt-2">
                <h3 className="font-medium truncate">{formatVideoName(video)}</h3>
                <p className="text-sm text-gray-600 truncate">{video.activity}</p>
                <p className="text-xs text-gray-500 truncate">{video.bodyPart}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
} 