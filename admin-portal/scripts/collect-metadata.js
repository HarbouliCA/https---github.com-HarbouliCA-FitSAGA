const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
const csvParser = require('csv-parser');

dotenv.config({ path: '.env.local' });

// Root directory containing videos and metadata
const videoDirectory = process.argv[2] || './src/assets/videofitness';
const outputFile = process.argv[3] || './complete-metadata.csv';
const videoDetailsFile = process.argv[4] || './scripts/video_details.csv';

// CSV header matching what we need for import
const csvHeader = 'name,path,activity,type,bodyPart,description,thumbnailUrl\n';

// Escape CSV field to handle special characters
function escapeCsvField(field) {
  if (!field) return '';
  // If the field contains commas, quotes, or newlines, wrap it in quotes
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    // Double any existing quotes
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

async function collectMetadata() {
  console.log(`Collecting metadata from ${videoDirectory}...`);
  
  // Validate directory
  if (!fs.existsSync(videoDirectory)) {
    console.error(`Directory ${videoDirectory} does not exist.`);
    process.exit(1);
  }
  
  try {
    // Read video_details.csv to get thumbnail mapping
    const thumbnailMap = new Map(); // Map to store video_name -> thumbnail_id
    
    if (fs.existsSync(videoDetailsFile)) {
      console.log(`Reading thumbnail mapping from ${videoDetailsFile}...`);
      
      const results = [];
      fs.createReadStream(videoDetailsFile)
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          results.forEach(row => {
            const videoId = row.videoId ? row.videoId.split('_')[0] : null;
            const videoName = row.videovalue;
            if (videoId && videoName) {
              thumbnailMap.set(videoName, videoId);
            }
          });
          console.log(`Found ${thumbnailMap.size} thumbnail mappings`);
        });
        
      // Wait for CSV parsing to complete (simple approach)
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      console.warn(`Warning: Thumbnail mapping file ${videoDetailsFile} not found.`);
    }
    
    // Get all metadata.csv files
    const metadataFiles = [];
    
    function findMetadataFiles(dir) {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          findMetadataFiles(fullPath);
        } else if (item.toLowerCase() === 'metadata.csv') {
          metadataFiles.push(fullPath);
        }
      }
    }
    
    findMetadataFiles(videoDirectory);
    console.log(`Found ${metadataFiles.length} metadata files.`);
    
    // Process each metadata file
    const metadataMap = new Map(); // Map to store video_name -> metadata
    
    for (const file of metadataFiles) {
      const dirPath = path.dirname(file);
      const data = fs.readFileSync(file, 'utf8');
      const lines = data.split('\n');
      
      // Skip header
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const parts = lines[i].split(',');
        if (parts.length < 3) continue;
        
        const video_name = parts[0].trim();
        const activity = parts[1].trim();
        const type = parts[2].trim();
        // Join the rest for description (in case it contains commas)
        const description = parts.slice(3).join(',').trim();
        
        if (!video_name) continue;
        
        // Calculate the path relative to the video directory root
        const videoPath = path.join(dirPath, video_name);
        const relativePath = path.relative(videoDirectory, videoPath).replace(/\\/g, '/');
        
        metadataMap.set(relativePath, {
          video_name,
          activity,
          type,
          description,
          dirPath
        });
      }
    }
    
    console.log(`Processed metadata for ${metadataMap.size} videos.`);
    
    // Find all image directories
    const imageDirectories = new Map(); // Path -> image dir
    
    function findImageDirectories(dir) {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (item.toLowerCase() === 'images') {
            // Store the parent directory as key
            const parentDir = path.dirname(fullPath);
            imageDirectories.set(parentDir, fullPath);
          } else {
            findImageDirectories(fullPath);
          }
        }
      }
    }
    
    findImageDirectories(videoDirectory);
    console.log(`Found ${imageDirectories.size} image directories.`);
    
    // Get all video files
    const getAllVideoFiles = (dirPath, arrayOfFiles = []) => {
      const files = fs.readdirSync(dirPath);
      
      files.forEach((file) => {
        const filePath = path.join(dirPath, file);
        if (fs.statSync(filePath).isDirectory()) {
          arrayOfFiles = getAllVideoFiles(filePath, arrayOfFiles);
        } else {
          // Only include video files
          const ext = path.extname(filePath).toLowerCase();
          if (['.mp4', '.mov', '.avi', '.wmv', '.mkv'].includes(ext)) {
            arrayOfFiles.push(filePath);
          }
        }
      });
      
      return arrayOfFiles;
    };
    
    const videoFiles = getAllVideoFiles(videoDirectory);
    console.log(`Found ${videoFiles.length} video files.`);
    
    // Generate CSV rows
    const csvRows = videoFiles.map(filePath => {
      const relativePath = path.relative(videoDirectory, filePath).replace(/\\/g, '/');
      const filename = path.basename(filePath);
      const name = path.basename(filename, path.extname(filename))
        .replace(/_/g, ' ')
        .replace(/-/g, ' ');
      
      // Extract folder structure for default values
      const pathParts = path.dirname(relativePath).split(path.sep);
      const defaultActivity = pathParts.length > 0 ? pathParts[0] : 'Unknown';
      const defaultType = pathParts.length > 1 ? pathParts[1] : 'Unknown';
      const defaultBodyPart = 'Unknown';
      
      // Look up metadata from the map
      const metadata = metadataMap.get(relativePath);
      
      const activity = metadata?.activity || defaultActivity;
      const type = metadata?.type || defaultType;
      const bodyPart = metadata?.description?.split(',')[0] || defaultBodyPart;
      const description = metadata?.description || '';
      
      // Look up thumbnail
      let thumbnailUrl = '';
      const thumbnailId = thumbnailMap.get(filename);
      
      if (thumbnailId) {
        const videoDir = path.dirname(filePath);
        // Check if this directory has an images subdirectory
        const imageDir = imageDirectories.get(videoDir);
        
        if (imageDir) {
          // Check if the thumbnail file exists (check multiple extensions)
          const possibleExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
          for (const ext of possibleExtensions) {
            const thumbnailPath = path.join(imageDir, `${thumbnailId}${ext}`);
            if (fs.existsSync(thumbnailPath)) {
              thumbnailUrl = path.relative(videoDirectory, thumbnailPath).replace(/\\/g, '/');
              break;
            }
          }
        }
      }
      
      // Generate a unique ID
      const id = uuidv4();
      
      // Escape all fields to handle special characters
      return [
        escapeCsvField(name),
        escapeCsvField(relativePath),
        escapeCsvField(activity),
        escapeCsvField(type),
        escapeCsvField(bodyPart),
        escapeCsvField(description),
        escapeCsvField(thumbnailUrl)
      ].join(',');
    });
    
    // Write to CSV file
    fs.writeFileSync(outputFile, csvHeader + csvRows.join('\n'));
    
    console.log(`Complete metadata CSV generated at ${outputFile} with ${videoFiles.length} entries.`);
    console.log(`You can now import this file at /dashboard/admin/videos`);
  } catch (error) {
    console.error('Error collecting metadata:', error?.message || String(error));
    process.exit(1);
  }
}

collectMetadata(); 