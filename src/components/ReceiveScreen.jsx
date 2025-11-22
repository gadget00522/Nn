import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import useWalletStore from '../store/walletStore';

// Dynamically import QRCode only on native platforms
let QRCode = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line global-require
    QRCode = require('react-native-qrcode-svg').default;
  } catch (e) {
    console.log('QRCode library not available');
  }
}

/**
 * Écran de réception de fonds.
 * Affiche l'adresse du portefeuille sous forme de texte et de QR Code (sur mobile).
 *
 * @returns {JSX.Element} L'interface utilisateur pour recevoir des fonds.
 */
function ReceiveScreen() {
  const navigation = useNavigation();
  const address = useWalletStore((state) => state.address);
  const currentNetwork = useWalletStore((state) => state.currentNetwork);
  const setScreen = useWalletStore((state) => state.actions.setScreen);

  const [copiedMessage, setCopiedMessage] = useState(false);

  /**
   * Retourne à l'écran précédent.
   */
  const handleBack = () => {
    // Pour l’ancien App.jsx
    setScreen('dashboard');

    // Pour la navigation stack (App.tsx / web)
    if (navigation && typeof navigation.goBack === 'function') {
      try {
        navigation.goBack();
      } catch (e) {
        console.log('Navigation goBack failed:', e);
      }
    }
  };

  /**
   * Copie l'adresse dans le presse-papiers et affiche une confirmation.
   */
  const handleCopyAddress = async () => {
    if (!address) return;

    try {
      // Web: Clipboard API
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(address);
      } else {
        // Fallback React Native Clipboard
        const { Clipboard } = await import('react-native');
        Clipboard.setString(address);
      }

      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);

      Toast.show({
        type: 'success',
        text1: 'Adresse copiée',
        text2: "L'adresse a été copiée dans le presse-papiers",
      });
    } catch (error) {
      console.log('Failed to copy address:', error);
      Alert.alert('Erreur', "Impossible de copier l'adresse");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.backButton}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Recevoir</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Réseau */}
        <View style={styles.networkBadge}>
          <Text style={styles.networkBadgeText}>{currentNetwork.name} - Testnet</Text>
        </View>

        {/* QR Code ou placeholder */}
        {QRCode ? (
          <View style={styles.qrContainer}>
            <QRCode value={address || ''} size={250} />
          </View>
        ) : (
          <View style={styles.qrContainer}>
            <View style={styles.qrPlaceholderBox}>
              <Text style={styles.qrIcon}>📱</Text>
              <Text style={styles.qrText}>QR Code</Text>
              <Text style={styles.qrSubtext}>
                Le QR code est disponible uniquement sur l'application mobile.
              </Text>
              <Text style={styles.qrSubtext}>
                Utilisez le bouton &quot;Copier l&apos;adresse&quot; ci-dessous pour partager
                votre adresse.
              </Text>
            </View>
          </View>
        )}

        {/* Adresse */}
        <View style={styles.addressContainer}>
          <Text style={styles.label}>Votre adresse</Text>
          <View style={styles.addressBox}>
            <Text style={styles.address} selectable numberOfLines={3}>
              {address}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.copyButton} onPress={handleCopyAddress}>
          <Text style={styles.copyButtonText}>📋 Copier l'adresse</Text>
        </TouchableOpacity>

        {copiedMessage && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>✓ Adresse copiée !</Text>
          </View>
        )}

        {/* Avertissement réseau */}
        <View style={styles.warningBox}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            Envoyez uniquement des actifs {currentNetwork.symbol} et des tokens sur le réseau{' '}
            {currentNetwork.name}. L&apos;envoi d&apos;autres actifs peut entraîner une perte
            permanente.
          </Text>
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
  qrPlaceholderBox: {
    width: 260,
    minHeight: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
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
    textAlign: 'center',
    marginTop: 8,
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
    marginBottom: 10,
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  messageText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#3D2E1F',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#F7931A',
    marginTop: 10,
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
