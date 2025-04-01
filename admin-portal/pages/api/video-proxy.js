import { BlobServiceClient } from '@azure/storage-blob';

export default async function handler(req, res) {
  try {
    const { videoId } = req.query;
    if (!videoId) {
      return res.status(400).json({ error: 'videoId parameter is required' });
    }

    // Get Azure credentials from environment variables
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const sasToken = process.env.AZURE_SAS_TOKEN;

    if (!accountName || !sasToken) {
      throw new Error('Azure storage configuration is incomplete');
    }

    console.log(`Attempting to proxy video: ${videoId}`);

    // Create path variations to try
    const pathVariations = [];
    
    // Original path (directly in container root)
    pathVariations.push(videoId);
    
    // Extract parts from the video ID for different path combinations
    // Format might be userId_otherIds_year_cwXXX.mp4 or just year_cwXXX.mp4
    const userIdMatch = videoId.match(/^(\d+)_/);
    const filenameMatch = videoId.match(/(\d{4}_cw\d{3}\.mp4)$/i);
    const simplifiedFilenameMatch = videoId.match(/_(\d{4}_cw\d{3}\.mp4)$/i);
    
    // If we can extract a userId
    if (userIdMatch) {
      const userId = userIdMatch[1];
      
      // Try different folder patterns with full videoId
      pathVariations.push(`${userId}/${videoId}`);                        
      pathVariations.push(`${userId}/día 1/${videoId}`);                  
      pathVariations.push(`${userId}/ día 1/${videoId}`);                 
      pathVariations.push(`${userId}/videos/${videoId}`);                 
      pathVariations.push(`${userId}/día 1/videos/${videoId}`);
      pathVariations.push(`${userId}/ día 1/videos/${videoId}`);
      
      // Try with just the year_cwXXX.mp4 part if we can extract it
      if (simplifiedFilenameMatch) {
        const simpleFilename = simplifiedFilenameMatch[1];
        pathVariations.push(`${userId}/${simpleFilename}`);
        pathVariations.push(`${userId}/día 1/${simpleFilename}`);
        pathVariations.push(`${userId}/ día 1/${simpleFilename}`);
        pathVariations.push(`${userId}/videos/${simpleFilename}`);
      }
      
      // If the filename matches the specific pattern from the direct URL example
      if (filenameMatch) {
        const exactFilename = filenameMatch[1];
        pathVariations.push(`${userId}/${exactFilename}`);
        pathVariations.push(`${userId}/día 1/${exactFilename}`);
        pathVariations.push(`${userId}/ día 1/${exactFilename}`);
        pathVariations.push(`${userId}/videos/${exactFilename}`);
      }
    }

    // Special case - direct pattern from the example URL
    if (videoId.includes('_')) {
      // Extract just the last part after final underscore (e.g., 2023_cw003.mp4 from 10011090_18687781_2023_cw003.mp4)
      const parts = videoId.split('_');
      if (parts.length >= 2) {
        const lastParts = parts.slice(parts.length - 2).join('_'); // Get last 2 segments with underscore
        if (lastParts.match(/\d{4}_cw\d{3}\.mp4$/i)) {
          // This matches the pattern like 2023_cw003.mp4
          pathVariations.push(lastParts);
          
          if (userIdMatch) {
            const userId = userIdMatch[1];
            pathVariations.push(`${userId}/${lastParts}`);
            pathVariations.push(`${userId}/día 1/${lastParts}`);
            pathVariations.push(`${userId}/ día 1/${lastParts}`);
            pathVariations.push(`${userId}/día 1/videos/${lastParts}`);
          }
        }
      }
    }

    // Try "videos" folder
    pathVariations.push(`videos/${videoId}`);
    
    // Add any custom path format based on direct URL pattern
    if (userIdMatch && videoId.match(/\d{4}_cw\d{3}\.mp4$/i)) {
      const userId = userIdMatch[1];
      const filename = videoId.match(/(\d{4}_cw\d{3}\.mp4)$/i)[1];
      pathVariations.push(`${userId}/día 1/${filename}`);
    }
    
    console.log('Trying path variations:', pathVariations);

    // Try multiple container names if the first one fails
    const containerNames = ['sagafitvideos', 'sagathumbnails', 'saga-videos', 'sagavideos', 'videos', 'sagafit'];
    
    let foundVideo = false;
    
    // Try each container with each path variation until we find the video
    for (const container of containerNames) {
      for (const path of pathVariations) {
        try {
          // Properly encode the URL parts - especially for the "día" with accent
          const encodedPath = path.split('/').map(segment => 
            encodeURIComponent(segment)).join('/');
            
          const videoUrl = `https://${accountName}.blob.core.windows.net/${container}/${encodedPath}?${sasToken}`;
          console.log(`Trying URL pattern: ${container}/${path}`);
          
          // First try a HEAD request to check if the video exists
          const headResponse = await fetch(videoUrl, { method: 'HEAD' });
          
          if (headResponse.ok) {
            // Get content range and length for streaming setup
            const contentLength = headResponse.headers.get('content-length');
            const contentType = headResponse.headers.get('content-type') || 'video/mp4';
            
            console.log(`Found video in: ${container}/${path}`);
            
            // Instead of piping, use a proxy fetch and forward the data
            const response = await fetch(videoUrl);
            
            // Check if response is successful
            if (!response.ok) {
              throw new Error(`Failed to fetch video from ${container}/${path}: ${response.status} ${response.statusText}`);
            }
            
            // Set up streaming headers
            res.setHeader('Content-Type', contentType);
            res.setHeader('Accept-Ranges', 'bytes');
            
            if (contentLength) {
              res.setHeader('Content-Length', contentLength);
            }
            
            // Get the array buffer and send it as the response
            const arrayBuffer = await response.arrayBuffer();
            res.status(200).send(Buffer.from(arrayBuffer));
            
            foundVideo = true;
            return;
          }
        } catch (error) {
          // Continue to the next path/container
          console.log(`Failed to fetch from ${container}/${path}: ${error.message}`);
        }
      }
    }

    if (!foundVideo) {
      console.error('Failed to fetch video from any container or path variation');
      
      // Try direct URL construction with proper encoding - using the known working pattern
      if (userIdMatch && filenameMatch) {
        try {
          const userId = userIdMatch[1];
          const filename = filenameMatch[1];
          
          // Use the exact format from the working URL
          const encodedPath = `${userId}/${encodeURIComponent('día 1')}/${filename}`;
          const directUrl = `https://${accountName}.blob.core.windows.net/sagafitvideos/${encodedPath}?${sasToken}`;
          
          console.log('Trying exact known working pattern:', directUrl);
          
          const response = await fetch(directUrl);
          if (response.ok) {
            console.log('Successfully found video using exact pattern!');
            const contentType = response.headers.get('content-type') || 'video/mp4';
            const arrayBuffer = await response.arrayBuffer();
            
            res.setHeader('Content-Type', contentType);
            res.status(200).send(Buffer.from(arrayBuffer));
            return;
          }
        } catch (error) {
          console.error('Error with direct URL approach:', error.message);
        }
      }
      
      // If we get here, provide detailed error
      const detailedError = {
        error: 'Video not found',
        videoId,
        triedContainers: containerNames,
        triedPaths: pathVariations,
        message: 'Could not locate video in any container or path variation'
      };
      
      console.error('Video search details:', detailedError);
      return res.status(404).json(detailedError);
    }
  } catch (error) {
    console.error('Error proxying video:', error);
    return res.status(500).json({ error: 'Error processing video request', details: error.message });
  }
} 