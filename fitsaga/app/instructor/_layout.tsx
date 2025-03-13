import { Stack } from 'expo-router';
import { useAuthContext } from '../../contexts/AuthContext';
import { View, Text } from 'react-native';
import { useEffect } from 'react';
import { router } from 'expo-router';

/**
 * Layout for instructor-specific screens
 * Provides authentication protection and consistent navigation
 */
export default function InstructorLayout() {
  const { user, isLoading } = useAuthContext();

  // Check if user is authenticated and has instructor role
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'instructor')) {
      // Redirect to login if not authenticated or not an instructor
      router.replace('/login');
    }
  }, [user, isLoading]);

  // Show loading state
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Show instructor layout if authenticated
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Instructor Dashboard' }} />
      <Stack.Screen name="activities" options={{ title: 'Manage Activities' }} />
      <Stack.Screen name="sessions" options={{ title: 'My Sessions' }} />
      <Stack.Screen name="profile" options={{ title: 'My Profile' }} />
    </Stack>
  );
}
