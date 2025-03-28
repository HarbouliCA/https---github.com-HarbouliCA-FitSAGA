import pandas as pd

# Load the two CSV files
video_details = pd.read_csv(r'D:\My Startup Projects\fitsaga\admin-portal\scripts\video_details.csv')
azure_thumbnails_result = pd.read_csv(r'D:\My Startup Projects\fitsaga\admin-portal\azure-thumbnails-result.csv')

# Step 1: Modify the video_details DataFrame
# 1.1 Delete _text from videoId
video_details['videoId'] = video_details['videoId'].str.replace('_text', '', regex=False)

# 1.2 Rename videoId to thumbnailId
video_details.rename(columns={'videoId': 'thumbnailId'}, inplace=True)

# 1.3 Delete videoImg column
video_details.drop(columns=['videoImg'], inplace=True)

# 1.4 Rename videovalue to videoId
video_details.rename(columns={'videovalue': 'videoId'}, inplace=True)

# 1.5 Rename videoactivity to activity
video_details.rename(columns={'videoactivity': 'activity'}, inplace=True)

# 1.6 Rename videotype to type
video_details.rename(columns={'videotype': 'type'}, inplace=True)

# 1.7 Rename videodescription to bodypart
video_details.rename(columns={'videodescription': 'bodypart'}, inplace=True)

# 1.8 Delete plan_url
video_details.drop(columns=['plan_url'], inplace=True)

# 1.9 Construct the new column "videourl"
video_details['videourl'] = 'https://sagafit.blob.core.windows.net/sagafitvideos/' + \
                            video_details['plan_id'].astype(str) + '/' + \
                            video_details['day_name'] + '/' + \
                            video_details['videoId']

# Step 2: Ensure both 'thumbnailId' columns are the same data type (string)
video_details['thumbnailId'] = video_details['thumbnailId'].astype(str)
azure_thumbnails_result['thumbnailId'] = azure_thumbnails_result['thumbnailId'].astype(str)

# Step 3: Merge the video_details DataFrame with the azure-thumbnails-result DataFrame
# We will use the 'thumbnailId' column in both DataFrames for the join
merged_df = pd.merge(video_details, azure_thumbnails_result, on='thumbnailId', how='inner')

# Save the merged result to a new CSV file if needed
merged_df.to_csv(r'D:\My Startup Projects\fitsaga\admin-portal\merged_video_data.csv', index=False)

# Display the result (optional)
print(merged_df.head())
