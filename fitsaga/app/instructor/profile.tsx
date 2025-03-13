import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { router } from 'expo-router';
import firestore from '@react-native-firebase/firestore';
import { updateUserProfile } from '../../services/userService';
import { Instructor } from '../../../shared/types';

export default function InstructorProfile() {
  const { user, refreshUser } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [telephone, setTelephone] = useState('');
  const [address, setAddress] = useState('');
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [certifications, setCertifications] = useState<string[]>([]);
  const [newCertification, setNewCertification] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [iban, setIban] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  useEffect(() => {
    if (!user) return;

    // Cast user to Instructor type with type assertion
    const instructorUser = user as unknown as Instructor;

    // Set initial form values from user data
    setFullName(instructorUser.fullName || '');
    setTelephone(instructorUser.telephone || '');
    setAddress(instructorUser.address || '');
    
    if (instructorUser.specialties) {
      setSpecialties(instructorUser.specialties);
    }
    
    if (instructorUser.certifications) {
      setCertifications(instructorUser.certifications);
    }
    
    if (instructorUser.bankDetails) {
      setBankName(instructorUser.bankDetails.bankName || '');
      setAccountHolder(instructorUser.bankDetails.accountHolder || '');
      setIban(instructorUser.bankDetails.iban || '');
      setAccountNumber(instructorUser.bankDetails.accountNumber || '');
    }
  }, [user]);

  const addSpecialty = () => {
    if (newSpecialty.trim() && !specialties.includes(newSpecialty.trim())) {
      setSpecialties([...specialties, newSpecialty.trim()]);
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (index: number) => {
    const updatedSpecialties = [...specialties];
    updatedSpecialties.splice(index, 1);
    setSpecialties(updatedSpecialties);
  };

  const addCertification = () => {
    if (newCertification.trim() && !certifications.includes(newCertification.trim())) {
      setCertifications([...certifications, newCertification.trim()]);
      setNewCertification('');
    }
  };

  const removeCertification = (index: number) => {
    const updatedCertifications = [...certifications];
    updatedCertifications.splice(index, 1);
    setCertifications(updatedCertifications);
  };

  const validateIBAN = (iban: string) => {
    // Basic IBAN validation - can be expanded for more comprehensive validation
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$/;
    return ibanRegex.test(iban.replace(/\s/g, '').toUpperCase());
  };

  const handleSubmit = async () => {
    if (!user) return;

    // Validate form
    if (!fullName.trim()) {
      Alert.alert('Error', 'Full name is required');
      return;
    }

    if (iban && !validateIBAN(iban)) {
      Alert.alert('Error', 'Please enter a valid IBAN');
      return;
    }

    try {
      setSaving(true);

      // Prepare update data
      const updates = {
        fullName: fullName.trim(),
        telephone: telephone.trim(),
        address: address.trim(),
        specialties,
        certifications,
        bankDetails: {
          bankName: bankName.trim(),
          accountHolder: accountHolder.trim(),
          iban: iban.replace(/\s/g, '').toUpperCase(),
          accountNumber: accountNumber.trim(),
        },
        // Use any type to bypass FieldValue type checking
        updatedAt: firestore.FieldValue.serverTimestamp() as any,
      };

      // Update user profile
      await updateUserProfile(user.uid, updates);
      
      // Refresh user data
      if (refreshUser) {
        await refreshUser();
      }

      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={user.email}
            editable={false}
          />
          <Text style={styles.helperText}>Email cannot be changed</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Telephone</Text>
          <TextInput
            style={styles.input}
            value={telephone}
            onChangeText={setTelephone}
            placeholder="Enter your telephone number"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.textArea}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter your address"
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Professional Information</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Specialties</Text>
          {specialties.map((specialty, index) => (
            <View key={index} style={styles.tagContainer}>
              <Text style={styles.tag}>{specialty}</Text>
              <TouchableOpacity onPress={() => removeSpecialty(index)}>
                <Text style={styles.removeTag}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.addTagContainer}>
            <TextInput
              style={styles.tagInput}
              value={newSpecialty}
              onChangeText={setNewSpecialty}
              placeholder="Add a specialty"
            />
            <TouchableOpacity style={styles.addButton} onPress={addSpecialty}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Certifications</Text>
          {certifications.map((certification, index) => (
            <View key={index} style={styles.tagContainer}>
              <Text style={styles.tag}>{certification}</Text>
              <TouchableOpacity onPress={() => removeCertification(index)}>
                <Text style={styles.removeTag}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.addTagContainer}>
            <TextInput
              style={styles.tagInput}
              value={newCertification}
              onChangeText={setNewCertification}
              placeholder="Add a certification"
            />
            <TouchableOpacity style={styles.addButton} onPress={addCertification}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bank Details</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Bank Name</Text>
          <TextInput
            style={styles.input}
            value={bankName}
            onChangeText={setBankName}
            placeholder="Enter bank name"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Account Holder</Text>
          <TextInput
            style={styles.input}
            value={accountHolder}
            onChangeText={setAccountHolder}
            placeholder="Enter account holder name"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>IBAN</Text>
          <TextInput
            style={styles.input}
            value={iban}
            onChangeText={setIban}
            placeholder="Enter IBAN"
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Account Number</Text>
          <TextInput
            style={styles.input}
            value={accountNumber}
            onChangeText={setAccountNumber}
            placeholder="Enter account number"
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSubmit}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    margin: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#eee',
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: '#e9ecef',
    color: '#6c757d',
  },
  helperText: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 5,
  },
  textArea: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#eee',
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  tag: {
    fontSize: 14,
    color: '#1976d2',
  },
  removeTag: {
    fontSize: 18,
    color: '#1976d2',
    marginLeft: 8,
  },
  addTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  tagInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#eee',
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#3f51b5',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  buttonContainer: {
    margin: 15,
    marginBottom: 30,
  },
  saveButton: {
    backgroundColor: '#3f51b5',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
