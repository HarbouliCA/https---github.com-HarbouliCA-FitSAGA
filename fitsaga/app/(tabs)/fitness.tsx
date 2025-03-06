import { StyleSheet, View } from 'react-native';
import React from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { WorkoutCard } from '@/components/WorkoutCard';

export default function FitnessScreen() {
  // Sample workout data
  const workouts = [
    {
      id: '1',
      title: 'Morning Run',
      duration: '30 min',
      calories: 320,
      date: 'Today, 7:30 AM',
    },
    {
      id: '2',
      title: 'Strength Training',
      duration: '45 min',
      calories: 280,
      date: 'Yesterday, 6:00 PM',
    },
  ];

  return (
    <View style={styles.container}>
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#4CAF50', dark: '#1B5E20' }}
        headerImage={
          <ThemedText 
            type="title" 
            style={{ 
              color: 'white', 
              fontSize: 24, 
              fontWeight: 'bold',
              textAlign: 'center',
              marginTop: 100
            }}
          >
            Fitness Tracker
          </ThemedText>
        }>
        <ThemedView style={styles.section}>
          <ThemedText type="title">Today's Stats</ThemedText>
          <ThemedView style={styles.statsContainer}>
            <ThemedView style={styles.statCard}>
              <ThemedText type="subtitle">Steps</ThemedText>
              <ThemedText type="title">0</ThemedText>
            </ThemedView>
            <ThemedView style={styles.statCard}>
              <ThemedText type="subtitle">Calories</ThemedText>
              <ThemedText type="title">0</ThemedText>
            </ThemedView>
            <ThemedView style={styles.statCard}>
              <ThemedText type="subtitle">Minutes</ThemedText>
              <ThemedText type="title">0</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="title">Workout History</ThemedText>
          {workouts.length > 0 ? (
            workouts.map((workout) => (
              <WorkoutCard
                key={workout.id}
                title={workout.title}
                duration={workout.duration}
                calories={workout.calories}
                date={workout.date}
                onPress={() => console.log('Workout pressed:', workout.id)}
              />
            ))
          ) : (
            <ThemedView style={styles.workoutItem}>
              <ThemedText type="defaultSemiBold">No workouts yet</ThemedText>
              <ThemedText>Your completed workouts will appear here</ThemedText>
            </ThemedView>
          )}
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="title">Goals</ThemedText>
          <ThemedView style={styles.workoutItem}>
            <ThemedText type="defaultSemiBold">Daily Step Goal</ThemedText>
            <ThemedText>10,000 steps</ThemedText>
          </ThemedView>
          <ThemedView style={styles.workoutItem}>
            <ThemedText type="defaultSemiBold">Weekly Workout Goal</ThemedText>
            <ThemedText>5 workouts</ThemedText>
          </ThemedView>
        </ThemedView>
      </ParallaxScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  workoutItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
});
