const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');

// Load from .env.local
dotenv.config({ path: '.env.local' });

// Local directory containing videos
const videoDirectory = process.argv[2] || './videos';
const outputFile = process.argv[3] || './video-metadata.csv';

// Escape CSV field to handle special characters
function escapeCsvField(field) {
  // If the field contains commas, quotes, or newlines, wrap it in quotes
  if (field && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
    // Double any existing quotes
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

function generateMetadata() {
  console.log(`Generating metadata from ${videoDirectory}...`);
  
  // Validate video directory
  if (!fs.existsSync(videoDirectory)) {
    console.error(`Directory ${videoDirectory} does not exist.`);
    process.exit(1);
  }
  
  try {
    // Get all video files recursively
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
    
    if (videoFiles.length === 0) {
      console.log('No video files found. Exiting.');
      return;
    }
    
    // CSV header
    const csvHeader = 'name,path,activity,type,bodyPart,thumbnailUrl\n';
    
    // Generate CSV rows
    const csvRows = videoFiles.map(filePath => {
      const relativePath = path.relative(videoDirectory, filePath).replace(/\\/g, '/');
      const filename = path.basename(filePath);
      const name = path.basename(filename, path.extname(filename))
        .replace(/_/g, ' ')
        .replace(/-/g, ' ');
      
      // Extract metadata from folder structure (assuming structure like activity/type/bodyPart/file.mp4)
      const pathParts = relativePath.split('/');
      const activity = pathParts.length > 1 ? pathParts[0] : 'Unknown';
      const type = pathParts.length > 2 ? pathParts[1] : 'Unknown';
      const bodyPart = pathParts.length > 3 ? pathParts[2] : 'Unknown';
      
      // Generate a unique ID
      const id = uuidv4();
      
      // No thumbnail URL by default
      const thumbnailUrl = '';
      
      // Escape all fields to handle special characters
      return [
        escapeCsvField(name),
        escapeCsvField(relativePath),
        escapeCsvField(activity),
        escapeCsvField(type),
        escapeCsvField(bodyPart),
        thumbnailUrl
      ].join(',');
    });
    
    // Write to CSV file
    fs.writeFileSync(outputFile, csvHeader + csvRows.join('\n'));
    
    console.log(`Metadata CSV generated at ${outputFile} with ${videoFiles.length} entries.`);
    console.log(`You can now import this file at /dashboard/admin/videos`);
  } catch (error) {
    console.error('Error generating metadata:', error?.message || String(error));
    process.exit(1);
  }
}

generateMetadata(); 