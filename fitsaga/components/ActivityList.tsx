import React, { useState, useEffect } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { IconSymbol } from './ui/IconSymbol';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

interface Activity {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  caloriesBurn: number;
  instructions: string[];
  equipment: string[];
  muscleGroups: string[];
  imageUrl?: string;
}

interface ActivityListProps {
  category?: string;
  onSelectActivity: (activity: Activity) => void;
}

export default function ActivityList({ category, onSelectActivity }: ActivityListProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;

  useEffect(() => {
    fetchActivities();
  }, [category]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      let activitiesQuery;
      
      if (category) {
        activitiesQuery = query(collection(firestore, 'activities'), where('category', '==', category), orderBy('name'), limit(20));
      } else {
        activitiesQuery = query(collection(firestore, 'activities'), orderBy('name'), limit(20));
      }
      
      const querySnapshot = await getDocs(activitiesQuery);
      
      const activitiesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Activity[];
      
      setActivities(activitiesData);
    } catch (error) {
      console.error('Error fetching activities:', error);
      Alert.alert('Error', 'Failed to load activities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string): string => {
    const iconMap: Record<string, string> = {
      'cardio': 'heart',
      'strength': 'barbell',
      'flexibility': 'body',
      'balance': 'body',
      'sports': 'basketball',
      'yoga': 'body',
      'hiit': 'stopwatch',
      'pilates': 'body',
    };
    
    return iconMap[category.toLowerCase()] || 'fitness';
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tintColor} />
        <ThemedText>Loading activities...</ThemedText>
      </ThemedView>
    );
  }

  if (activities.length === 0) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <ThemedText>No activities found.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <FlatList
      data={activities}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.activityCard} onPress={() => onSelectActivity(item)}>
          <ThemedView style={styles.activityHeader}>
            <ThemedView style={styles.categoryIcon}>
              <IconSymbol name="dumbbell" size={24} color="#FFFFFF" />
            </ThemedView>
            <ThemedView style={styles.activityInfo}>
              <ThemedText style={styles.activityName}>{item.name}</ThemedText>
              <ThemedText style={styles.activityCategory}>{item.category}</ThemedText>
            </ThemedView>
            <ThemedText style={styles.caloriesBurn}>
              {item.caloriesBurn} cal
            </ThemedText>
          </ThemedView>
          
          <ThemedText style={styles.activityDescription}>
            {item.description}
          </ThemedText>
          
          <ThemedView style={styles.activityFooter}>
            <ThemedText style={styles.difficultyLabel}>
              Difficulty: <ThemedText style={styles.difficultyValue}>{item.difficulty}</ThemedText>
            </ThemedText>
            
            {item.equipment && item.equipment.length > 0 && (
              <ThemedText style={styles.equipmentLabel}>
                Equipment: <ThemedText style={styles.equipmentValue}>{item.equipment.join(', ')}</ThemedText>
              </ThemedText>
            )}
          </ThemedView>
        </TouchableOpacity>
      )}
      keyExtractor={item => item.id}
    />
  );
}

const styles = StyleSheet.create({
  activityCard: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  activityCategory: {
    fontSize: 14,
    opacity: 0.7,
  },
  caloriesBurn: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  activityDescription: {
    marginBottom: 12,
    fontSize: 14,
  },
  activityFooter: {
    flexDirection: 'column',
  },
  difficultyLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  difficultyValue: {
    fontWeight: 'bold',
  },
  equipmentLabel: {
    fontSize: 14,
  },
  equipmentValue: {
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
});
