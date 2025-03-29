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

    // Try different variations of the path - with and without space after user ID
    let decodedPaths = [];

    // Original path decoding
    const originalDecodedPath = path
      .split('/')
      .map(segment => decodeURIComponent(segment))
      .join('/');
    decodedPaths.push(originalDecodedPath);

    // Check if path matches the pattern userId/día X/images/filename.png
    const userIdMatch = originalDecodedPath.match(/^(\d+)\/(.+)$/);
    if (userIdMatch) {
      // Add version with space after user ID
      const userId = userIdMatch[1];
      const restOfPath = userIdMatch[2];
      const alternativePath = `${userId}/ ${restOfPath}`;
      decodedPaths.push(alternativePath);
    }

    // Log all paths we're going to try
    console.log('Trying paths:', decodedPaths);

    // Try multiple container names if the first one fails
    const containerNames = ['sagathumbnails', 'saga-thumbnails', 'sagavideos', 'images'];
    
    let response;
    let successfulContainer = null;
    let successfulPath = null;
    
    // Try each container with each path variation until we find the image
    for (const container of containerNames) {
      for (const decodedPath of decodedPaths) {
        const blobUrl = `https://${accountName}.blob.core.windows.net/${container}/${decodedPath}?${sasToken}`;
        console.log(`Trying URL: ${blobUrl}`);
        
        try {
          const fetchResponse = await fetch(blobUrl, {
            headers: {
              'Accept': 'image/*'
            }
          });
          
          if (fetchResponse.ok) {
            response = fetchResponse;
            successfulContainer = container;
            successfulPath = decodedPath;
            console.log(`Found image in container: ${container} with path: ${decodedPath}`);
            break;
          }
        } catch (error) {
          // Continue to the next path/container
          console.log(`Failed to fetch from ${container}/${decodedPath}: ${error.message}`);
        }
      }
      
      if (response) break; // Break out of container loop if we found a match
    }

    if (!response || !response.ok) {
      console.error('Failed to fetch blob from any container or path variation');
      
      // Return a transparent placeholder image instead of an error
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
      
      // A small transparent PNG
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

    // Send the response
    res.status(200).send(buffer);
  } catch (error) {
    console.error('Error proxying image:', error);
    
    // Return a transparent placeholder image instead of an error
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    
    // A small transparent PNG
    const transparentPixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    return res.status(200).send(transparentPixel);
  }
}

// Helper function to generate thumbnail URL using environment variables
function getVideoThumbnailUrl(videoId, videoName) {
  // Extract the user ID and folder from the video path if needed
  const userId = videoId.split('_')[0]; // Assuming ID format like 10011090_18687781
  const folder = "día 1"; // You might need to determine this dynamically
  
  // Get SAS token from environment variables
  const sasToken = process.env.AZURE_SAS_TOKEN;
  if (!sasToken) {
    throw new Error('Azure SAS token is not configured');
  }
  
  // You might need to determine the thumbnail filename based on the video name
  // This example assumes thumbnails are PNG with same base name as video
  const thumbnailFilename = videoName.replace('.mp4', '.png');
  
  return `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/sagathumbnails/${userId}/${encodeURIComponent(folder)}/images/${thumbnailFilename}?${sasToken}`;
} 