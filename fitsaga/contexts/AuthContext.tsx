import React, { createContext, useState, useContext, useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserData, subscribeToUserData, hasPermission } from '../services/userService';
import { User } from '../shared/types';
import { router } from 'expo-router';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  refreshUser: async () => {},
  hasPermission: () => false,
  logout: async () => {},
});

export const useAuthContext = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to refresh user data from Firestore
  const refreshUser = async () => {
    try {
      const currentUser = auth().currentUser;
      if (currentUser) {
        const userData = await getUserData(currentUser.uid);
        setUser(userData);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  // Check permission wrapper
  const checkPermission = (permission: string) => {
    return hasPermission(user, permission);
  };

  // Logout function
  const logout = async () => {
    try {
      await auth().signOut();
      setUser(null);
      await AsyncStorage.removeItem('user');
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Initialize auth state
  useEffect(() => {
    let userSubscription: () => void;

    // Listen for authentication state changes
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is signed in
          const userData = await getUserData(firebaseUser.uid);
          setUser(userData);
          await AsyncStorage.setItem('user', JSON.stringify(userData));

          // Subscribe to user data changes
          userSubscription = subscribeToUserData(firebaseUser.uid, (updatedUserData) => {
            setUser(updatedUserData);
            AsyncStorage.setItem('user', JSON.stringify(updatedUserData));
          });
        } else {
          // User is signed out
          setUser(null);
          await AsyncStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
      } finally {
        setIsLoading(false);
      }
    });

    // Check for cached user data on startup
    const checkCachedUser = async () => {
      try {
        const cachedUser = await AsyncStorage.getItem('user');
        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
        }
      } catch (error) {
        console.error('Error checking cached user:', error);
      }
    };

    checkCachedUser();

    // Cleanup subscriptions
    return () => {
      unsubscribe();
      if (userSubscription) {
        userSubscription();
      }
    };
  }, []);

  // Redirect based on authentication and role
  useEffect(() => {
    if (!isLoading) {
      // Get current path from window location since router.pathname is not available
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      
      // Handle unauthenticated users
      if (!user && !currentPath.includes('/login') && !currentPath.includes('/register') && !currentPath.includes('/onboarding')) {
        router.replace('/login');
      }
      
      // Handle authenticated users with specific roles
      if (user) {
        // Redirect from login/register pages if already authenticated
        if (currentPath.includes('/login') || currentPath.includes('/register')) {
          if (user.role === 'instructor') {
            router.replace('/instructor');
          } else {
            router.replace('/');
          }
        }
        
        // Ensure instructors can access instructor routes
        if (currentPath.includes('/instructor') && user.role !== 'instructor' && user.role !== 'admin') {
          router.replace('/');
        }
      }
    }
  }, [user, isLoading]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        refreshUser,
        hasPermission: checkPermission,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
