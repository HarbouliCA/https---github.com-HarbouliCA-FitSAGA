import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { firestore } from '../config/firebase';

import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

type Session = {
  id: string;
  title: string;
  description: string;
  activityId: string;
  startTime: any; // Firestore timestamp
  endTime: any; // Firestore timestamp
  maxParticipants: number;
  currentParticipants: number;
  creditCost: number;
  isActive: boolean;
};

export function SessionList() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSessions() {
      try {
        // Create a query with proper ordering to avoid index issues
        const sessionsQuery = query(
          collection(firestore, 'sessions'), 
          where('isActive', '==', true), 
          orderBy('startTime')
        );
        
        const querySnapshot = await getDocs(sessionsQuery);
        const sessionsList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          title: doc.data().title || '',
          description: doc.data().description || '',
          activityId: doc.data().activityId || '',
          startTime: doc.data().startTime,
          endTime: doc.data().endTime,
          maxParticipants: doc.data().maxParticipants || 0,
          currentParticipants: doc.data().currentParticipants || 0,
          creditCost: doc.data().creditCost || 0,
          isActive: doc.data().isActive !== undefined ? doc.data().isActive : true
        }));
        
        setSessions(sessionsList);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError('Failed to load sessions. Please try again later.');
        setLoading(false);
      }
    }

    fetchSessions();
  }, []);

  // Format date from Firestore timestamp
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'TBD';
    
    // Handle both Firestore Timestamp and JavaScript Date objects
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator />
        <ThemedText>Loading sessions...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      </ThemedView>
    );
  }

  if (sessions.length === 0) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <ThemedText>No upcoming sessions found.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <View>
      {sessions.map(session => (
        <ThemedView key={session.id} style={styles.sessionCard}>
          <ThemedText style={styles.sessionTitle}>{session.title}</ThemedText>
          <ThemedText style={styles.sessionDescription}>{session.description}</ThemedText>
          
          <View style={styles.sessionDetails}>
            <View style={styles.detailItem}>
              <ThemedText style={styles.detailLabel}>When:</ThemedText>
              <ThemedText>{formatDate(session.startTime)}</ThemedText>
            </View>
            
            <View style={styles.detailItem}>
              <ThemedText style={styles.detailLabel}>Spots:</ThemedText>
              <ThemedText>
                {session.currentParticipants}/{session.maxParticipants}
              </ThemedText>
            </View>
            
            <View style={styles.detailItem}>
              <ThemedText style={styles.detailLabel}>Credits:</ThemedText>
              <ThemedText>{session.creditCost}</ThemedText>
            </View>
          </View>
        </ThemedView>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sessionCard: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 8,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sessionDescription: {
    marginBottom: 12,
  },
  sessionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  detailItem: {
    marginTop: 8,
    minWidth: '30%',
  },
  detailLabel: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
});
