import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { auth, firestore } from '../config/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';

// Define types
type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

type UserProfile = {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  credits: number;
  role: 'user' | 'trainer' | 'admin';
  memberSince: Date;
  lastActive: Date;
  height?: number; // in cm
  weight?: number; // in kg
  birthday?: Date;
  onboardingCompleted: boolean;
};

type AuthContextType = {
  currentUser: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<UserProfile | null>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for cached user on startup
  useEffect(() => {
    const loadCachedUser = async () => {
      try {
        const cachedUserJson = await AsyncStorage.getItem('user');
        if (cachedUserJson) {
          const cachedUser = JSON.parse(cachedUserJson);
          setCurrentUser(cachedUser);
          // If we have a cached user, fetch their profile
          if (cachedUser && cachedUser.uid) {
            await fetchUserProfile(cachedUser.uid);
          }
        }
      } catch (error) {
        console.error('Error loading cached user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCachedUser();
  }, []);

  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid: string) => {
    console.log('Fetching user profile for UID:', uid);
    try {
      const userDoc = await getDoc(doc(firestore, 'users', uid));
      
      if (userDoc.exists()) {
        console.log('User document found in Firestore');
        const userData = userDoc.data() as UserProfile;
        
        // Convert Firestore timestamps to Date objects
        const profile: UserProfile = {
          ...userData,
          memberSince: userData.memberSince instanceof Timestamp 
            ? userData.memberSince.toDate() 
            : userData.memberSince,
          lastActive: userData.lastActive instanceof Timestamp 
            ? userData.lastActive.toDate() 
            : userData.lastActive,
          birthday: userData.birthday instanceof Timestamp 
            ? userData.birthday.toDate() 
            : userData.birthday,
        };
        
        console.log('User profile processed successfully');
        setUserProfile(profile);
        return profile;
      } else {
        console.warn('User document not found in Firestore');
        setUserProfile(null);
        return null;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile(null);
      return null;
    }
  };

  // Refresh user profile
  const refreshUserProfile = async (): Promise<UserProfile | null> => {
    if (!currentUser) {
      console.log('No current user, cannot refresh profile');
      return null;
    }
    
    try {
      const uid = currentUser.uid;
      console.log('Fetching user profile from Firestore for UID:', uid);
      const userDoc = await getDoc(doc(firestore, 'users', uid));
      
      if (userDoc.exists()) {
        console.log('User profile found in Firestore');
        const userData = userDoc.data() as UserProfile;
        
        // Convert Firestore timestamps to Date objects
        const profile: UserProfile = {
          ...userData,
          memberSince: userData.memberSince instanceof Timestamp 
            ? userData.memberSince.toDate() 
            : userData.memberSince,
          lastActive: userData.lastActive instanceof Timestamp 
            ? userData.lastActive.toDate() 
            : userData.lastActive,
          birthday: userData.birthday instanceof Timestamp 
            ? userData.birthday.toDate() 
            : userData.birthday,
          // Ensure onboardingCompleted has a default value if it's undefined
          onboardingCompleted: userData.onboardingCompleted === true
        };
        
        console.log('User profile processed:', JSON.stringify({
          uid: profile.uid,
          email: profile.email,
          onboardingCompleted: profile.onboardingCompleted
        }));
        
        setUserProfile(profile);
        return profile;
      } else {
        console.warn('User document not found in Firestore for ID:', uid);
        setUserProfile(null);
        return null;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserProfile(null);
      return null;
    }
  };

  // Handle user authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true);
      
      if (user) {
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        };
        
        setCurrentUser(userData);
        
        // Cache user data in AsyncStorage
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        
        // Get user profile from Firestore
        await refreshUserProfile();
        
        // Update last active timestamp
        try {
          await updateDoc(doc(firestore, 'users', user.uid), {
            lastActive: serverTimestamp()
          });
        } catch (error) {
          console.error('Error updating last active timestamp:', error);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        // Clear cached user data
        await AsyncStorage.removeItem('user');
      }
      
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log('Starting login process...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('Firebase authentication successful, user ID:', user.uid);
      
      // Set current user first - use the actual Firebase user object
      setCurrentUser(user);
      
      // Check if user profile exists in Firestore
      console.log('Checking if user profile exists in Firestore...');
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // If no profile exists, create a basic one
        console.log('No profile found in Firestore, creating a basic profile');
        const now = new Date();
        const basicProfile: UserProfile = {
          uid: user.uid,
          email: email || '',
          name: user.displayName || email.split('@')[0] || 'User',
          credits: 0,
          role: 'user',
          memberSince: now,
          lastActive: now,
          onboardingCompleted: false
        };
        
        await setDoc(userDocRef, basicProfile);
        // Set the profile in state directly
        setUserProfile(basicProfile);
        console.log('Basic profile created and set in state');
      } else {
        // Profile exists, load it directly
        console.log('User profile found in Firestore, loading it directly');
        const userData = userDoc.data() as UserProfile;
        
        // Convert Firestore timestamps to Date objects
        const profile: UserProfile = {
          ...userData,
          memberSince: userData.memberSince instanceof Timestamp 
            ? userData.memberSince.toDate() 
            : userData.memberSince,
          lastActive: userData.lastActive instanceof Timestamp 
            ? userData.lastActive.toDate() 
            : userData.lastActive,
          birthday: userData.birthday instanceof Timestamp 
            ? userData.birthday.toDate() 
            : userData.birthday,
          // Ensure onboardingCompleted has a default value if it's undefined
          onboardingCompleted: userData.onboardingCompleted === true
        };
        
        // Set the profile in state directly
        setUserProfile(profile);
        console.log('Existing profile loaded and set in state');
      }
      
      console.log('Login successful');
      
      // Add a small delay before completing login to prevent UI flicker
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      console.error('Login error:', error);
      setCurrentUser(null);
      setUserProfile(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      console.log('Starting registration process...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User created in Firebase Auth, creating profile in Firestore...');
      
      const now = new Date();
      const userProfile: UserProfile = {
        uid: userCredential.user.uid,
        email: email,
        name: name,
        credits: 0,
        role: 'user',
        memberSince: now,
        lastActive: now,
        onboardingCompleted: false,
      };
      
      console.log('Creating user document in Firestore...');
      await setDoc(doc(firestore, 'users', userCredential.user.uid), userProfile);
      console.log('User profile created in Firestore');
      
      setCurrentUser(userCredential.user);
      setUserProfile(userProfile);
      console.log('Registration completed successfully');
    } catch (error: any) {
      console.error('Registration error:', error);
      setCurrentUser(null);
      setUserProfile(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('user');
      setCurrentUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Logout Error', 'Failed to logout. Please try again.');
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (data: Partial<UserProfile>) => {
    try {
      if (!currentUser) {
        console.error('Cannot update profile: No user is logged in');
        return;
      }
      
      console.log('Updating user profile with data:', JSON.stringify(data));
      await updateDoc(doc(firestore, 'users', currentUser.uid), data);
      
      // Update local state immediately for better UX
      if (userProfile) {
        const updatedProfile = {
          ...userProfile,
          ...data
        };
        console.log('Updated profile locally:', JSON.stringify({
          uid: updatedProfile.uid,
          onboardingCompleted: updatedProfile.onboardingCompleted
        }));
        setUserProfile(updatedProfile);
      }
      
      // Also refresh from server to ensure consistency
      await refreshUserProfile();
      console.log('Profile refreshed from server');
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    userProfile,
    isLoading,
    login,
    register,
    logout,
    refreshUserProfile,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Create custom hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
