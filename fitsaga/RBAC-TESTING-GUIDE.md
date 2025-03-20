# FitSAGA Mobile App RBAC Testing Guide

This guide outlines how to test the Role-Based Access Control (RBAC) implementation in the FitSAGA mobile app.

## Prerequisites

1. **Test User Accounts**
   - Create test accounts in Firebase Authentication for each role:
     - Regular User: `user@example.com`
     - Instructor: `instructor@example.com`
     - Admin: `admin@example.com`
   - Ensure each account has the correct role assigned in Firestore

2. **Fix Expo Environment Issues**
   - If you're experiencing node_modules corruption issues:
     - Delete the node_modules folder (may require admin privileges or special tools)
     - Run `npm install` to reinstall dependencies
     - If issues persist, consider using a fresh clone of the repository

## Manual Testing Procedure

### 1. Testing Regular User Access

1. **Login as Regular User**
   - Email: `user@example.com`
   - Password: (your test password)

2. **Verify Access To:**
   - Home screen
   - Activities (view only)
   - Sessions (booking only)
   - Profile settings
   - Community features

3. **Verify Restrictions:**
   - Try to navigate to `/instructor` routes (should be blocked)
   - Try to create/modify activities (should be blocked)
   - Try to manage sessions (should be blocked)

### 2. Testing Instructor Access

1. **Login as Instructor**
   - Email: `instructor@example.com`
   - Password: (your test password)

2. **Verify Access To:**
   - Instructor dashboard at `/instructor`
   - Session management at `/instructor/sessions`
   - Activity creation at `/instructor/activities`
   - Instructor profile at `/instructor/profile`

3. **Verify Permissions:**
   - Create and manage activities
   - Manage assigned sessions only
   - Access forum
   - Access settings

### 3. Testing Admin Access

1. **Login as Admin**
   - Email: `admin@example.com`
   - Password: (your test password)

2. **Verify Access To:**
   - All regular user features
   - All instructor features
   - Admin-specific features
   - Instructor management

3. **Verify Permissions:**
   - Manage all activities
   - Manage all sessions
   - Create/edit/delete instructors
   - Modify system settings

## Code Review Checklist

### 1. Authentication Context (`AuthContext.tsx`)
- [ ] User roles are properly defined
- [ ] Role-based redirects are implemented
- [ ] User profile data includes role information

### 2. Protected Routes
- [ ] Regular user routes are protected
- [ ] Instructor routes are protected with role check
- [ ] Admin routes are protected with role check

### 3. Conditional UI Rendering
- [ ] Components show/hide features based on user roles
- [ ] Instructor-specific UI elements only appear for instructors
- [ ] Admin-specific UI elements only appear for admins

### 4. Firebase Security Rules
- [ ] Activities collection has proper rules
- [ ] Sessions collection has proper rules
- [ ] Instructors collection has proper rules

## Troubleshooting

If you encounter issues during testing:

1. **Authentication Issues**
   - Verify user exists in Firebase Authentication
   - Check user role in Firestore

2. **Navigation Issues**
   - Check route protection in `_layout.tsx` files
   - Verify navigation state is properly managed

3. **Permission Issues**
   - Review Firebase security rules
   - Check conditional rendering logic in components
