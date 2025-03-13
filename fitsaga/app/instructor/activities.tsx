import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { router } from 'expo-router';
import firestore from '@react-native-firebase/firestore';
import { Activity } from '../../../shared/types';
import { hasPermission } from '../../services/userService';

export default function InstructorActivities() {
  const { user } = useAuthContext();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;

    // Check if user has permission to manage activities
    if (!hasPermission(user, 'read:activities')) {
      router.replace('/');
      return;
    }

    // Fetch activities created by this instructor or all activities if admin
    const activitiesRef = user.role === 'admin' 
      ? firestore().collection('activities')
      : firestore().collection('activities').where('createdBy', '==', user.uid);

    const unsubscribe = activitiesRef.onSnapshot(
      (snapshot) => {
        const activityList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Activity[];
        setActivities(activityList);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching activities:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Filter activities based on search query
  const filteredActivities = activities.filter(
    (activity) =>
      activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderActivityItem = ({ item }: { item: Activity }) => (
    <TouchableOpacity
      style={styles.activityCard}
      onPress={() => router.push(`/instructor/activities/${item.id}`)}
    >
      <View style={styles.activityHeader}>
        <Text style={styles.activityName}>{item.name}</Text>
        <View style={[styles.badge, { backgroundColor: item.isActive ? '#4caf50' : '#f44336' }]}>
          <Text style={styles.badgeText}>{item.isActive ? 'Active' : 'Inactive'}</Text>
        </View>
      </View>
      <Text style={styles.activityCategory}>{item.category}</Text>
      <Text style={styles.activityDescription} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.activityFooter}>
        <Text style={styles.activityDuration}>{item.duration} min</Text>
        <Text style={styles.activityDifficulty}>{item.difficulty}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Activities</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/instructor/activities/create')}
        >
          <Text style={styles.createButtonText}>Create New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search activities..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading activities...</Text>
        </View>
      ) : filteredActivities.length > 0 ? (
        <FlatList
          data={filteredActivities}
          renderItem={renderActivityItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No activities found</Text>
          <TouchableOpacity
            style={styles.createEmptyButton}
            onPress={() => router.push('/instructor/activities/create')}
          >
            <Text style={styles.createButtonText}>Create Your First Activity</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    backgroundColor: '#3f51b5',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  searchContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#eee',
  },
  listContainer: {
    padding: 15,
  },
  activityCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  activityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activityCategory: {
    fontSize: 14,
    color: '#3f51b5',
    marginBottom: 5,
  },
  activityDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  activityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activityDuration: {
    fontSize: 14,
    color: '#666',
  },
  activityDifficulty: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  createEmptyButton: {
    backgroundColor: '#3f51b5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 5,
  },
});
