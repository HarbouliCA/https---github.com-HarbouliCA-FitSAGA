import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { IconSymbol } from './ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface WorkoutCardProps {
  title: string;
  duration: string;
  calories: number;
  date: string;
  onPress?: () => void;
}

export function WorkoutCard({ title, duration, calories, date, onPress }: WorkoutCardProps) {
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <ThemedView style={styles.card}>
        <ThemedView style={styles.iconContainer}>
          <IconSymbol 
            name="figure.run" 
            size={24} 
            color={tintColor} 
          />
        </ThemedView>
        <ThemedView style={styles.content}>
          <ThemedText type="defaultSemiBold">{title}</ThemedText>
          <ThemedView style={styles.detailsRow}>
            <ThemedText>{duration}</ThemedText>
            <ThemedText>•</ThemedText>
            <ThemedText>{calories} cal</ThemedText>
          </ThemedView>
          <ThemedText style={styles.date}>{date}</ThemedText>
        </ThemedView>
      </ThemedView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  date: {
    marginTop: 4,
    opacity: 0.6,
  },
});
