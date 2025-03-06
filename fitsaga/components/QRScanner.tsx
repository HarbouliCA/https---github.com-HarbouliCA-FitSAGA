import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, Alert } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

interface QRScannerProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function QRScanner({ onClose, onSuccess }: QRScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { userProfile, refreshUserProfile } = useAuth();

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (isProcessing || scanned) return;
    
    setScanned(true);
    setIsProcessing(true);
    
    try {
      // Verify the QR code is valid for gym check-in
      if (!data.startsWith('sagafitness:checkin:')) {
        Alert.alert('Invalid QR Code', 'This QR code is not valid for gym check-in.');
        setIsProcessing(false);
        return;
      }
      
      if (!userProfile) {
        Alert.alert('Error', 'User profile not found.');
        setIsProcessing(false);
        return;
      }
      
      // Check if user has enough credits
      if (userProfile.credits <= 0) {
        Alert.alert('Access Denied', 'You do not have enough credits to check in.');
        setIsProcessing(false);
        return;
      }
      
      // Record check-in in Firestore
      const userRef = doc(firestore, 'users', userProfile.uid);
      const checkInRef = doc(firestore, 'checkIns', `${userProfile.uid}_${new Date().toISOString().split('T')[0]}`);
      
      // Check if user already checked in today
      const checkInDoc = await getDoc(checkInRef);
      if (checkInDoc.exists()) {
        Alert.alert('Already Checked In', 'You have already checked in today.');
        setIsProcessing(false);
        return;
      }
      
      // Create check-in record
      await setDoc(checkInRef, {
        userId: userProfile.uid,
        timestamp: serverTimestamp(),
        gymLocation: data.replace('sagafitness:checkin:', '')
      });
      
      // Update user's score credit
      await updateDoc(userRef, {
        credits: userProfile.credits - 1, // Deduct 1 credit for check-in
        updatedAt: new Date()
      });
      
      // Refresh user profile to get updated credit score
      await refreshUserProfile();
      
      Alert.alert('Success', 'You have successfully checked in!');
      onSuccess();
    } catch (error) {
      console.error('Check-in error:', error);
      Alert.alert('Error', 'Failed to process check-in. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }
  
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={styles.scanner}
      />
      
      {scanned && (
        <Button title="Scan Again" onPress={() => setScanned(false)} />
      )}
      
      <Button title="Cancel" onPress={onClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  scanner: {
    flex: 1,
  },
});
