import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../components/ui/ThemeProvider';

const SETTINGS_OPTIONS = [
  { id: 'profile', title: 'Edit Profile', icon: 'person-outline' },
  { id: 'notifications', title: 'Notifications', icon: 'notifications-outline' },
  { id: 'privacy', title: 'Privacy & Security', icon: 'shield-outline' },
  { id: 'appearance', title: 'Appearance', icon: 'color-palette-outline' },
  { id: 'help', title: 'Help & Support', icon: 'help-circle-outline' },
  { id: 'about', title: 'About', icon: 'information-circle-outline' },
];

export default function SettingsScreen() {
  const { logout, userProfile } = useAuth();
  const { colors } = useTheme();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login' as any);
    } catch (error) {
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Settings' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title" style={styles.title}>Settings</ThemedText>
        
        {/* User Profile Summary */}
        <ThemedView style={styles.profileCard}>
          <ThemedText type="subtitle">{userProfile?.name || 'User'}</ThemedText>
          <ThemedText>{userProfile?.email || ''}</ThemedText>
        </ThemedView>
        
        {/* Settings Options */}
        <ThemedView style={styles.optionsContainer}>
          {SETTINGS_OPTIONS.map((option) => (
            <TouchableOpacity 
              key={option.id}
              style={styles.optionItem}
              onPress={() => Alert.alert('Coming Soon', `${option.title} will be available soon!`)}
            >
              <Ionicons name={option.icon as any} size={24} color={colors.text} />
              <ThemedText style={styles.optionText}>{option.title}</ThemedText>
              <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
            </TouchableOpacity>
          ))}
        </ThemedView>
        
        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutButton, { borderColor: colors.border }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color={colors.error} />
          <ThemedText style={[styles.logoutText, { color: colors.error }]}>Logout</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    marginBottom: 20,
  },
  profileCard: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  optionsContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 30,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
  },
  optionText: {
    flex: 1,
    marginLeft: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
  },
  logoutText: {
    marginLeft: 10,
    fontWeight: '600',
  },
});
