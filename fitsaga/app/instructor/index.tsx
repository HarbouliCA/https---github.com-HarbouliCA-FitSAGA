import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuthContext } from '../../contexts/AuthContext';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import { Session } from '../../../shared/types';

export default function InstructorDashboard() {
  const { user } = useAuthContext();
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Fetch upcoming sessions for this instructor
    const now = new Date();
    const sessionsRef = firestore()
      .collection('sessions')
      .where('instructorId', '==', user.uid)
      .where('dateTime', '>=', now)
      .where('status', '==', 'scheduled')
      .orderBy('dateTime', 'asc')
      .limit(5);

    const unsubscribe = sessionsRef.onSnapshot(
      (snapshot) => {
        const sessions = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Session[];
        setUpcomingSessions(sessions);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching sessions:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome, {user?.fullName}</Text>
        <Text style={styles.subTitle}>Instructor Dashboard</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
          <TouchableOpacity onPress={() => router.push('/instructor/sessions')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <Text style={styles.loadingText}>Loading sessions...</Text>
        ) : upcomingSessions.length > 0 ? (
          upcomingSessions.map((session) => (
            <TouchableOpacity
              key={session.id}
              style={styles.sessionCard}
              onPress={() => router.push(`/instructor/sessions/${session.id}`)}
            >
              <Text style={styles.sessionTitle}>{session.title}</Text>
              <Text style={styles.sessionTime}>
                {formatDate(session.dateTime)} ({session.duration} min)
              </Text>
              <Text style={styles.sessionParticipants}>
                {session.currentParticipants}/{session.maxParticipants} participants
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>No upcoming sessions</Text>
        )}
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/instructor/activities')}
          >
            <Text style={styles.actionButtonText}>Manage Activities</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/instructor/sessions/create')}
          >
            <Text style={styles.actionButtonText}>Create Session</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/instructor/profile')}
          >
            <Text style={styles.actionButtonText}>Update Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#3f51b5',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subTitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  section: {
    margin: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAll: {
    color: '#3f51b5',
    fontSize: 14,
  },
  sessionCard: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sessionTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  sessionParticipants: {
    fontSize: 14,
    color: '#3f51b5',
    marginTop: 5,
  },
  loadingText: {
    padding: 15,
    color: '#666',
    textAlign: 'center',
  },
  emptyText: {
    padding: 15,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  quickActions: {
    margin: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  actionButtons: {
    marginTop: 10,
  },
  actionButton: {
    backgroundColor: '#3f51b5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
