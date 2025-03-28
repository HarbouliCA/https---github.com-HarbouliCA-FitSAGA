import pandas as pd
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import logging
import time
import os
from tqdm import tqdm

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='video_metadata_update.log'
)

# Also log to console
console = logging.StreamHandler()
console.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
console.setFormatter(formatter)
logging.getLogger('').addHandler(console)

# Log script start
logging.info("=" * 50)
logging.info("SCRIPT STARTED: Video Metadata Update")
logging.info("=" * 50)

try:
    # Check if files exist
    if not os.path.exists('scripts/video_details_modified.csv'):
        raise FileNotFoundError("video_details_modified.csv not found")

    if not os.path.exists(r'D:\My Startup Projects\fitsaga\admin-portal\azure-thumbnails-result.csv'):
        raise FileNotFoundError("azure-thumbnails-result.csv not found")

    # Read both CSV files
    logging.info("Reading CSV files...")
    videos_df = pd.read_csv('scripts/video_details_modified.csv')
    thumbnails_df = pd.read_csv(r'D:\My Startup Projects\fitsaga\admin-portal\azure-thumbnails-result.csv')
    
    logging.info(f"Loaded {len(videos_df)} videos and {len(thumbnails_df)} thumbnails")
    
    # Print sample data from both dataframes
    logging.info("Sample video data:")
    logging.info(videos_df[['videoId', 'ThumbnailId']].head())

    logging.info("Sample thumbnail data:")
    logging.info(thumbnails_df[['videoId', 'thumbnailId']].head())

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
    logging.info("Cleaning video IDs...")
    videos_df['clean_videoId'] = videos_df['videoId'].apply(clean_video_id)
    thumbnails_df['clean_videoId'] = thumbnails_df['videoId'].apply(clean_video_id)

    # Now merge using the cleaned IDs
    logging.info("Merging dataframes...")
    final_df = pd.merge(
        videos_df,
        thumbnails_df,
        on='clean_videoId',  # Use the cleaned IDs for merging
        how='left',
        suffixes=('', '_thumbnail')
    )
    
    # Log merge statistics
    logging.info(f"Merged dataframe has {len(final_df)} rows")
    missing_thumbnails = final_df['thumbnailUrl'].isna().sum()
    logging.info(f"Number of rows with empty thumbnailUrl: {missing_thumbnails} ({missing_thumbnails/len(final_df)*100:.1f}%)")

    # Initialize Firebase
    logging.info("Initializing Firebase connection...")
    cred = credentials.Certificate(r'D:\My Startup Projects\fitsaga\admin-portal\scripts\credentials.json')
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    logging.info("Firebase connection established")

    # Add counters for statistics
    updated_count = 0
    missing_thumbnail_count = 0
    error_count = 0
    skipped_count = 0

    # Process in batches
    BATCH_SIZE = 20
    TOTAL_VIDEOS = len(final_df)
    TOTAL_BATCHES = (TOTAL_VIDEOS - 1) // BATCH_SIZE + 1
    
    logging.info(f"Starting to process {TOTAL_VIDEOS} videos in {TOTAL_BATCHES} batches (batch size: {BATCH_SIZE})")
    
    # Create a progress bar
    with tqdm(total=TOTAL_VIDEOS, desc="Overall Progress") as pbar:
        for batch_start in range(0, TOTAL_VIDEOS, BATCH_SIZE):
            batch_end = min(batch_start + BATCH_SIZE, TOTAL_VIDEOS)
            batch_num = batch_start // BATCH_SIZE + 1
            
            logging.info(f"=" * 30)
            logging.info(f"BATCH {batch_num}/{TOTAL_BATCHES} (videos {batch_start+1}-{batch_end})")
            logging.info(f"=" * 30)
            
            batch_df = final_df.iloc[batch_start:batch_end]
            batch_updated = 0
            batch_errors = 0
            batch_missing = 0
            batch_skipped = 0
            
            batch_start_time = time.time()
            
            for index, row in batch_df.iterrows():
                try:
                    # Find the document ID that matches your Firebase structure
                    document_id = row['videoId']  # or row['name'] depending on your structure
                    
                    # Add debug logging
                    logging.info(f"Processing video {index+1}/{len(final_df)}: {document_id}")
                    
                    # Check if thumbnailUrl exists
                    if pd.isna(row.get('thumbnailUrl', '')):
                        logging.warning(f"No thumbnail URL found for video {document_id}")
                        batch_missing += 1
                        missing_thumbnail_count += 1
                        # Still update to ensure we're setting empty string
                    
                    # Update the correct collection with timeout
                    video_ref = db.collection('videoMetadata').document(document_id)
                    
                    # Set a timeout for the operation
                    start_time = time.time()
                    
                    try:
                        # Log what we're updating
                        thumbnail_url = row.get('thumbnailUrl', '')
                        logging.info(f"Updating {document_id} with thumbnail URL: {thumbnail_url[:30]}{'...' if len(thumbnail_url) > 30 else ''}")
                        
                        video_ref.update({
                            'thumbnailUrl': thumbnail_url,
                            # Other fields...
                        })
                        
                        # If the update takes too long, log a warning
                        elapsed = time.time() - start_time
                        if elapsed > 2:  # If it took more than 2 seconds
                            logging.warning(f"Update for {document_id} took {elapsed:.2f} seconds")
                        
                        batch_updated += 1
                        updated_count += 1
                        
                    except Exception as e:
                        logging.error(f"Error updating video {document_id}: {str(e)}")
                        batch_errors += 1
                        error_count += 1
                        continue
                    
                    # Add a small delay between updates to avoid overwhelming Firebase
                    time.sleep(0.1)
                    
                except Exception as e:
                    logging.error(f"Error processing row {index}: {str(e)}")
                    batch_errors += 1
                    error_count += 1
            
            # Batch completion stats
            batch_time = time.time() - batch_start_time
            logging.info(f"Batch {batch_num} completed in {batch_time:.2f} seconds")
            logging.info(f"Batch stats: {batch_updated} updated, {batch_missing} missing thumbnails, {batch_errors} errors, {batch_skipped} skipped")
            
            # Overall progress
            progress_pct = min(100, (batch_end / TOTAL_VIDEOS) * 100)
            logging.info(f"Overall progress: {progress_pct:.1f}% ({batch_end}/{TOTAL_VIDEOS} videos processed)")
            logging.info(f"Running totals: {updated_count} updated, {missing_thumbnail_count} missing thumbnails, {error_count} errors, {skipped_count} skipped")
            
            # Update progress bar
            pbar.update(len(batch_df))
            
            # Add a longer pause between batches
            logging.info(f"Pausing for 2 seconds before next batch...")
            time.sleep(2)

    # Final statistics
    logging.info("=" * 50)
    logging.info("SCRIPT COMPLETED: Video Metadata Update")
    logging.info("=" * 50)
    logging.info(f"Final statistics:")
    logging.info(f"- Total videos processed: {TOTAL_VIDEOS}")
    logging.info(f"- Successfully updated: {updated_count} ({updated_count/TOTAL_VIDEOS*100:.1f}%)")
    logging.info(f"- Videos missing thumbnails: {missing_thumbnail_count} ({missing_thumbnail_count/TOTAL_VIDEOS*100:.1f}%)")
    logging.info(f"- Errors encountered: {error_count} ({error_count/TOTAL_VIDEOS*100:.1f}%)")
    logging.info(f"- Videos skipped: {skipped_count} ({skipped_count/TOTAL_VIDEOS*100:.1f}%)")

except Exception as e:
    logging.error(f"Script failed: {str(e)}")
    logging.exception("Detailed error information:") 