import { Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../components/ui/ThemeProvider';

const GRID_ITEMS = [
  { id: 'activities', title: 'Activities', icon: 'fitness', route: '/activities' },
  { id: 'sessions', title: 'Sessions', icon: 'calendar', route: '/sessions' },
  { id: 'progress', title: 'My Progress', icon: 'trending-up', route: '/progress' },
  { id: 'nutrition', title: 'Nutrition', icon: 'nutrition', route: '/nutrition' },
  { id: 'challenges', title: 'Challenges', icon: 'trophy', route: '/challenges' },
  { id: 'community', title: 'Community', icon: 'people', route: '/community' },
  { id: 'settings', title: 'Settings', icon: 'settings', route: '/settings' },
  { id: 'theme', title: 'Theme', icon: 'color-palette', route: '/theme-showcase' },
];

export default function HomeScreen() {
  const { userProfile, logout } = useAuth();
  const { colors } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const itemWidth = (screenWidth - 60) / 2; // 2 columns with 20px padding on sides and 20px gap

  const handleGridItemPress = (route: string) => {
    router.push(route as any);
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header with user info */}
      <ThemedView style={styles.header}>
        <ThemedView style={styles.userInfoContainer}>
          <ThemedText type="title">Hello, {userProfile?.name || 'User'}</ThemedText>
          <ThemedText type="subtitle">Welcome to FitSaga</ThemedText>
        </ThemedView>
        <TouchableOpacity style={styles.profileButton}>
          <Image 
            source={require('../../assets/images/adaptive-icon.png')} 
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </ThemedView>

      {/* Grid layout */}
      <ThemedView style={styles.gridContainer}>
        {GRID_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.gridItem,
              { 
                width: itemWidth,
                backgroundColor: colors.card,
              }
            ]}
            onPress={() => handleGridItemPress(item.route)}
          >
            <Ionicons name={item.icon as any} size={32} color={colors.primary} />
            <ThemedText style={styles.gridItemTitle}>{item.title}</ThemedText>
          </TouchableOpacity>
        ))}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  userInfoContainer: {
    flex: 1,
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 20,
  },
  gridItem: {
    height: 120,
    borderRadius: 12,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gridItemTitle: {
    marginTop: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});
