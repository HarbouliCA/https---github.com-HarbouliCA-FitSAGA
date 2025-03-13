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
          // Sign in with Firebase Authentication
          const { user: firebaseUser } = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
          );

          console.log('Firebase Auth successful for:', firebaseUser.email);

          // Get user data from Firestore
          const userRef = adminFirestore.collection('users').doc(firebaseUser.uid);
          const userDoc = await userRef.get();

          if (!userDoc.exists) {
            console.error('User document not found in Firestore for UID:', firebaseUser.uid);
            
            // Try to find user by email as fallback
            const userByEmailQuery = await adminFirestore.collection('users')
              .where('email', '==', firebaseUser.email)
              .limit(1)
              .get();
            
            if (userByEmailQuery.empty) {
              console.error('No user found by email either:', firebaseUser.email);
              throw new Error('User not found in database');
            }
            
            const userByEmail = userByEmailQuery.docs[0];
            console.log('Found user by email instead of UID:', userByEmail.id);
            
            // Update the user document with the correct UID
            await adminFirestore.collection('users').doc(firebaseUser.uid).set({
              ...userByEmail.data(),
              uid: firebaseUser.uid
            });
            
            // Delete the old document if it has a different ID
            if (userByEmail.id !== firebaseUser.uid) {
              await adminFirestore.collection('users').doc(userByEmail.id).delete();
              console.log('Updated user document with correct UID');
            }
            
            // Fetch the updated document
            const updatedDoc = await userRef.get();
            if (!updatedDoc.exists) {
              throw new Error('Failed to update user document');
            }
            
            const userData = updatedDoc.data();
            console.log('Updated user data:', userData);
            
            // Check role and status
            if (userData?.role !== 'admin' && userData?.role !== 'instructor') {
              console.error(`Unauthorized role: ${userData?.role}`);
              throw new Error('Unauthorized - Admin or instructor access required');
            }
            
            if (userData?.accessStatus !== 'active' && userData?.accessStatus !== 'green') {
              console.error(`Inactive account: ${userData?.accessStatus}`);
              throw new Error('Account is not active');
            }
            
            return {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: userData.fullName || userData.name || '',
              role: userData.role,
              accessStatus: userData.accessStatus,
            };
          }

          const userData = userDoc.data();
          console.log('User data from Firestore:', userData);
          
          // Check if user has appropriate role (admin or instructor)
          if (userData?.role !== 'admin' && userData?.role !== 'instructor') {
            console.error(`Unauthorized role: ${userData?.role}`);
            throw new Error('Unauthorized - Admin or instructor access required');
          }

          // Check if user has active status - allow both 'active' and 'green' statuses
          if (userData?.accessStatus !== 'green' && userData?.accessStatus !== 'active') {
            console.error(`Inactive account: ${userData?.accessStatus}`);
            throw new Error('Account is not active');
          }

          return {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: userData.fullName || userData.name || '',
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
