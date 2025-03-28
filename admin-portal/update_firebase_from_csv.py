import pandas as pd
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import logging
import time
import os
from tqdm import tqdm
import sys

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='firebase_update.log'
)

# Also log to console
console = logging.StreamHandler()
console.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
console.setFormatter(formatter)
logging.getLogger('').addHandler(console)

# Log script start
logging.info("=" * 50)
logging.info("SCRIPT STARTED: Firebase Video Metadata Update")
logging.info("=" * 50)

try:
    # Check if CSV file exists
    csv_path = 'merged_video_data.csv'
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"CSV file not found: {csv_path}")

    # Read CSV file
    logging.info(f"Reading CSV file: {csv_path}")
    df = pd.read_csv(csv_path)
    
    # Display basic info about the data
    logging.info(f"Loaded {len(df)} rows from CSV")
    logging.info(f"CSV columns: {', '.join(df.columns)}")
    logging.info(f"Sample data (first 2 rows):")
    logging.info(df.head(2).to_string())
    
    # Check for required columns
    required_columns = ['thumbnailId', 'videoId_x', 'activity', 'type', 'bodypart', 
                        'plan_id', 'day_id', 'videourl', 'thumbnailUrl']
    
    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        raise ValueError(f"Missing required columns in CSV: {', '.join(missing_columns)}")
    
    # Initialize Firebase
    logging.info("Initializing Firebase connection...")
    cred_path = r'D:\My Startup Projects\fitsaga\admin-portal\scripts\credentials.json'
    
    if not os.path.exists(cred_path):
        raise FileNotFoundError(f"Firebase credentials file not found: {cred_path}")
    
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    
    # Confirm with user before proceeding
    print("\n" + "!" * 80)
    print("WARNING: This script will DELETE ALL DOCUMENTS in the videoMetadata collection")
    print("and replace them with data from the CSV file.")
    print("!" * 80)
    
    confirmation = input("\nType 'DELETE' to confirm deletion and proceed: ")
    if confirmation != "DELETE":
        print("Operation cancelled by user.")
        sys.exit(0)
    
    # Step 1: Delete all documents in the videoMetadata collection
    logging.info("Deleting all documents in videoMetadata collection...")
    
    # Get all documents
    docs = db.collection('videoMetadata').get()
    doc_count = len(list(docs))
    logging.info(f"Found {doc_count} documents to delete")
    
    # Delete in batches
    batch_size = 500
    deleted_count = 0
    
    # Get all documents again (since the previous get() consumed the iterator)
    docs = db.collection('videoMetadata').get()
    
    with tqdm(total=doc_count, desc="Deleting documents") as pbar:
        batch = db.batch()
        batch_count = 0
        
        for doc in docs:
            batch.delete(doc.reference)
            batch_count += 1
            deleted_count += 1
            
            # Commit batch when it reaches the batch size
            if batch_count >= batch_size:
                batch.commit()
                logging.info(f"Deleted batch of {batch_count} documents")
                pbar.update(batch_count)
                batch = db.batch()
                batch_count = 0
                time.sleep(1)  # Avoid overwhelming Firestore
        
        # Commit any remaining documents
        if batch_count > 0:
            batch.commit()
            logging.info(f"Deleted final batch of {batch_count} documents")
            pbar.update(batch_count)
    
    logging.info(f"Successfully deleted {deleted_count} documents")
    
    # Step 2: Add new documents from CSV
    logging.info("Adding new documents from CSV data...")
    
    # Process in batches
    batch_size = 500
    total_rows = len(df)
    added_count = 0
    error_count = 0
    
    with tqdm(total=total_rows, desc="Adding documents") as pbar:
        for i in range(0, total_rows, batch_size):
            batch_df = df.iloc[i:min(i+batch_size, total_rows)]
            batch = db.batch()
            batch_count = 0
            
            for _, row in batch_df.iterrows():
                try:
                    # Create a unique document ID
                    doc_id = f"{row['plan_id']}_{row['day_id']}_{row['videoId_x']}"
                    
                    # Create document reference
                    doc_ref = db.collection('videoMetadata').document(doc_id)
                    
                    # Prepare document data
                    doc_data = {
                        'activity': row['activity'],
                        'bodypart': row['bodypart'],
                        'dayId': str(row['day_id']),
                        'dayName': row['day_name'] if 'day_name' in row else row.get('dayName', ''),
                        'planId': str(row['plan_id']),
                        'thumbnailId': str(row['thumbnailId']),
                        'thumbnailUrl': row['thumbnailUrl'],
                        'type': row['type'],
                        'videoId': row['videoId_x'],
                        'videoUrl': row['videourl'],
                        'lastUpdated': firestore.SERVER_TIMESTAMP
                    }
                    
                    # Add document to batch
                    batch.set(doc_ref, doc_data)
                    batch_count += 1
                    
                except Exception as e:
                    logging.error(f"Error processing row: {e}")
                    error_count += 1
            
            # Commit batch
            if batch_count > 0:
                try:
                    batch.commit()
                    added_count += batch_count
                    logging.info(f"Added batch of {batch_count} documents")
                except Exception as e:
                    logging.error(f"Error committing batch: {e}")
                    error_count += batch_count
            
            pbar.update(len(batch_df))
            time.sleep(1)  # Avoid overwhelming Firestore
    
    # Final statistics
    logging.info("=" * 50)
    logging.info("SCRIPT COMPLETED: Firebase Video Metadata Update")
    logging.info("=" * 50)
    logging.info(f"Final statistics:")
    logging.info(f"- Documents deleted: {deleted_count}")
    logging.info(f"- Documents added: {added_count}")
    logging.info(f"- Errors encountered: {error_count}")
    
    if added_count == total_rows - error_count:
        logging.info("SUCCESS: All valid rows were successfully added to Firebase")
    else:
        logging.warning(f"WARNING: Only {added_count} out of {total_rows} rows were added")

except Exception as e:
    logging.error(f"Script failed: {str(e)}")
    logging.exception("Detailed error information:") 