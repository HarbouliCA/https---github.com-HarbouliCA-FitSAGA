import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

import { useColorScheme } from '../hooks/useColorScheme';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider } from '../components/ui/ThemeProvider';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { currentUser, userProfile, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [navigationState, setNavigationState] = useState({
    initialLoadComplete: false,
    isNavigating: false,
    lastNavigationTime: 0
  });

  // Handle initial routing and subsequent navigation in a single effect
  useEffect(() => {
    // Skip if auth is still loading
    if (isLoading) {
      return;
    }

    // Skip if we're already navigating
    if (navigationState.isNavigating) {
      return;
    }

    // Skip if we've navigated recently (debounce)
    const now = Date.now();
    if (now - navigationState.lastNavigationTime < 1000) {
      return;
    }

    // Log current state for debugging
    console.log('Auth state updated:', {
      currentUser: currentUser ? `User ID: ${currentUser.uid}` : 'No user',
      userProfile: userProfile ? `Profile exists, onboarding completed: ${userProfile.onboardingCompleted}` : 'No profile',
      currentSegment: segments[0],
      fullPath: segments.join('/')
    });

    // Don't do anything if we're still waiting for user profile to load
    if (currentUser && userProfile === null) {
      console.log('User logged in but profile not loaded yet, waiting...');
      return;
    }

    // Determine where the user should be
    let targetRoute = null;
    const currentSegment = segments[0] as string;
    const isOnboardingScreen = currentSegment === 'onboarding';
    const isLoginScreen = currentSegment === 'login';
    
    // List of all tab screens that should be considered part of the main app
    const tabScreens = [
      'activities', 
      'progress', 
      'challenges', 
      'settings', 
      'nutrition', 
      'community',
      '(tabs)'
    ];
    
    const isInTabScreens = tabScreens.includes(currentSegment);

    if (!currentUser && !isLoginScreen) {
      // Not logged in - should be on login
      targetRoute = '/login';
    } else if (currentUser && userProfile && !userProfile.onboardingCompleted && !isOnboardingScreen) {
      // Logged in but onboarding not completed - should be on onboarding
      targetRoute = '/onboarding';
    } else if (currentUser && userProfile && userProfile.onboardingCompleted && !isInTabScreens) {
      // Logged in and onboarding completed - should be on main app
      // Only redirect if not already in a tab screen
      targetRoute = '/(tabs)';
    }
    
    // Only navigate if we need to go somewhere different
    if (targetRoute) {
      console.log(`Navigating to ${targetRoute}`);
      
      // Set navigating state to prevent multiple navigations
      setNavigationState(prev => ({
        ...prev,
        isNavigating: true,
        lastNavigationTime: now
      }));
      
      // Use setTimeout to prevent navigation loops
      setTimeout(() => {
        router.replace(targetRoute as any);
        
        // Reset navigation state after a delay
        setTimeout(() => {
          setNavigationState(prev => ({
            ...prev,
            initialLoadComplete: true,
            isNavigating: false
          }));
        }, 800);
      }, 100);
    } else if (!navigationState.initialLoadComplete) {
      // If we don't need to navigate but initial load isn't complete, mark it as complete
      setNavigationState(prev => ({
        ...prev,
        initialLoadComplete: true
      }));
    }
  }, [currentUser, userProfile, segments, isLoading, navigationState, router]);

  // Show a loading screen until initial navigation is complete
  if (isLoading || !navigationState.initialLoadComplete) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="loading" options={{ title: 'Loading...' }} />
      </Stack>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ title: 'Login' }} />
      <Stack.Screen name="register" options={{ title: 'Register' }} />
      <Stack.Screen name="onboarding" options={{ title: 'Onboarding' }} />
      <Stack.Screen name="(tabs)" options={{ title: 'Home' }} />
      <Stack.Screen name="activities" options={{ title: 'Activities' }} />
      <Stack.Screen name="progress" options={{ title: 'Progress' }} />
      <Stack.Screen name="challenges" options={{ title: 'Challenges' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="nutrition" options={{ title: 'Nutrition' }} />
      <Stack.Screen name="community" options={{ title: 'Community' }} />
      <Stack.Screen name="theme-showcase" options={{ title: 'Theme Showcase' }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={StyleSheet.absoluteFill}>
      <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <ThemeProvider forceDark={true}>
          <AuthProvider>
            <RootLayoutNav />
            <StatusBar style="light" />
          </AuthProvider>
        </ThemeProvider>
      </NavigationThemeProvider>
    </GestureHandlerRootView>
  );
}
