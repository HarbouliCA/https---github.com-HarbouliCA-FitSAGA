const fs = require('fs');
const csv = require('csv-parser');
const firebase = require('firebase/app');
require('firebase/database');

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD3MAuIYZ2dGq5hspUvxK4KeNIbVzw6EaQ",
  authDomain: "saga-fitness.firebaseapp.com",
  databaseURL: "https://saga-fitness.firebaseio.com",
  projectId: "saga-fitness",
  storageBucket: "saga-fitness.appspot.com",
  messagingSenderId: "360667066098",
  appId: "1:360667066098:web:93bef4a0c957968c67aa6b"
};

firebase.initializeApp(firebaseConfig);

function parseCsv(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

async function mergeAndUploadData() {
  try {
    // Parse both CSV files with correct paths
    const mappedMetadata = await parseCsv('./mapped-metadata.csv');
    const videoDetails = await parseCsv('./scripts/video_details_modified.csv');
    
    // Create a map to store merged data
    const mergedVideos = {};
    const plans = {};

    // Process the mapped-metadata.csv data
    mappedMetadata.forEach(item => {
      // Extract videoId from the path (e.g., "10011090/día 1/2023_cw003.mp4" -> "2023_cw003")
      const pathParts = item.path.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const videoId = fileName.split('.')[0];  // Remove file extension
      
      // Initialize or update the video entry
      if (!mergedVideos[videoId]) {
        mergedVideos[videoId] = {};
      }
      
      // Add metadata from mapped-metadata.csv
      mergedVideos[videoId].name = item.name;
      mergedVideos[videoId].path = item.path;
      mergedVideos[videoId].activity = item.activity;
      mergedVideos[videoId].type = item.type;
      mergedVideos[videoId].bodyPart = item.bodyPart;
      mergedVideos[videoId].description = item.description;
      mergedVideos[videoId].thumbnailUrl = item.thumbnailUrl;
    });

    // Process the video_details_modified.csv data
    videoDetails.forEach(item => {
      const videoId = item.videoId.split('.')[0];  // Remove file extension if present
      
      // Initialize if not already done
      if (!mergedVideos[videoId]) {
        mergedVideos[videoId] = {};
      }
      
      // Add metadata from video_details_modified.csv
      mergedVideos[videoId].thumbnailId = item.ThumbnailId;
      mergedVideos[videoId].thumbnailUrl = item.videoImg || mergedVideos[videoId].thumbnailUrl;
      mergedVideos[videoId].activity = item.videoactivity || mergedVideos[videoId].activity;
      mergedVideos[videoId].type = item.videotype || mergedVideos[videoId].type;
      mergedVideos[videoId].description = item.videodescription || mergedVideos[videoId].description;
      mergedVideos[videoId].plan_url = item.plan_url;
      mergedVideos[videoId].plan_id = item.plan_id;
      mergedVideos[videoId].day_id = item.day_id;
      mergedVideos[videoId].day_name = item.day_name;
      mergedVideos[videoId].thumbnailPath = item.ThumbnailPath;
      mergedVideos[videoId].videoPath = item.VideoPath;
      
      // Build the plans structure as well
      if (!plans[item.plan_id]) {
        plans[item.plan_id] = {
          name: `Plan ${item.plan_id}`,
          days: {}
        };
      }
      
      if (!plans[item.plan_id].days[item.day_id]) {
        plans[item.plan_id].days[item.day_id] = {
          name: item.day_name,
          videos: {}
        };
      }
      
      plans[item.plan_id].days[item.day_id].videos[videoId] = true;
    });

    // Upload to Firebase
    const db = firebase.database();
    await db.ref('videos').set(mergedVideos);
    await db.ref('plans').set(plans);
    
    console.log("Data successfully uploaded to Firebase!");
  } catch (error) {
    console.error("Error uploading data:", error);
  }
}

mergeAndUploadData(); 