const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

// Paths
const videoDetailsPath = process.argv[2] || './scripts/video_details.csv';
const metadataPath = process.argv[3] || './complete-metadata.csv';
const outputPath = process.argv[4] || './mapped-metadata.csv';
const baseDirectory = process.argv[5] || './src/assets/videofitness';

// Debug mode
const DEBUG = true;

async function mapThumbnails() {
  console.log(`Starting thumbnail mapping process...`);
  
  // Check if files exist
  if (!fs.existsSync(videoDetailsPath)) {
    console.error(`Video details file ${videoDetailsPath} does not exist.`);
    process.exit(1);
  }
  
  if (!fs.existsSync(metadataPath)) {
    console.error(`Metadata file ${metadataPath} does not exist.`);
    process.exit(1);
  }
  
  // Step 1: Create thumbnail map from video_details.csv
  console.log(`Reading thumbnail details from ${videoDetailsPath}...`);
  const thumbnailMap = new Map();
  const videoDetails = [];
  
  await new Promise((resolve, reject) => {
    fs.createReadStream(videoDetailsPath)
      .pipe(csvParser())
      .on('data', (data) => videoDetails.push(data))
      .on('end', resolve)
      .on('error', reject);
  });
  
  console.log(`Read ${videoDetails.length} rows from video details CSV`);
  
  // Process video details to build the mapping: videovalue -> thumbnailId
  let mappingCount = 0;
  for (const row of videoDetails) {
    const videoId = row.videoId ? row.videoId.split('_')[0] : null;
    const videoFilename = row.videovalue; // e.g., 2023_sid0012.mp4
    
    if (videoId && videoFilename) {
      // Remove extension if present
      const videoName = videoFilename.includes('.') 
        ? videoFilename.substring(0, videoFilename.lastIndexOf('.'))
        : videoFilename;
      
      // Store both with underscore and with space
      thumbnailMap.set(videoName, videoId); // 2023_sid0012 -> 3132855805
      
      // Also store with space for direct matching
      const videoNameWithSpace = videoName.replace(/_/g, ' '); // 2023 sid0012
      thumbnailMap.set(videoNameWithSpace, videoId);
      
      mappingCount++;
    }
  }
  
  console.log(`Created ${mappingCount} video->thumbnail mappings`);
  
  if (DEBUG) {
    console.log('Example mappings:');
    let count = 0;
    for (const [key, value] of thumbnailMap.entries()) {
      if (count++ < 10) console.log(`${key} -> ${value}`);
    }
  }
  
  // Step 2: Read and process the metadata CSV
  console.log(`Reading metadata from ${metadataPath}...`);
  
  // Read the content as a string
  const metadataContent = fs.readFileSync(metadataPath, 'utf8');
  
  // Parse the CSV
  const metadataRecords = parse(metadataContent, {
    columns: true,
    skip_empty_lines: true
  });
  
  console.log(`Read ${metadataRecords.length} rows from metadata CSV`);
  
  // Step 3: Find all image directories
  console.log(`Scanning for image directories in ${baseDirectory}...`);
  const imageDirectories = new Map();
  
  function findImageDirectories(dir) {
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (item.toLowerCase() === 'images') {
            // Store the parent directory -> path to images folder
            const parentDir = path.dirname(fullPath);
            imageDirectories.set(parentDir, fullPath);
          } else {
            findImageDirectories(fullPath);
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dir}: ${error.message}`);
    }
  }
  
  findImageDirectories(baseDirectory);
  console.log(`Found ${imageDirectories.size} image directories`);
  
  // Step 4: Update the metadata with thumbnail paths
  console.log(`Mapping thumbnails to videos...`);
  
  let thumbnailsFoundCount = 0;
  let thumbnailsNotFoundCount = 0;
  let missingThumbnailIds = 0;
  let missingImageDirs = 0;
  let missingThumbnailFiles = 0;
  
  for (const record of metadataRecords) {
    // Skip if already has a thumbnail URL with http
    if (record.thumbnailUrl && record.thumbnailUrl.toLowerCase().startsWith('http')) {
      continue;
    }
    
    // Skip if already has a valid thumbnail path
    if (record.thumbnailUrl && record.thumbnailUrl.trim() !== '') {
      const thumbnailPath = path.join(baseDirectory, record.thumbnailUrl);
      if (fs.existsSync(thumbnailPath)) {
        thumbnailsFoundCount++;
        continue;
      }
    }
    
    // Try to get the thumbnail ID directly from the name (with space)
    const videoNameWithSpaces = record.name;
    let thumbnailId = thumbnailMap.get(videoNameWithSpaces);
    
    // If not found, try with underscores
    if (!thumbnailId) {
      const videoNameWithUnderscores = videoNameWithSpaces.replace(/ /g, '_');
      thumbnailId = thumbnailMap.get(videoNameWithUnderscores);
    }
    
    if (!thumbnailId) {
      if (DEBUG && missingThumbnailIds < 5) {
        console.log(`No thumbnail ID found for video: ${videoNameWithSpaces}`);
        missingThumbnailIds++;
      }
      thumbnailsNotFoundCount++;
      continue;
    }
    
    // Get the video path and extract the directory
    const videoPath = record.path;
    const videoDir = path.dirname(videoPath);
    const fullVideoDir = path.join(baseDirectory, videoDir);
    
    // Find the image directory for this video
    let imageDir = null;
    for (const [dirPath, imagePath] of imageDirectories.entries()) {
      if (fullVideoDir.includes(dirPath)) {
        imageDir = imagePath;
        break;
      }
    }
    
    if (!imageDir) {
      if (DEBUG && missingImageDirs < 5) {
        console.log(`No image directory found for video: ${videoNameWithSpaces} in ${videoDir}`);
        missingImageDirs++;
      }
      thumbnailsNotFoundCount++;
      continue;
    }
    
    // Search for the thumbnail file
    const possibleExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    let thumbnailFound = false;
    
    for (const ext of possibleExtensions) {
      const thumbnailFileName = `${thumbnailId}${ext}`;
      const thumbnailPath = path.join(imageDir, thumbnailFileName);
      
      if (fs.existsSync(thumbnailPath)) {
        // Update the record with the relative path
        const relativePath = path.relative(baseDirectory, thumbnailPath).replace(/\\/g, '/');
        record.thumbnailUrl = relativePath;
        thumbnailFound = true;
        thumbnailsFoundCount++;
        
        if (DEBUG && thumbnailsFoundCount <= 5) {
          console.log(`Found thumbnail for ${videoNameWithSpaces}: ${relativePath}`);
        }
        break;
      }
    }
    
    if (!thumbnailFound) {
      if (DEBUG && missingThumbnailFiles < 5) {
        console.log(`Thumbnail file not found for video: ${videoNameWithSpaces} with ID: ${thumbnailId} in ${imageDir}`);
        missingThumbnailFiles++;
      }
      thumbnailsNotFoundCount++;
    }
  }
  
  console.log(`Thumbnail mapping results:`);
  console.log(`- Found thumbnails: ${thumbnailsFoundCount}`);
  console.log(`- Missing thumbnails: ${thumbnailsNotFoundCount}`);
  console.log(`- Missing breakdown:`);
  console.log(`  - Missing thumbnail IDs: ${missingThumbnailIds}`);
  console.log(`  - Missing image directories: ${missingImageDirs}`);
  console.log(`  - Missing thumbnail files: ${missingThumbnailFiles}`);
  
  // Step 5: Write the updated metadata to a new CSV file
  console.log(`Writing updated metadata to ${outputPath}...`);
  
  const csvOutput = stringify(metadataRecords, { header: true });
  fs.writeFileSync(outputPath, csvOutput);
  
  console.log(`Mapping complete. You can now use upload-thumbnails.js with the new metadata file.`);
}

mapThumbnails().catch(error => {
  console.error('Unhandled error:', error.message);
  process.exit(1);
}); 