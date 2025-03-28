# Tutorial Creation System with Exercise Videos

## Overview

This document outlines the architecture and implementation plan for a tutorial creation system that allows instructors to build fitness plans using exercise videos. The system will support multiple days of exercises, with each exercise having specific repetitions, sets, and rest times.

## Architecture

### Data Storage

1. **Azure Blob Storage**
   - Stores all exercise videos
   - Provides secure access to video content
   - Handles streaming capabilities

2. **Firestore Database**
   - Stores tutorial metadata
   - Stores exercise metadata (from metadata.csv)
   - Manages relationships between tutorials, days, and exercises

### Data Models

1. **Tutorial Model**
   - Basic information (title, description, category, difficulty)
   - Multiple days of exercises
   - Author information
   - Creation/update timestamps

2. **Day Model**
   - Day number/title
   - Description
   - List of exercises

3. **Exercise Model**
   - Video reference (ID/URL)
   - Exercise metadata (name, activity, type, body part)
   - Repetitions count
   - Sets count
   - Rest time between sets (in seconds)
   - Rest time after exercise (in seconds)

4. **Video Metadata Model**
   - Video ID/filename
   - Activity name
   - Exercise type
   - Body part focus (description)
   - Thumbnail URL

## Component Architecture

1. **Tutorial Creation Page**
   - Form for tutorial metadata
   - Day management interface
   - Exercise selection and configuration

2. **Video Browser Component**
   - Grid display of available videos
   - Filtering by activity, type, and body part
   - Preview thumbnails
   - Selection mechanism

3. **Exercise Configuration Component**
   - Video selection interface
   - Repetition/set count inputs
   - Rest time configuration

4. **Video Player Component (for tutorial view)**
   - Playback controls
   - Repetition counter
   - Set progression tracking
   - Rest time timer

## Services

1. **Azure Storage Service**
   - Handles video uploads
   - Manages secure access to videos
   - Provides streaming URLs

2. **Metadata Management Service**
   - Imports and processes metadata.csv
   - Provides filtering and search capabilities
   - Connects videos with their metadata

3. **Tutorial Service**
   - Creates and updates tutorials
   - Validates exercise configurations
   - Calculates total workout duration

## Implementation Plan

### Phase 1: Infrastructure Setup (Week 1)

1. Set up Azure Blob Storage container for videos
2. Configure security and access policies
3. Create database schema in Firestore
4. Import and process metadata.csv file
5. Set up thumbnail generation/storage

### Phase 2: UI Component Development (Week 2)

1. Enhance tutorial creation form with new fields
2. Develop video browser component with filtering
3. Create exercise configuration interface
4. Implement day management functionality

### Phase 3: Video Integration (Week 3)

1. Implement video selection in exercise form
2. Connect video metadata to selection interface
3. Build thumbnail preview system
4. Develop validation for exercise configurations

### Phase 4: Playback Implementation (Week 4)

1. Create video player with repetition tracking
2. Implement rest timer functionality
3. Build set progression tracking
4. Develop workout summary view

### Phase 5: Testing and Refinement (Week 5)

1. Test with real video data
2. Optimize performance for large video collections
3. Implement user feedback
4. Final bug fixes and polishing

## User Workflow

1. Admin creates a new tutorial
2. Adds multiple days to the tutorial
3. For each day, adds exercises by:
   - Browsing/filtering available videos
   - Selecting appropriate exercises
   - Configuring repetitions, sets, and rest times
4. Previews the tutorial structure
5. Saves the tutorial for user access

## Technical Considerations

1. **Video Performance**
   - Use streaming protocols for efficient video delivery
   - Implement adaptive bitrate streaming
   - Consider CDN integration for global access

2. **Scalability**
   - Design for growing video library
   - Optimize metadata queries for large collections
   - Consider pagination for video browser

3. **Usability**
   - Implement intuitive filtering
   - Provide clear preview of selected videos
   - Show calculated total workout duration

4. **Mobile Compatibility**
   - Ensure responsive design
   - Test video playback on mobile devices
   - Optimize UI for touch interactions