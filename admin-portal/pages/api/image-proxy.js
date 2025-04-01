import { BlobServiceClient } from '@azure/storage-blob';

export default async function handler(req, res) {
  try {
    const { path } = req.query;
    if (!path) {
      return res.status(400).json({ error: 'Path parameter is required' });
    }

    // Get Azure credentials from environment variables
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const sasToken = process.env.AZURE_SAS_TOKEN;

    if (!accountName || !sasToken) {
      throw new Error('Azure storage configuration is incomplete');
    }

    // Log the requested path
    console.log(`Image proxy requested path: ${path}`);

    // Try different variations of the path
    let decodedPaths = [];

    // Original path decoding
    const originalDecodedPath = path
      .split('/')
      .map(segment => decodeURIComponent(segment))
      .join('/');
    decodedPaths.push(originalDecodedPath);

    // Check if this is a thumbnail identifier with format like thumbnails/12345.jpg
    const thumbnailMatch = originalDecodedPath.match(/^thumbnails\/(.+)$/);
    if (thumbnailMatch) {
      const thumbnailId = thumbnailMatch[1];
      const fileBase = thumbnailId.split('.')[0]; // Get the file base name without extension
      
      // Try with different extensions
      const extensions = ['.jpg', '.jpeg', '.png', '.gif'];
      for (const ext of extensions) {
        if (!thumbnailId.endsWith(ext)) {
          decodedPaths.push(`thumbnails/${fileBase}${ext}`);
        }
      }
      
      // Try with userId folder structure
      if (fileBase.match(/^\d+/)) {
        const possibleUserId = fileBase.match(/^(\d+)/)[1];
        decodedPaths.push(`${possibleUserId}/thumbnails/${thumbnailId}`);
        decodedPaths.push(`${possibleUserId}/día 1/thumbnails/${thumbnailId}`);
        decodedPaths.push(`${possibleUserId}/día 1/images/${thumbnailId}`);
        decodedPaths.push(`${possibleUserId}/ día 1/thumbnails/${thumbnailId}`);
        decodedPaths.push(`${possibleUserId}/ día 1/images/${thumbnailId}`);
        
        // Also try with just the ID
        decodedPaths.push(`${possibleUserId}/${thumbnailId}`);
        decodedPaths.push(`${possibleUserId}/images/${thumbnailId}`);
      }
    }

    // Check if path matches the pattern userId/día X/images/filename.png
    const userIdMatch = originalDecodedPath.match(/^(\d+)\/(.+)$/);
    if (userIdMatch) {
      // Add version with space after user ID
      const userId = userIdMatch[1];
      const restOfPath = userIdMatch[2];
      const alternativePath = `${userId}/ ${restOfPath}`;
      decodedPaths.push(alternativePath);
      
      // If it contains 'images' folder, try both with and without it
      if (restOfPath.includes('images/')) {
        const pathWithoutImages = restOfPath.replace('images/', '');
        decodedPaths.push(`${userId}/${pathWithoutImages}`);
        decodedPaths.push(`${userId}/ ${pathWithoutImages}`);
      } else {
        // If it doesn't contain 'images', try adding it
        const segments = restOfPath.split('/');
        const lastSegment = segments.pop();
        decodedPaths.push(`${userId}/${segments.join('/')}/images/${lastSegment}`);
        decodedPaths.push(`${userId}/ ${segments.join('/')}/images/${lastSegment}`);
      }
    }

    // Log all paths we're going to try
    console.log(`Generated ${decodedPaths.length} path variations to try`);

    // Try multiple container names if the first one fails
    const containerNames = ['sagathumbnails', 'saga-thumbnails', 'sagafitvideos', 'sagavideos', 'images'];
    
    let response;
    let successfulContainer = null;
    let successfulPath = null;
    
    // Try each container with each path variation until we find the image
    for (const container of containerNames) {
      for (const decodedPath of decodedPaths) {
        const blobUrl = `https://${accountName}.blob.core.windows.net/${container}/${decodedPath}?${sasToken}`;
        
        try {
          // First do a HEAD request to check if the file exists
          const headResponse = await fetch(blobUrl, {
            method: 'HEAD',
            headers: {
              'Accept': 'image/*'
            }
          });
          
          if (headResponse.ok) {
            console.log(`Found image in container: ${container} with path: ${decodedPath}`);
            
            // Now do the actual GET request
            const fetchResponse = await fetch(blobUrl, {
              headers: {
                'Accept': 'image/*'
              }
            });
            
            if (fetchResponse.ok) {
              response = fetchResponse;
              successfulContainer = container;
              successfulPath = decodedPath;
              break;
            }
          }
        } catch (error) {
          // Continue to the next path/container
          // console.log(`Failed to fetch from ${container}/${decodedPath}`);
        }
      }
      
      if (response) break; // Break out of container loop if we found a match
    }

    if (!response || !response.ok) {
      console.warn(`Failed to fetch image: ${path} from any container or path variation`);
      
      // Return a placeholder image instead of an error
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
      
      // A small placeholder PNG - could be improved with a nicer placeholder
      const transparentPixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
      return res.status(200).send(transparentPixel);
    }

    // Get the content type from the response
    const contentType = response.headers.get('Content-Type') || 'image/jpeg';

    // Get the blob data as an array buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Set appropriate headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.setHeader('Content-Length', buffer.length);
    
    // Add debug headers in development
    if (process.env.NODE_ENV === 'development') {
      res.setHeader('X-Source-Container', successfulContainer);
      res.setHeader('X-Source-Path', successfulPath);
    }

    // Send the response
    res.status(200).send(buffer);
  } catch (error) {
    console.error('Error proxying image:', error);
    
    // Return a placeholder image instead of an error
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    
    // A small placeholder PNG
    const transparentPixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    return res.status(200).send(transparentPixel);
  }
}

// Helper function to generate thumbnail URL using environment variables
export function getVideoThumbnailUrl(videoId, videoName) {
  // Extract the user ID from the video ID if it follows the pattern
  let userId = null;
  const userIdMatch = videoId.match(/^(\d+)_/);
  if (userIdMatch) {
    userId = userIdMatch[1];
  } else if (/^\d+$/.test(videoId.split('.')[0])) {
    // If the videoId is just a number with a file extension
    userId = videoId.split('.')[0];
  }
  
  // Get SAS token from environment variables
  const sasToken = process.env.AZURE_SAS_TOKEN;
  if (!sasToken) {
    throw new Error('Azure SAS token is not configured');
  }
  
  // Get account name
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  if (!accountName) {
    throw new Error('Azure account name is not configured');
  }
  
  // Try to determine the thumbnail filename based on the video ID or name
  let thumbnailFilename;
  if (videoName) {
    // If we have a video name, use it to create the thumbnail name
    thumbnailFilename = videoName.replace(/\.(mp4|mov|avi|wmv)$/i, '.jpg');
  } else {
    // Otherwise, use the videoId
    thumbnailFilename = videoId.replace(/\.(mp4|mov|avi|wmv)$/i, '.jpg');
  }
  
  // Return the proxy URL rather than the direct URL
  return `/api/image-proxy?path=${encodeURIComponent(`thumbnails/${thumbnailFilename}`)}`;
} 