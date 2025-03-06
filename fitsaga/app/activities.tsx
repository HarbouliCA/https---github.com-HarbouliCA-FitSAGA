import React from 'react';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import ActivityList from '../components/ActivityList';

export default function ActivitiesScreen() {
  const handleSelectActivity = (activity: any) => {
    console.log('Selected activity:', activity);
    // Handle activity selection
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Activities' }} />
      <ThemedText type="title" style={styles.title}>Available Activities</ThemedText>
      <ActivityList onSelectActivity={handleSelectActivity} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    marginBottom: 20,
  },
});
