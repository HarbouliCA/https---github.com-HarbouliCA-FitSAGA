import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { router } from 'expo-router';
import firestore from '@react-native-firebase/firestore';
import { Session } from '../../../shared/types';
import { hasPermission } from '../../services/userService';

export default function InstructorSessions() {
  const { user } = useAuthContext();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming'); // 'upcoming', 'past', 'all'

  useEffect(() => {
    if (!user) return;

    // Check if user has permission to manage sessions
    if (!hasPermission(user, 'update:session')) {
      router.replace('/');
      return;
    }

    // Build query based on filter
    let sessionsRef = firestore()
      .collection('sessions')
      .where('instructorId', '==', user.uid);

    const now = new Date();

    if (filter === 'upcoming') {
      sessionsRef = sessionsRef
        .where('dateTime', '>=', now)
        .orderBy('dateTime', 'asc');
    } else if (filter === 'past') {
      sessionsRef = sessionsRef
        .where('dateTime', '<', now)
        .orderBy('dateTime', 'desc');
    } else {
      // 'all' - just order by date
      sessionsRef = sessionsRef.orderBy('dateTime', 'desc');
    }

    const unsubscribe = sessionsRef.onSnapshot(
      (snapshot) => {
        const sessionList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Session[];
        setSessions(sessionList);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching sessions:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, filter]);

  const formatDate = (date: Date | string) => {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '#4caf50'; // Green
      case 'cancelled':
        return '#f44336'; // Red
      case 'completed':
        return '#2196f3'; // Blue
      default:
        return '#9e9e9e'; // Grey
    }
  };

  const renderSessionItem = ({ item }: { item: Session }) => (
    <TouchableOpacity
      style={styles.sessionCard}
      onPress={() => router.push(`/instructor/sessions/${item.id}`)}
    >
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionTitle}>{item.title}</Text>
        <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.sessionTime}>{formatDate(item.dateTime)} ({item.duration} min)</Text>
      <Text style={styles.sessionLocation}>{item.location}</Text>
      <View style={styles.sessionFooter}>
        <Text style={styles.sessionParticipants}>
          {item.currentParticipants}/{item.maxParticipants} participants
        </Text>
        <Text style={styles.sessionType}>{item.activityType}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Sessions</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/instructor/sessions/create')}
        >
          <Text style={styles.createButtonText}>Create New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'upcoming' && styles.filterButtonActive]}
          onPress={() => setFilter('upcoming')}
        >
          <Text
            style={[styles.filterText, filter === 'upcoming' && styles.filterTextActive]}
          >
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'past' && styles.filterButtonActive]}
          onPress={() => setFilter('past')}
        >
          <Text
            style={[styles.filterText, filter === 'past' && styles.filterTextActive]}
          >
            Past
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[styles.filterText, filter === 'all' && styles.filterTextActive]}
          >
            All
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading sessions...</Text>
        </View>
      ) : sessions.length > 0 ? (
        <FlatList
          data={sessions}
          renderItem={renderSessionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No sessions found</Text>
          <TouchableOpacity
            style={styles.createEmptyButton}
            onPress={() => router.push('/instructor/sessions/create')}
          >
            <Text style={styles.createButtonText}>Create Your First Session</Text>
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
  filterContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterButtonActive: {
    borderBottomColor: '#3f51b5',
  },
  filterText: {
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#3f51b5',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 15,
  },
  sessionCard: {
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
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  sessionTitle: {
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
    textTransform: 'capitalize',
  },
  sessionTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  sessionLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sessionParticipants: {
    fontSize: 14,
    color: '#3f51b5',
  },
  sessionType: {
    fontSize: 14,
    color: '#666',
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
