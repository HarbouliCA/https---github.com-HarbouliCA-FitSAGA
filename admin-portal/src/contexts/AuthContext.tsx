'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  Auth,
  User,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  auth: Auth | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  auth: null,
  user: null,
  signIn: async () => {},
  signOut: async () => {},
  loading: true,
  error: null
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!auth) {
      console.log('AuthContext - No auth instance available');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('AuthContext - Auth state changed:', user?.email);
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      console.log('AuthContext - Signing in:', email);
      const result = await signInWithEmailAndPassword(auth!, email, password);
      console.log('AuthContext - Sign in successful:', result.user.email);
      router.push('/dashboard');
    } catch (error) {
      console.error('AuthContext - Sign in error:', error);
      setError('Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      console.log('AuthContext - Signing out');
      await firebaseSignOut(auth!);
      console.log('AuthContext - Sign out successful');
      router.push('/');
    } catch (error) {
      console.error('AuthContext - Sign out error:', error);
      setError('Failed to sign out');
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        auth,
        user,
        signIn,
        signOut,
        loading,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
