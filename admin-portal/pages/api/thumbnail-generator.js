import fs from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';
import fetch from 'node-fetch';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';
import extractFrames from 'ffmpeg-extract-frames';

// Use the installed ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath.path);

// Promisify fs functions
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);

// Create a cache directory
const CACHE_DIR = path.join(os.tmpdir(), 'fitsaga-thumbnails');

// Ensure cache directory exists
try {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
} catch (error) {
  console.error('Error creating cache directory:', error);
}

export default async function handler(req, res) {
  try {
    const { videoId } = req.query;
    
    if (!videoId) {
      return res.status(400).json({ error: 'videoId parameter is required' });
    }
    
    console.log(`Generating thumbnail for video: ${videoId}`);
    
    // Check cache first
    const cacheKey = videoId.replace(/[^a-zA-Z0-9]/g, '_');
    const thumbnailPath = path.join(CACHE_DIR, `${cacheKey}.jpg`);
    
    // If thumbnail exists in cache, serve it
    if (fs.existsSync(thumbnailPath)) {
      console.log(`Serving cached thumbnail for ${videoId}`);
      const thumbnail = fs.readFileSync(thumbnailPath);
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      return res.status(200).send(thumbnail);
    }
    
    // Get the video URL from our video-proxy
    const host = req.headers.host || 'localhost:3000';
    const protocol = host.startsWith('localhost') ? 'http' : 'https';
    const videoProxyUrl = `${protocol}://${host}/api/video-proxy?videoId=${encodeURIComponent(videoId)}`;
    console.log(`Fetching video from: ${videoProxyUrl}`);
    
    // Fetch video from proxy
    const videoResponse = await fetch(videoProxyUrl);
    
    if (!videoResponse.ok) {
      console.error(`Failed to fetch video: ${videoResponse.status} ${videoResponse.statusText}`);
      return res.status(videoResponse.status).json({ 
        error: 'Failed to fetch video', 
        details: videoResponse.statusText 
      });
    }
    
    // Create temp file paths
    const tempVideoPath = path.join(CACHE_DIR, `${cacheKey}_temp.mp4`);
    
    // Save video to temp file
    const videoBuffer = await videoResponse.buffer();
    await writeFile(tempVideoPath, videoBuffer);
    
    console.log(`Video saved to temp file: ${tempVideoPath}`);
    
    try {
      // Extract frame at 1 second
      await extractFrames({
        input: tempVideoPath,
        output: thumbnailPath,
        offsets: [1000], // 1 second into the video
        size: '480x?'    // 480px width, maintain aspect ratio
      });
      
      console.log(`Thumbnail created at: ${thumbnailPath}`);
      
      // Check if the thumbnail was created
      if (!fs.existsSync(thumbnailPath)) {
        throw new Error('Thumbnail extraction failed');
      }
      
      // Clean up temp video file
      await unlink(tempVideoPath);
      
      // Serve the generated thumbnail
      const thumbnail = fs.readFileSync(thumbnailPath);
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      return res.status(200).send(thumbnail);
      
    } catch (extractError) {
      console.error('Error extracting thumbnail:', extractError);
      
      // Clean up temp file
      try {
        if (fs.existsSync(tempVideoPath)) {
          await unlink(tempVideoPath);
        }
      } catch (unlinkError) {
        console.error('Error cleaning up temp file:', unlinkError);
      }
      
      // Return error response
      return res.status(500).json({ 
        error: 'Failed to generate thumbnail', 
        details: extractError.message 
      });
    }
    
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return res.status(500).json({ 
      error: 'Error processing thumbnail request', 
      details: error.message 
    });
  }
} 