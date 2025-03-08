import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { adminFirestore } from '@/lib/firebase-admin';
import { doc, getDoc } from 'firebase/firestore';

// Extend the built-in session types
declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    accessStatus: string;
  }

  interface Session {
    user: User & {
      id: string;
      role: string;
      accessStatus: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    accessStatus?: string;
  }
}

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        try {
          // Sign in with Firebase Auth
          const { user: firebaseUser } = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
          );

          // Get additional user data from Firestore using Admin SDK
          const userDoc = await adminFirestore.collection('users').doc(firebaseUser.uid).get();
          
          if (!userDoc.exists) {
            throw new Error('User not found in database');
          }

          const userData = userDoc.data();
          
          // Check if user is an admin
          if (userData?.role !== 'admin') {
            throw new Error('Unauthorized - Admin access required');
          }

          // Check if user has active status
          if (userData?.accessStatus !== 'green') {
            throw new Error('Account is not active');
          }

          return {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: userData.name || '',
            role: userData.role,
            accessStatus: userData.accessStatus,
          };
        } catch (error: any) {
          console.error('Authentication error:', error);
          
          // Handle Firebase Auth errors
          if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            throw new Error('Invalid email or password');
          }
          if (error.code === 'auth/too-many-requests') {
            throw new Error('Too many failed attempts. Try again later');
          }
          
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.accessStatus = user.accessStatus;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.accessStatus = token.accessStatus as string;
      }
      return session;
    },
  },
};
