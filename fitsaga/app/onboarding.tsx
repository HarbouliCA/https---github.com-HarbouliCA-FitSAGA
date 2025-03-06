import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  Alert, 
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import { TextInput } from '../components/ui/TextInput';
import { Button } from '../components/ui/Button';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { TouchableOpacity } from 'react-native-gesture-handler';

export default function OnboardingScreen() {
  const { userProfile, updateUserProfile } = useAuth();
  const colorScheme = useColorScheme();
  const tintColor = Colors[colorScheme ?? 'light'].tint;
  
  const [height, setHeight] = useState(userProfile?.height?.toString() || '');
  const [weight, setWeight] = useState(userProfile?.weight?.toString() || '');
  const [birthday, setBirthday] = useState(userProfile?.birthday || new Date(1990, 0, 1));
  const [showDateModal, setShowDateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Date picker state
  const [day, setDay] = useState(birthday.getDate().toString());
  const [month, setMonth] = useState((birthday.getMonth() + 1).toString());
  const [year, setYear] = useState(birthday.getFullYear().toString());

  const formatDate = (date: Date) => {
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const handleDateConfirm = () => {
    const newDate = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day)
    );
    
    if (isNaN(newDate.getTime())) {
      Alert.alert('Invalid Date', 'Please enter a valid date');
      return;
    }
    
    setBirthday(newDate);
    setShowDateModal(false);
  };

  const validateInputs = () => {
    if (!height || isNaN(Number(height)) || Number(height) <= 0) {
      Alert.alert('Error', 'Please enter a valid height in cm');
      return false;
    }
    
    if (!weight || isNaN(Number(weight)) || Number(weight) <= 0) {
      Alert.alert('Error', 'Please enter a valid weight in kg');
      return false;
    }
    
    const today = new Date();
    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - 100); // 100 years ago
    const maxDate = new Date();
    maxDate.setFullYear(today.getFullYear() - 13); // 13 years ago (minimum age)
    
    if (birthday < minDate || birthday > maxDate) {
      Alert.alert('Error', 'Please enter a valid birth date (between 13 and 100 years old)');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateInputs()) return;
    
    setLoading(true);
    try {
      console.log('Submitting onboarding data...');
      await updateUserProfile({
        height: Number(height),
        weight: Number(weight),
        birthday,
        onboardingCompleted: true
      });
      
      console.log('Onboarding completed successfully');
      // No need to navigate manually - the _layout.tsx will handle this automatically
      // when it detects that onboardingCompleted is true
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to save your information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#1a2151', '#323232']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ThemedView style={styles.card}>
            <ThemedText style={styles.title}>Complete Your Profile</ThemedText>
            <ThemedText style={styles.subtitle}>
              We need a few more details to personalize your experience
            </ThemedText>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Height (cm)</ThemedText>
              <TextInput
                value={height}
                onChangeText={setHeight}
                placeholder="Height in cm"
                keyboardType="numeric"
                style={styles.input}
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Weight (kg)</ThemedText>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                placeholder="Weight in kg"
                keyboardType="numeric"
                style={styles.input}
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.label}>Birthday</ThemedText>
              <TouchableOpacity 
                onPress={() => setShowDateModal(true)} 
                style={styles.dateButton}
              >
                <ThemedText>{formatDate(birthday)}</ThemedText>
              </TouchableOpacity>
            </View>

            <Button
              title={loading ? "Loading..." : "Continue"}
              onPress={handleSubmit}
              style={styles.button}
              disabled={loading}
              loading={loading}
            />
          </ThemedView>
        </ScrollView>

        {/* Date Picker Modal */}
        <Modal
          visible={showDateModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDateModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowDateModal(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={e => e.stopPropagation()}>
                <ThemedView style={styles.modalContent}>
                  <ThemedText style={styles.modalTitle}>Select Birthday</ThemedText>
                  
                  <View style={styles.dateInputContainer}>
                    <View style={styles.dateInputGroup}>
                      <ThemedText style={styles.dateInputLabel}>Day</ThemedText>
                      <TextInput
                        value={day}
                        onChangeText={setDay}
                        keyboardType="numeric"
                        maxLength={2}
                        placeholder="DD"
                        style={styles.dateInput}
                      />
                    </View>
                    
                    <View style={styles.dateInputGroup}>
                      <ThemedText style={styles.dateInputLabel}>Month</ThemedText>
                      <TextInput
                        value={month}
                        onChangeText={setMonth}
                        keyboardType="numeric"
                        maxLength={2}
                        placeholder="MM"
                        style={styles.dateInput}
                      />
                    </View>
                    
                    <View style={styles.dateInputGroup}>
                      <ThemedText style={styles.dateInputLabel}>Year</ThemedText>
                      <TextInput
                        value={year}
                        onChangeText={setYear}
                        keyboardType="numeric"
                        maxLength={4}
                        placeholder="YYYY"
                        style={styles.dateInput}
                      />
                    </View>
                  </View>
                  
                  <View style={styles.modalButtons}>
                    <Button
                      title="Cancel"
                      onPress={() => setShowDateModal(false)}
                      style={styles.modalButton}
                      variant="outline"
                    />
                    <Button
                      title="Confirm"
                      onPress={handleDateConfirm}
                      style={styles.modalButton}
                    />
                  </View>
                </ThemedView>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 10,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    opacity: 0.8,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    width: '100%',
    padding: 12,
    borderRadius: 5,
  },
  dateButton: {
    width: '100%',
    padding: 12,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  button: {
    marginTop: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  dateInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dateInputGroup: {
    flex: 1,
    marginHorizontal: 5,
  },
  dateInputLabel: {
    fontSize: 14,
    marginBottom: 5,
    textAlign: 'center',
  },
  dateInput: {
    padding: 10,
    borderRadius: 5,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
  },
});
