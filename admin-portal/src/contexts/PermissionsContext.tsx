'use client';

import { createContext, useContext } from 'react';
import { useFirebase } from './FirebaseContext';
import { Permission, StaffRole, rolePermissions } from '@/types';

interface PermissionsContextType {
  hasPermission: (permission: Permission) => boolean;
  loading: boolean;
  error: string | null;
}

const PermissionsContext = createContext<PermissionsContextType>({
  hasPermission: () => false,
  loading: true,
  error: null
});

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};

export const PermissionsProvider = ({ children }: { children: React.ReactNode }) => {
  const { userProfile, loading, error } = useFirebase();

  const hasPermission = (permission: Permission): boolean => {
    console.log('Checking permission:', permission);
    console.log('User profile:', userProfile);
    console.log('Loading state:', loading);

    // Return false if still loading or no user profile
    if (loading || !userProfile) {
      console.log('Still loading or no user profile');
      return false;
    }

    const userRole = userProfile.role;
    console.log('User role:', userRole);
    console.log('Available permissions:', rolePermissions[userRole]);

    // Check if the role exists in rolePermissions and if it includes the requested permission
    const hasAccess = rolePermissions[userRole]?.includes(permission) || false;
    console.log('Has permission:', hasAccess);
    return hasAccess;
  };

  return (
    <PermissionsContext.Provider 
      value={{ 
        hasPermission,
        loading,
        error: error ? 'Failed to load permissions' : null
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};
