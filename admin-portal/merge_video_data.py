import pandas as pd
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import logging
import os
from firebase_admin.firestore import AsyncClient
from concurrent.futures import TimeoutError
import time
from tqdm import tqdm  # For progress bar (pip install tqdm if needed)

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='video_metadata_update.log'
)

try:
    # Check if files exist
    if not os.path.exists('scripts/video_details_modified.csv'):
        raise FileNotFoundError("video_details_modified.csv not found")
    
    if not os.path.exists(r'D:\My Startup Projects\fitsaga\admin-portal\azure-thumbnails-result.csv'):
        raise FileNotFoundError("azure-thumbnails-result.csv not found")
    
    # Read both CSV files
    videos_df = pd.read_csv('scripts/video_details_modified.csv')
    thumbnails_df = pd.read_csv(r'D:\My Startup Projects\fitsaga\admin-portal\azure-thumbnails-result.csv')
    
    logging.info(f"Loaded {len(videos_df)} videos and {len(thumbnails_df)} thumbnails")
    
    # Print sample data from both dataframes
    logging.info("Sample video data:")
    logging.info(videos_df[['videoId', 'ThumbnailId']].head())

    logging.info("Sample thumbnail data:")
    logging.info(thumbnails_df[['videoId', 'thumbnailId']].head())

    # Check for format differences in IDs
    logging.info(f"Video IDs in videos_df: {videos_df['videoId'].iloc[0]} (type: {type(videos_df['videoId'].iloc[0])})")
    logging.info(f"Video IDs in thumbnails_df: {thumbnails_df['videoId'].iloc[0]} (type: {type(thumbnails_df['videoId'].iloc[0])})")
    
    # Replace with your actual path
    cred = credentials.Certificate(r'D:\My Startup Projects\fitsaga\admin-portal\scripts\credentials.json')
    
    # Rest of the code from Step 1...
    
    # Add counters for statistics
    updated_count = 0
    missing_thumbnail_count = 0
    
    # Add a function to clean video IDs consistently
    def clean_video_id(video_id):
        if pd.isna(video_id):
            return ""
        
        # Remove file extension
        if str(video_id).endswith('.mp4'):
            video_id = str(video_id).replace('.mp4', '')
        
        # Replace underscores with spaces (if needed)
        video_id = str(video_id).replace('_', ' ')
        
        return video_id.strip()

    # Clean video IDs in both dataframes
    videos_df['clean_videoId'] = videos_df['videoId'].apply(clean_video_id)
    thumbnails_df['clean_videoId'] = thumbnails_df['videoId'].apply(clean_video_id)

    # Now merge using the cleaned IDs
    final_df = pd.merge(
        videos_df,
        thumbnails_df,
        on='clean_videoId',  # Use the cleaned IDs for merging
        how='left',
        suffixes=('', '_thumbnail')
    )

    # Initialize Firebase
    firebase_admin.initialize_app(cred)
    db = firestore.client()

    # After initializing Firebase but before the processing loop:
    logging.info(f"Starting to process {len(final_df)} videos...")

    # Add a progress bar
    for index, row in tqdm(final_df.iterrows(), total=len(final_df), desc="Updating videos"):
        try:
            # Find the document ID that matches your Firebase structure
            document_id = row['videoId']  # or row['name'] depending on your structure
            
            # Add debug logging
            logging.info(f"Processing video {index+1}/{len(final_df)}: {document_id}")
            
            # Update the correct collection with timeout
            video_ref = db.collection('videoMetadata').document(document_id)
            
            # Set a timeout for the operation (5 seconds)
            start_time = time.time()
            max_wait = 5  # seconds
            
            try:
                video_ref.update({
                    'thumbnailUrl': row.get('thumbnailUrl', ''),
                    # Other fields...
                })
                
                # If the update takes too long, log a warning
                elapsed = time.time() - start_time
                if elapsed > 2:  # If it took more than 2 seconds
                    logging.warning(f"Update for {document_id} took {elapsed:.2f} seconds")
                    
            except Exception as e:
                logging.error(f"Error updating video {document_id}: {str(e)}")
                # Continue to the next video
                continue
                
            updated_count += 1
            if pd.isna(row['thumbnailUrl']):
                missing_thumbnail_count += 1
                
            # Add a small delay between updates to avoid overwhelming Firebase
            time.sleep(0.1)
                
        except Exception as e:
            logging.error(f"Error processing row {index}: {str(e)}")
    
    logging.info(f"Update complete. Updated {updated_count} videos. {missing_thumbnail_count} videos missing thumbnails.")
    
    # After merging
    logging.info(f"Merged dataframe has {len(final_df)} rows")
    logging.info(f"Number of rows with empty thumbnailUrl: {final_df['thumbnailUrl'].isna().sum()}")
    
except Exception as e:
    logging.error(f"Script failed: {str(e)}") 