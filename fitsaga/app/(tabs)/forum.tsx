import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, View, Image, Text } from 'react-native';
import { useRouter, useSegments, useLocalSearchParams } from 'expo-router';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  increment 
} from 'firebase/firestore';
import { firestore } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { IconSymbol } from '../../components/ui/IconSymbol';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the ForumPost type
interface ForumPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName?: string;
  authorPhotoURL?: string;
  category: string;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: any; // Firestore timestamp
  updatedAt: any; // Firestore timestamp
  images?: string[];
}

export default function ForumScreen() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { userProfile } = useAuth();
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  const router = useRouter();
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({});
  
  // Get the postId from URL parameters if it exists
  const segments = useSegments();
  const { postId: pendingLikePostId } = useLocalSearchParams();

  useEffect(() => {
    fetchPosts();
    if (userProfile) {
      fetchUserLikes();
    }
    
    // Handle pending like action if there's a postId in the URL
    if (pendingLikePostId && userProfile) {
      handleLikePost(pendingLikePostId.toString());
      // Clear the postId from the URL by replacing the current route
      router.replace('/(tabs)/forum');
    }
  }, [userProfile, pendingLikePostId]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      const postsQuery = query(collection(firestore, 'forumPosts'), orderBy('createdAt', 'desc'), limit(20));
      
      const querySnapshot = await getDocs(postsQuery);
      const postsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ForumPost[];
      
      setPosts(postsData);
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert('Error', 'Failed to load forum posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchUserLikes = async () => {
    if (!userProfile || !userProfile.uid) return;
    
    try {
      const likesQuery = query(collection(firestore, 'forumLikes'), where('userId', '==', userProfile.uid));
      
      const querySnapshot = await getDocs(likesQuery);
      
      const likes: Record<string, boolean> = {};
      
      querySnapshot.forEach(doc => {
        const data = doc.data();
        likes[data.postId] = true;
      });
      
      setUserLikes(likes);
    } catch (error) {
      console.error('Error fetching user likes:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts();
    if (userProfile) {
      fetchUserLikes();
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!userProfile || !userProfile.uid) {
      // Store the post ID that the user wanted to like
      await AsyncStorage.setItem('pendingLikePostId', postId);
      
      // Navigate to login
      router.push('/login');
      return;
    }

    try {
      const likeRef = doc(firestore, 'forumLikes', `${userProfile.uid}_${postId}`);
      const likeDoc = await getDoc(likeRef);
      
      if (likeDoc.exists()) {
        // Unlike post
        await deleteDoc(likeRef);
        await updateDoc(doc(firestore, 'forumPosts', postId), {
          likesCount: increment(-1),
          updatedAt: serverTimestamp()
        });
        
        // Update local state
        setUserLikes(prev => {
          const updated = { ...prev };
          delete updated[postId];
          return updated;
        });
      } else {
        // Like post
        await setDoc(likeRef, {
          id: `${userProfile.uid}_${postId}`,
          userId: userProfile.uid,
          postId: postId,
          createdAt: serverTimestamp()
        });
        
        await updateDoc(doc(firestore, 'forumPosts', postId), {
          likesCount: increment(1),
          updatedAt: serverTimestamp()
        });
        
        // Update local state
        setUserLikes(prev => ({
          ...prev,
          [postId]: true
        }));
      }
    } catch (error) {
      console.error('Error liking post:', error);
      Alert.alert('Error', 'Failed to like post');
    }
  };

  const navigateToPost = (postId: string) => {
    router.push(`/post/${postId}` as any);
  };

  const renderPostItem = ({ item }: { item: ForumPost }) => {
    const isLiked = userLikes[item.id] || false;
    
    // Handle Firestore timestamp or regular Date object
    let formattedDate = 'Unknown date';
    if (item.createdAt) {
      // Check if it's a Firestore timestamp (has toDate method)
      if (typeof item.createdAt === 'object' && 'toDate' in item.createdAt && typeof item.createdAt.toDate === 'function') {
        formattedDate = item.createdAt.toDate().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      } else {
        // It's a regular Date object or timestamp
        formattedDate = new Date(item.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
    }
    
    return (
      <TouchableOpacity 
        style={styles.postCard} 
        onPress={() => navigateToPost(item.id)}
        activeOpacity={0.8}
      >
        <ThemedView style={styles.postHeader}>
          <Image 
            source={item.authorPhotoURL ? { uri: item.authorPhotoURL } : require('../../assets/images/default-avatar.png')} 
            style={styles.authorImage} 
          />
          <ThemedView style={styles.authorInfo}>
            <ThemedText style={styles.authorName}>{item.authorName}</ThemedText>
            <ThemedText style={styles.postTime}>{formattedDate}</ThemedText>
          </ThemedView>
        </ThemedView>
        
        <ThemedText style={styles.postTitle}>{item.title}</ThemedText>
        <ThemedText style={styles.postContent} numberOfLines={3}>
          {item.content}
        </ThemedText>
        
        {item.images && item.images.length > 0 && (
          <Image 
            source={{ uri: item.images[0] }} 
            style={styles.postImage} 
            resizeMode="cover" 
          />
        )}
        
        <ThemedView style={styles.postFooter}>
          <ThemedView style={styles.postStats}>
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => handleLikePost(item.id)}
            >
              <IconSymbol 
                name={isLiked ? "heart.fill" : "heart"} 
                size={20} 
                color={isLiked ? '#FF6B6B' : colorScheme === 'dark' ? '#FFFFFF' : '#000000'} 
              />
              <ThemedText>{item.likesCount || 0}</ThemedText>
            </TouchableOpacity>
            
            <ThemedView style={styles.statItem}>
              <IconSymbol name="chevron.right" size={20} color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
              <ThemedText>{item.commentsCount || 0}</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {loading && !refreshing ? (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={styles.loadingText}>Loading posts...</ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPostItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <ThemedView style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>No posts yet. Be the first to share!</ThemedText>
            </ThemedView>
          }
        />
      )}
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/create-post' as any)}
      >
        <IconSymbol name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  listContent: {
    paddingBottom: 80,
  },
  postCard: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  postTime: {
    fontSize: 12,
    opacity: 0.6,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 14,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.6,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});
