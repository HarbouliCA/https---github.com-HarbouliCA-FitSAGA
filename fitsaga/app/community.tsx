import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';

export default function CommunityScreen() {
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Community' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title" style={styles.title}>Community</ThemedText>
        <ThemedView style={styles.placeholderCard}>
          <ThemedText>Community features coming soon!</ThemedText>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    marginBottom: 20,
  },
  placeholderCard: {
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
});
