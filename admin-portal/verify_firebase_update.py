import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
import pandas as pd
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

try:
    # Read CSV for comparison
    csv_path = 'merged_video_data.csv'
    df = pd.read_csv(csv_path)
    csv_count = len(df)
    
    # Initialize Firebase
    cred_path = r'D:\My Startup Projects\fitsaga\admin-portal\scripts\credentials.json'
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    
    # Count documents in videoMetadata collection
    collection_ref = db.collection('videoMetadata')
    docs_count = len(list(collection_ref.get()))
    
    logging.info(f"CSV contains {csv_count} rows")
    logging.info(f"Firebase collection contains {docs_count} documents")
    
    # Check if counts match
    if docs_count == csv_count:
        logging.info("SUCCESS: Document count matches CSV row count")
    else:
        logging.warning(f"WARNING: Document count ({docs_count}) does not match CSV row count ({csv_count})")
    
    # Sample check - verify a few random documents
    sample_size = min(5, csv_count)
    sample_indices = [int(i * (csv_count / sample_size)) for i in range(sample_size)]
    
    for idx in sample_indices:
        row = df.iloc[idx]
        doc_id = f"{row['plan_id']}_{row['day_id']}_{row['videoId_x']}"
        doc = db.collection('videoMetadata').document(doc_id).get()
        
        if doc.exists:
            doc_data = doc.to_dict()
            logging.info(f"Document {doc_id} exists")
            
            # Check a few key fields
            if doc_data['videoId'] == row['videoId_x'] and doc_data['thumbnailUrl'] == row['thumbnailUrl']:
                logging.info(f"Document {doc_id} data matches CSV")
            else:
                logging.warning(f"Document {doc_id} data does not match CSV")
        else:
            logging.warning(f"Document {doc_id} does not exist")
    
    print("Verification completed")

except Exception as e:
    logging.error(f"Verification failed: {str(e)}")
    logging.exception("Detailed error information:") 