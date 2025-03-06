import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, ActivityIndicator, Image, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  increment, 
  serverTimestamp 
} from 'firebase/firestore';
import { firestore } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { ForumPost } from '../../models/Forum';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { IconSymbol } from '../../components/ui/IconSymbol';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

interface ForumComment {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName?: string;
  authorPhotoURL?: string;
  createdAt: any; // Firestore timestamp
  updatedAt: any; // Firestore timestamp
}

export default function PostDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [post, setPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { userProfile } = useAuth();
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const router = useRouter();

  useEffect(() => {
    fetchPostDetails();
  }, [id]);

  const fetchPostDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch post details
      const postDoc = await getDoc(doc(firestore, 'forumPosts', id as string));
      if (!postDoc.exists()) {
        Alert.alert('Error', 'Post not found');
        router.back();
        return;
      }
      
      const postData = {
        id: postDoc.id,
        ...postDoc.data()
      } as ForumPost;
      
      setPost(postData);
      
      // Fetch comments
      try {
        const commentsQuery = query(collection(firestore, 'forumComments'), where('postId', '==', id), orderBy('createdAt', 'asc'));
        
        const commentsSnapshot = await getDocs(commentsQuery);
        const commentsData = commentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ForumComment[];
        
        setComments(commentsData);
      } catch (error: any) {
        console.error('Error fetching comments:', error);
        // If it's an indexing error, we'll still show the post but with empty comments
        if (error.message && error.message.includes('requires an index')) {
          console.warn('Index required for comments query. Comments will not be displayed.');
          setComments([]);
        }
      }
    } catch (error) {
      console.error('Error fetching post details:', error);
      Alert.alert('Error', 'Failed to load post details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    
    if (!userProfile) {
      Alert.alert('Error', 'You must be logged in to comment');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Create new comment
      const newComment = {
        postId: id,
        content: commentText,
        authorId: userProfile.uid,
        authorName: userProfile.name || 'Anonymous',
        authorPhotoURL: userProfile.photoURL || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Add comment to Firestore
      const docRef = await addDoc(collection(firestore, 'forumComments'), newComment);
      
      // Update post comment count
      await updateDoc(doc(firestore, 'forumPosts', id as string), {
        commentsCount: increment(1),
        updatedAt: serverTimestamp()
      });
      
      // Add the new comment to the local state
      const newCommentWithId = {
        id: docRef.id,
        ...newComment,
        // Override the server timestamp with a Date for local display
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setComments(prevComments => [...prevComments, newCommentWithId as ForumComment]);
      setCommentText('');
    } catch (error) {
      console.error('Error submitting comment:', error);
      Alert.alert('Error', 'Failed to submit comment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tintColor} />
      </ThemedView>
    );
  }

  if (!post) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText>Post not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: post.isAnnouncement ? 'Announcement' : 'Forum Post',
          headerBackTitle: 'Back'
        }} 
      />
      <ScrollView style={styles.container}>
        <ThemedView style={styles.postHeader}>
          {post.isAnnouncement && (
            <ThemedView style={styles.announcementBadge}>
              <ThemedText style={styles.announcementText}>Announcement</ThemedText>
            </ThemedView>
          )}
          
          <ThemedText type="title" style={styles.postTitle}>
            {post.title}
          </ThemedText>
          
          <ThemedText style={styles.postDate}>
            {formatDate(post.createdAt)}
          </ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.postContent}>
          <ThemedText style={styles.contentText}>{post.content}</ThemedText>
          
          {post.images && post.images.length > 0 && (
            <ThemedView style={styles.imagesContainer}>
              {post.images.map((image, index) => (
                <Image 
                  key={index}
                  source={{ uri: image }} 
                  style={styles.postImage}
                  resizeMode="cover"
                />
              ))}
            </ThemedView>
          )}
        </ThemedView>
        
        <ThemedView style={styles.statsContainer}>
          <ThemedView style={styles.statItem}>
            <IconSymbol name="heart" size={20} color={tintColor} />
            <ThemedText>{post.likesCount} likes</ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.statItem}>
            <IconSymbol name="text.bubble" size={20} color={tintColor} />
            <ThemedText>{post.commentsCount} comments</ThemedText>
          </ThemedView>
        </ThemedView>
        
        <ThemedView style={styles.commentsContainer}>
          <ThemedText type="subtitle" style={styles.commentsTitle}>
            Comments
          </ThemedText>
          
          {comments.length === 0 ? (
            <ThemedView style={styles.emptyComments}>
              <ThemedText>No comments yet. Be the first to comment!</ThemedText>
            </ThemedView>
          ) : (
            comments.map((comment) => (
              <ThemedView key={comment.id} style={styles.commentItem}>
                <ThemedView style={styles.commentHeader}>
                  <ThemedText type="defaultSemiBold">User</ThemedText>
                  <ThemedText style={styles.commentDate}>
                    {formatDate(comment.createdAt)}
                  </ThemedText>
                </ThemedView>
                <ThemedText style={styles.commentContent}>
                  {comment.content}
                </ThemedText>
              </ThemedView>
            ))
          )}
        </ThemedView>
        
        {userProfile && (
          <ThemedView style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: tintColor, opacity: submitting ? 0.7 : 1 }
              ]}
              onPress={handleSubmitComment}
              disabled={submitting || !commentText.trim()}
            >
              <ThemedText style={styles.submitButtonText}>
                {submitting ? 'Posting...' : 'Post'}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  announcementBadge: {
    backgroundColor: '#FF9800',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  announcementText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  postTitle: {
    fontSize: 22,
    marginBottom: 8,
  },
  postDate: {
    opacity: 0.6,
  },
  postContent: {
    padding: 16,
  },
  contentText: {
    lineHeight: 24,
  },
  imagesContainer: {
    marginTop: 16,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    gap: 8,
  },
  commentsContainer: {
    padding: 16,
  },
  commentsTitle: {
    marginBottom: 16,
  },
  emptyComments: {
    padding: 16,
    alignItems: 'center',
  },
  commentItem: {
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  commentDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  commentContent: {
    lineHeight: 20,
  },
  commentInputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  commentInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    marginBottom: 12,
  },
  submitButton: {
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
