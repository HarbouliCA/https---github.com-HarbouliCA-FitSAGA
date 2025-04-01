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
    const userIdMatch = videoId.match(/^(\d+)_/);
    const filenameMatch = videoId.match(/(\d{4}_(?:cw|bc|cm|gt)\d{3}\.mp4)$/i);
    
    // If we can extract a userId and filename
    if (userIdMatch && filenameMatch) {
      const userId = userIdMatch[1];
      const filename = filenameMatch[1];
      
      // Primary path that works - try this first
      pathVariations.push(`${userId}/día 1/${filename}`);
      
      // Add common variations
      pathVariations.push(`${userId}/ día 1/${filename}`);
      pathVariations.push(`${userId}/videos/${filename}`);
      pathVariations.push(`${userId}/${filename}`);
    } else if (userIdMatch) {
      // If we could extract just userId but not filename in expected format
      const userId = userIdMatch[1];
      
      // Try to extract a filename from the videoId regardless of format
      const parts = videoId.split('_');
      if (parts.length >= 3) {
        // The video ID format is often userId_otherData_actualFilename
        // Example: 10011090_18687781_2023_cm005.mp4
        
        // Extract what seems to be the year and identifier
        // For a format like 10011090_18687781_2023_cm005.mp4, we want to get 2023_cm005.mp4
        console.log(`Extracted video ID parts: ${JSON.stringify(parts)}`);
        
        // Try to find the pattern YYYY_xxNNN
        const yearPattern = parts.findIndex(part => part.match(/^\d{4}$/));
        if (yearPattern >= 0 && yearPattern < parts.length - 1) {
          // Found something that looks like a year, followed by type code
          const yearPart = parts[yearPattern];
          const typePart = parts[yearPattern + 1];
          const possibleFilename = `${yearPart}_${typePart}`;
          
          console.log(`Extracted possible filename: ${possibleFilename}`);
          
          // Try with this filename in the known working path
          pathVariations.push(`${userId}/día 1/${possibleFilename}`);
          pathVariations.push(`${userId}/ día 1/${possibleFilename}`);
        } else {
          // Last part might be the filename
          const possibleFilename = parts.slice(2).join('_');
          console.log(`No year pattern found, using last parts as filename: ${possibleFilename}`);
          
          // Try with this filename in the known working path
          pathVariations.push(`${userId}/día 1/${possibleFilename}`);
          pathVariations.push(`${userId}/ día 1/${possibleFilename}`);
        }
      }
      
      // Also try the full videoId as the filename in "día 1" folder
      pathVariations.push(`${userId}/día 1/${videoId}`);
    }
    
    // Try "videos" folder only if necessary
    pathVariations.push(`videos/${videoId}`);
    
    // Remove duplicates
    const uniquePathVariations = [...new Set(pathVariations)];
    console.log(`Generated ${uniquePathVariations.length} path variations to try:`);
    uniquePathVariations.forEach((path, index) => {
      console.log(`  Path ${index + 1}: ${path}`);
    });
    
    // Try these containers in order of likelihood
    const containerNames = ['sagafitvideos', 'sagavideos', 'videos'];
    
    let foundVideo = false;
    let failedContainers = [];
    let lastError = null;
    
    // Try each container with each path variation until we find the video
    for (const container of containerNames) {
      let containerFailed = true;
      
      for (const path of uniquePathVariations) {
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
            
            // Set debugging headers in development
            if (process.env.NODE_ENV === 'development') {
              res.setHeader('X-Source-Container', container);
              res.setHeader('X-Source-Path', path);
            }
            
            // Get the array buffer and send it as the response
            const arrayBuffer = await response.arrayBuffer();
            res.status(200).send(Buffer.from(arrayBuffer));
            
            foundVideo = true;
            containerFailed = false;
            return;
          }
        } catch (error) {
          // Store the error to report back later
          lastError = error.message;
          console.log(`Failed to fetch from ${container}/${path}: ${error.message}`);
        }
      }
      
      if (containerFailed) {
        failedContainers.push(container);
      }
    }

    if (!foundVideo) {
      console.error('Failed to fetch video from any container or path variation');
      
      // Try direct URL construction with proper encoding for all patterns as well as cwXXX patterns
      if (userIdMatch) {
        try {
          const userId = userIdMatch[1];
          
          // Try both sagafitvideos and sagavideos containers with the determined pattern
          const containers = ['sagafitvideos', 'sagavideos', 'videos'];
          
          // Try extracting a simple filename from the videoId
          let simpleFilename = videoId.split('/').pop(); // Get the last part if it has a path
          
          // Extract YYYY_xxNNN.mp4 pattern if it exists
          const filenameRegex = /(\d{4}_[a-z]{2}\d{3}\.mp4)$/i;
          const extractedFilename = videoId.match(filenameRegex);
          if (extractedFilename) {
            simpleFilename = extractedFilename[1];
          }
          
          console.log(`Attempting final fallback with userId: ${userId}, extracted filename: ${simpleFilename}`);
          
          for (const container of containers) {
            // Try both "día 1" through "día 5" patterns
            for (let i = 1; i <= 5; i++) {
              // Use the exact format from the working URL
              const encodedPath = `${userId}/${encodeURIComponent(`día ${i}`)}/${simpleFilename}`;
              const directUrl = `https://${accountName}.blob.core.windows.net/${container}/${encodedPath}?${sasToken}`;
              console.log(`Trying direct URL: ${directUrl}`);
              
              // First try a HEAD request to check if the video exists
              const headResponse = await fetch(directUrl, { method: 'HEAD' });
              
              if (headResponse.ok) {
                // Get content range and length for streaming setup
                const contentLength = headResponse.headers.get('content-length');
                const contentType = headResponse.headers.get('content-type') || 'video/mp4';
                
                console.log(`Found video in: ${container}/${encodedPath}`);
                
                // Instead of piping, use a proxy fetch and forward the data
                const response = await fetch(directUrl);
                
                // Check if response is successful
                if (!response.ok) {
                  throw new Error(`Failed to fetch video from ${container}/${encodedPath}: ${response.status} ${response.statusText}`);
                }
                
                // Set up streaming headers
                res.setHeader('Content-Type', contentType);
                res.setHeader('Accept-Ranges', 'bytes');
                
                if (contentLength) {
                  res.setHeader('Content-Length', contentLength);
                }
                
                // Set debugging headers in development
                if (process.env.NODE_ENV === 'development') {
                  res.setHeader('X-Source-Container', container);
                  res.setHeader('X-Source-Path', encodedPath);
                }
                
                // Get the array buffer and send it as the response
                const arrayBuffer = await response.arrayBuffer();
                res.status(200).send(Buffer.from(arrayBuffer));
                
                return;
              }
            }
          }
        } catch (error) {
          console.error(`Failed to fetch video from direct URL: ${error.message}`);
        }
      }
    }

    // If we get here, provide detailed error
    const detailedError = {
      error: 'Video not found',
      videoId,
      triedContainers: containerNames,
      failedContainers,
      triedPathCount: uniquePathVariations.length,
      message: 'Could not locate video in any container or path variation',
      lastError
    };
    
    console.error('Video search details:', detailedError);
    return res.status(404).json(detailedError);
  } catch (error) {
    console.error('Error proxying video:', error);
    return res.status(500).json({ error: 'Error processing video request', details: error.message });
  }
}