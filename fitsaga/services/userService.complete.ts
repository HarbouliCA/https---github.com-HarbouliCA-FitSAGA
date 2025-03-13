// Import Firebase modules correctly
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Instructor, Client } from '../shared/types';

type UserRole = 'admin' | 'instructor' | 'client';

// Type guards for role-specific updates
function isInstructorUpdate(updates: Partial<User | Instructor | Client>): updates is Partial<Instructor> {
  return updates.role === 'instructor';
}

function isClientUpdate(updates: Partial<User | Instructor | Client>): updates is Partial<Client> {
  return updates.role === 'client';
}

// User data functions
export async function getUserData(uid: string): Promise<User | null> {
  try {
    const userDoc = await firestore().collection('users').doc(uid).get();
    if (!userDoc.exists) return null;
    
    const userData = userDoc.data() as User;
    
    // Get role-specific data
    if (userData.role === 'instructor') {
      const instructorDoc = await firestore().collection('instructors').doc(uid).get();
      if (instructorDoc.exists) {
        const instructorData = instructorDoc.data();
        const instructor: Instructor = {
          ...userData,
          role: 'instructor',
          dateOfBirth: instructorData?.dateOfBirth || '',
          telephone: instructorData?.telephone || userData.phoneNumber,
          workingSince: instructorData?.workingSince || new Date().toISOString(),
          address: instructorData?.address || '',
          bankDetails: instructorData?.bankDetails || {
            bankName: '',
            accountHolder: '',
            accountNumber: ''
          }
        };
        return instructor;
      }
    } else if (userData.role === 'client') {
      const clientDoc = await firestore().collection('clients').doc(uid).get();
      if (clientDoc.exists) {
        const clientData = clientDoc.data();
        const client: Client = {
          ...userData,
          role: 'client',
          memberSince: clientData?.memberSince || new Date().toISOString(),
          fitnessGoals: clientData?.fitnessGoals || [],
          healthConditions: clientData?.healthConditions || [],
          emergencyContact: clientData?.emergencyContact || {
            name: '',
            relationship: '',
            phoneNumber: ''
          }
        };
        return client;
      }
    }
    
    return userData;
  } catch (error: unknown) {
    console.error('Error getting user data:', error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Failed to get user data');
  }
}

export function subscribeToUserData(uid: string, callback: (user: User | null) => void): () => void {
  return firestore()
    .collection('users')
    .doc(uid)
    .onSnapshot(
      async (doc) => {
        if (doc.exists) {
          const userData = doc.data() as User;
          
          try {
            if (userData.role === 'instructor') {
              const instructorDoc = await firestore().collection('instructors').doc(uid).get();
              if (instructorDoc.exists) {
                const instructorData = instructorDoc.data();
                const instructor: Instructor = {
                  ...userData,
                  role: 'instructor',
                  dateOfBirth: instructorData?.dateOfBirth || '',
                  telephone: instructorData?.telephone || userData.phoneNumber,
                  workingSince: instructorData?.workingSince || new Date().toISOString(),
                  address: instructorData?.address || '',
                  bankDetails: instructorData?.bankDetails || {
                    bankName: '',
                    accountHolder: '',
                    accountNumber: ''
                  }
                };
                callback(instructor);
                return;
              }
            } else if (userData.role === 'client') {
              const clientDoc = await firestore().collection('clients').doc(uid).get();
              if (clientDoc.exists) {
                const clientData = clientDoc.data();
                const client: Client = {
                  ...userData,
                  role: 'client',
                  memberSince: clientData?.memberSince || new Date().toISOString(),
                  fitnessGoals: clientData?.fitnessGoals || [],
                  healthConditions: clientData?.healthConditions || [],
                  emergencyContact: clientData?.emergencyContact || {
                    name: '',
                    relationship: '',
                    phoneNumber: ''
                  }
                };
                callback(client);
                return;
              }
            }
            
            callback(userData);
          } catch (error: unknown) {
            console.error('Error getting role-specific data:', error);
            callback(userData);
          }
        } else {
          callback(null);
        }
      },
      (error: unknown) => {
        console.error('Error subscribing to user data:', error);
        callback(null);
      }
    );
}

// Update functions
export async function updateUserProfile(uid: string, updates: Partial<User | Instructor | Client>): Promise<void> {
  try {
    const updatedAt = new Date().toISOString();
    
    // Update base user fields
    const userUpdates = {
      fullName: updates.fullName,
      email: updates.email,
      phoneNumber: updates.phoneNumber,
      photoURL: updates.photoURL,
      updatedAt
    };

    await firestore()
      .collection('users')
      .doc(uid)
      .update(userUpdates);
    
    // Update role-specific collections
    if (isInstructorUpdate(updates)) {
      const instructorUpdates = {
        dateOfBirth: updates.dateOfBirth,
        telephone: updates.telephone,
        workingSince: updates.workingSince,
        address: updates.address,
        bankDetails: updates.bankDetails,
        updatedAt
      };
      
      await firestore()
        .collection('instructors')
        .doc(uid)
        .set(instructorUpdates, { merge: true });
    } else if (isClientUpdate(updates)) {
      const clientUpdates = {
        memberSince: updates.memberSince,
        fitnessGoals: updates.fitnessGoals,
        healthConditions: updates.healthConditions,
        emergencyContact: updates.emergencyContact,
        updatedAt
      };
      
      await firestore()
        .collection('clients')
        .doc(uid)
        .set(clientUpdates, { merge: true });
    }
    
    // Update auth display name if changed
    if (updates.fullName) {
      await auth().currentUser?.updateProfile({
        displayName: updates.fullName
      });
    }
  } catch (error: unknown) {
    console.error('Error updating user profile:', error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Failed to update user profile');
  }
}

// Permission checking
export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;
  
  // Admin has all permissions
  if (user.role === 'admin') return true;
  
  // Role-based permissions
  switch (user.role) {
    case 'instructor':
      return hasInstructorPermission(permission);
    case 'client':
      return hasClientPermission(permission);
    default:
      return false;
  }
}

function hasInstructorPermission(permission: string): boolean {
  const instructorPermissions = [
    'create:activity',
    'update:activity',
    'read:activities',
    'update:session',
    'read:sessions',
    'read:tutorials',
    'access:forum',
    'access:settings'
  ];
  return instructorPermissions.includes(permission);
}

function hasClientPermission(permission: string): boolean {
  const clientPermissions = [
    'book:session',
    'cancel:session',
    'read:sessions',
    'read:tutorials',
    'access:forum'
  ];
  return clientPermissions.includes(permission);
}

// Authentication functions
export async function signIn(email: string, password: string): Promise<User> {
  try {
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    const uid = userCredential.user.uid;
    
    // Update last login
    await firestore()
      .collection('users')
      .doc(uid)
      .update({
        lastLogin: new Date().toISOString()
      });
    
    // Get full user data
    const userData = await getUserData(uid);
    if (!userData) {
      throw new Error('User data not found');
    }
    
    // Save auth state
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    
    return userData;
  } catch (error: unknown) {
    console.error('Error signing in:', error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Failed to sign in');
  }
}

export async function signOut(): Promise<void> {
  try {
    await auth().signOut();
    await AsyncStorage.removeItem('user');
  } catch (error: unknown) {
    console.error('Error signing out:', error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Failed to sign out');
  }
}

export async function checkAuth(): Promise<User | null> {
  try {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        return JSON.parse(storedUser);
      }
      return null;
    }
    
    return await getUserData(currentUser.uid);
  } catch (error: unknown) {
    console.error('Error checking auth:', error);
    return null;
  }
}

// Send password reset email
export async function resetPassword(email: string): Promise<void> {
  try {
    await auth().sendPasswordResetEmail(email);
  } catch (error: unknown) {
    console.error('Error sending password reset email:', error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Failed to send password reset email');
  }
}
