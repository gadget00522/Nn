import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useWalletStore from '../store/walletStore';
import { useNavigation } from '@react-navigation/native';

// Dynamically import QRCode only on native platforms
let QRCode = null;
if (Platform.OS !== 'web') {
  try {
    QRCode = require('react-native-qrcode-svg').default;
  } catch (e) {
    console.log('QRCode library not available');
  }
}

function ReceiveScreen() {
  const navigation = useNavigation();
  const address = useWalletStore((state) => state.address);
  const currentNetwork = useWalletStore((state) => state.currentNetwork);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleCopyAddress = () => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(address);
      Toast.show({
        type: 'success',
        text1: 'Adresse copiée',
        text2: 'L\'adresse a été copiée dans le presse-papiers',
      });
    } else {
      // For native, you would use Clipboard from react-native
      Toast.show({
        type: 'success',
        text1: 'Adresse copiée',
        text2: 'L\'adresse a été copiée',
      });
  const setScreen = useWalletStore((state) => state.actions.setScreen);
  
  // Use React Navigation when available (web/App.tsx)
  let navigation = null;
  try {
    navigation = useNavigation();
  } catch (e) {
    // Navigation not available (App.jsx), will use store-based navigation
  }

  const handleBack = () => {
    // For store-based navigation (App.jsx)
    setScreen('dashboard');
    
    // For React Navigation (App.tsx / web)
    if (navigation && typeof navigation.goBack === 'function') {
      try {
        navigation.goBack();
      } catch (e) {
        console.log('Navigation goBack failed:', e);
      }
    }
  };

  const handleCopyAddress = async () => {
    try {
      // Try web clipboard API first
      if (Platform.OS === 'web' && navigator.clipboard) {
        await navigator.clipboard.writeText(address);
        setCopiedMessage(true);
        setTimeout(() => {
          setCopiedMessage(false);
        }, 2000);
      } else {
        // Fallback to React Native Clipboard
        const { default: Clipboard } = await import('react-native').then(rn => ({ default: rn.Clipboard }));
        Clipboard.setString(address);
        setCopiedMessage(true);
        setTimeout(() => {
          setCopiedMessage(false);
        }, 2000);
      }
    } catch (error) {
      console.log('Failed to copy address:', error);
      Alert.alert('Erreur', 'Impossible de copier l\'adresse');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.backButton}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Recevoir</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.networkBadge}>
          <Text style={styles.networkBadgeText}>{currentNetwork.name} - Testnet</Text>
        </View>

        <View style={styles.qrContainer}>
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrIcon}>📱</Text>
            <Text style={styles.qrText}>QR Code</Text>
            <Text style={styles.qrSubtext}>Scannez pour recevoir</Text>
          </View>
        </View>

        <View style={styles.addressContainer}>
          <Text style={styles.label}>Votre adresse</Text>
          <View style={styles.addressBox}>
            <Text style={styles.address} numberOfLines={2}>
              {address}
            </Text>
          </View>
        </View>
      {QRCode ? (
        <View style={styles.qrContainer}>
          <QRCode value={address} size={250} />
        </View>
      ) : (
        <View style={styles.qrContainer}>
          <Text style={styles.qrPlaceholder}>
            📱 Le QR code est disponible uniquement sur l'application mobile.
          </Text>
          <Text style={styles.qrSubtext}>
            Utilisez le bouton "Copier l'adresse" ci-dessous pour partager votre adresse.
          </Text>
        </View>
      )}

      <View style={styles.addressContainer}>
        <Text style={styles.label}>Votre adresse :</Text>
        <Text style={styles.address} selectable={true}>{address}</Text>
      </View>

        <TouchableOpacity 
          style={styles.copyButton} 
          onPress={handleCopyAddress}>
          <Text style={styles.copyButtonText}>📋 Copier l'adresse</Text>
        </TouchableOpacity>

        <View style={styles.warningBox}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            Envoyez uniquement des actifs {currentNetwork.symbol} et des tokens sur le réseau {currentNetwork.name}. L'envoi d'autres actifs peut entraîner une perte permanente.
          </Text>
      {copiedMessage && (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>✓ Adresse copiée !</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#24272A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#3C4043',
  },
  backButton: {
    color: '#037DD6',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  networkBadge: {
    backgroundColor: '#2D3748',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 30,
  },
  networkBadgeText: {
    color: '#F7931A',
    fontSize: 12,
    fontWeight: '600',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  qrPlaceholder: {
    width: 250,
    height: 250,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrIcon: {
    fontSize: 60,
    marginBottom: 10,
  },
  qrText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  qrSubtext: {
    fontSize: 14,
    color: '#666',
    marginVertical: 30,
    padding: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    minHeight: 290,
  },
  qrPlaceholder: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  qrSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  addressContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#8B92A6',
    marginBottom: 10,
    fontWeight: '600',
  },
  addressBox: {
    backgroundColor: '#141618',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#3C4043',
  },
  address: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  copyButton: {
    backgroundColor: '#037DD6',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#3D2E1F',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#F7931A',
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  warningText: {
    flex: 1,
    color: '#F7931A',
    fontSize: 12,
    lineHeight: 18,
  },
});

export default ReceiveScreen;
