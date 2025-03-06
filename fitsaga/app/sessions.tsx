import React from 'react';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { SessionList } from '../components/SessionList';

export default function SessionsScreen() {
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Sessions' }} />
      <ThemedText type="title" style={styles.title}>Available Sessions</ThemedText>
      <SessionList />
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
