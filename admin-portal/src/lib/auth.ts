import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, firestore } from '@/lib/firebase';
import { doc, getDoc, Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';

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

        if (!auth || !firestore) {
          throw new Error('Firebase not initialized');
        }

        try {
          // Sign in with Firebase
          const { user } = await signInWithEmailAndPassword(
            auth as Auth,
            credentials.email,
            credentials.password
          );

          // Get additional user data from Firestore
          const userDoc = await getDoc(doc(firestore as Firestore, 'users', user.uid));
          if (!userDoc.exists()) {
            throw new Error('User not found in database');
          }

          const userData = userDoc.data();
          return {
            id: user.uid,
            email: user.email || '',
            name: userData.name,
            role: userData.role,
            accessStatus: userData.accessStatus,
          } as any; // This is safe because we've extended the User type above
        } catch (error) {
          console.error('Authentication error:', error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Include additional user data in the JWT token
        token.role = (user as any).role;
        token.accessStatus = (user as any).accessStatus;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        // Include additional user data in the session
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
        (session.user as any).accessStatus = token.accessStatus;
      }
      return session;
    },
  },
};
