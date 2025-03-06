'use client';

import { createContext, useContext } from 'react';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { firestore, auth } from '@/lib/firebase';

interface FirebaseContextType {
  firestore: Firestore | null;
  auth: Auth | null;
}

export const FirebaseContext = createContext<FirebaseContextType>({
  firestore: null,
  auth: null
});

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const FirebaseProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <FirebaseContext.Provider value={{ firestore, auth }}>
      {children}
    </FirebaseContext.Provider>
  );
};
