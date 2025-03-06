import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  writeBatch, 
  arrayUnion, 
  increment, 
  serverTimestamp 
} from 'firebase/firestore';
import { firestore } from '../../config/firebase';
import { useAuth } from '../../context/AuthContext';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { IconSymbol } from '../../components/ui/IconSymbol';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import ParallaxScrollView from '../../components/ParallaxScrollView';

// Define the Session type
interface Session {
  id: string;
  title: string;
  description: string;
  trainerId: string;
  trainerName: string;
  date: any; // Firestore timestamp
  duration: number; // in minutes
  location: string;
  capacity: number;
  participantIds: string[];
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  price: number;
  isActive: boolean;
}

export default function SessionsScreen() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { userProfile, refreshUserProfile } = useAuth();
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;

  useEffect(() => {
    if (userProfile) {
      fetchSessions();
    }
  }, [userProfile]);

  // Fetch active sessions
  const fetchSessions = async () => {
    try {
      setLoading(true);
      
      // Query for active sessions ordered by startTime instead of date
      // This matches the existing index in Firestore
      const sessionsQuery = query(
        collection(firestore, 'sessions'),
        where('isActive', '==', true),
        orderBy('startTime')
      );
      
      const querySnapshot = await getDocs(sessionsQuery);
      
      const sessionsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Ensure all required fields are present
        return {
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          trainerId: data.trainerId || '',
          trainerName: data.trainerName || '',
          date: data.date ? data.date.toDate() : new Date(),
          duration: data.duration || 0,
          location: data.location || '',
          capacity: data.capacity || 0,
          participantIds: data.participantIds || [],
          category: data.category || '',
          level: data.level || 'beginner',
          price: data.price || 0,
          isActive: data.isActive !== undefined ? data.isActive : true
        } as Session;
      });
      
      setSessions(sessionsData);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      Alert.alert('Error', 'Failed to load sessions. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSessions();
  };

  // Handle joining a session
  const handleJoinSession = async (session: Session) => {
    if (!userProfile || !userProfile.uid) {
      Alert.alert('Login Required', 'Please login to join a session');
      return;
    }

    if (session.participantIds.includes(userProfile.uid)) {
      Alert.alert('Already Joined', 'You have already joined this session');
      return;
    }

    if (session.participantIds.length >= session.capacity) {
      Alert.alert('Session Full', 'This session has reached its maximum capacity');
      return;
    }

    if (userProfile.credits < session.price) {
      Alert.alert('Insufficient Credits', 'You do not have enough credits to join this session');
      return;
    }

    try {
      // Create a batch of operations to perform atomically
      const batch = writeBatch(firestore);
      
      // Update the session to add the user to participantIds
      const sessionRef = doc(firestore, 'sessions', session.id);
      batch.update(sessionRef, {
        participantIds: arrayUnion(userProfile.uid)
      });
      
      // Update user credits
      const userRef = doc(firestore, 'users', userProfile.uid);
      batch.update(userRef, {
        credits: increment(-session.price)
      });
      
      // Commit the batch
      await batch.commit();
      
      // Refresh the sessions list
      await fetchSessions();
      
      // Refresh user profile to update credits
      await refreshUserProfile();
      
      Alert.alert('Success', 'You have successfully joined the session');
    } catch (error) {
      console.error('Error joining session:', error);
      Alert.alert('Error', 'Failed to join session. Please try again.');
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'TBD';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderSessionItem = ({ item }: { item: Session }) => {
    return (
      <ThemedView style={styles.sessionCard}>
        <ThemedText style={styles.sessionTitle}>{item.title}</ThemedText>
        <ThemedText style={styles.sessionDescription}>{item.description}</ThemedText>
        
        <ThemedView style={styles.sessionDetails}>
          <ThemedView style={styles.detailItem}>
            <IconSymbol name="calendar" size={16} color={tintColor} />
            <ThemedText style={styles.detailText}>
              {formatDate(item.date)}
            </ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.detailItem}>
            <IconSymbol name="figure.walk" size={16} color={tintColor} />
            <ThemedText style={styles.detailText}>
              {item.participantIds.length}/{item.capacity} spots
            </ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.detailItem}>
            <IconSymbol name="star" size={16} color={tintColor} />
            <ThemedText style={styles.detailText}>
              {item.price} credits
            </ThemedText>
          </ThemedView>
        </ThemedView>
        
        <TouchableOpacity
          style={[
            styles.joinButton,
            (item.participantIds.length >= item.capacity) && styles.disabledButton
          ]}
          onPress={() => handleJoinSession(item)}
          disabled={item.participantIds.length >= item.capacity}
        >
          <ThemedText style={styles.joinButtonText}>
            {item.participantIds.length >= item.capacity ? 'Session Full' : 'Join Session'}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} style={styles.loader} />
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={renderSessionItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListHeaderComponent={
            <View>
              <ParallaxScrollView
                useScrollView={false}
                headerImage={
                  <ThemedView style={styles.headerImageContainer}>
                    <ThemedText style={styles.headerTitle}>Fitness Sessions</ThemedText>
                    <ThemedText style={styles.headerSubtitle}>Join a session to get fit with others</ThemedText>
                  </ThemedView>
                }
                headerBackgroundColor={{
                  light: Colors.light.tint,
                  dark: Colors.dark.tint,
                }}
              />
            </View>
          }
          ListEmptyComponent={
            <ThemedView style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>No sessions available</ThemedText>
            </ThemedView>
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loader: {
    marginTop: 50,
  },
  list: {
    paddingBottom: 20,
  },
  sessionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sessionDescription: {
    marginBottom: 16,
  },
  sessionDetails: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
  },
  joinButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9E9E9E',
  },
  joinButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerImageContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'white',
  },
});
