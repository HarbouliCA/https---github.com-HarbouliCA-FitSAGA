'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User as FirebaseUser, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  Auth,
  UserCredential
} from 'firebase/auth';
import { doc, getDoc, setDoc, Firestore } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';
import { User } from '@/types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Only run this effect on the client side
    if (typeof window === 'undefined' || !auth) return;

    const unsubscribe = onAuthStateChanged(auth as Auth, async (firebaseUser) => {
      setIsLoading(true);
      if (firebaseUser) {
        setFirebaseUser(firebaseUser);
        try {
          // Fetch user profile from Firestore
          if (firestore) {
            const userDoc = await getDoc(doc(firestore as Firestore, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data() as User;
              
              // Set user data regardless of role for now (for testing)
              setUser(userData);
              setIsAdmin(true); // Temporarily set all users as admin for testing
            } else {
              console.log('User document does not exist in Firestore. Creating a basic user document...');
              
              // Create a basic user document for testing
              const basicUserData: User = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                name: firebaseUser.displayName || 'Admin User',
                role: 'admin',
                credits: 0,
                memberSince: new Date(),
                lastActive: new Date(),
                onboardingCompleted: true,
                accessStatus: 'green'
              };
              
              // Set the user in state
              setUser(basicUserData);
              setIsAdmin(true);
              
              // Try to save this user to Firestore
              try {
                await setDoc(doc(firestore as Firestore, 'users', firebaseUser.uid), basicUserData);
                console.log('Created basic user document in Firestore');
              } catch (error) {
                console.error('Failed to create user document:', error);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUser(null);
          setIsAdmin(false);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<UserCredential> => {
    if (!auth) throw new Error('Firebase auth not initialized');
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth as Auth, email, password);
      return userCredential;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    if (!auth) throw new Error('Firebase auth not initialized');
    
    try {
      await firebaseSignOut(auth as Auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    isLoading,
    isAdmin,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
