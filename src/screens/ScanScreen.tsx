import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import WalletConnectService from '../services/WalletConnectService';

/**
 * Écran de scan pour WalletConnect.
 * Prend en charge le scan QR (via caméra) et la saisie manuelle de l'URI.
 * Permet de connecter le portefeuille à des DApps externes.
 *
 * @returns {JSX.Element} L'interface utilisateur de l'écran de scan.
 */
function ScanScreen() {
  const navigation = useNavigation();
  const [manualUri, setManualUri] = useState('');
  const [scanning, setScanning] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if camera is available (web only)
    if (Platform.OS === 'web') {
      checkCameraAvailability();
    }
    
    // Initialize WalletConnect service
    initWalletConnect();
  }, []);

  /**
   * Vérifie la disponibilité de la caméra (Web uniquement).
   */
  const checkCameraAvailability = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        setCameraAvailable(true);
      }
    } catch (err) {
      console.log('Camera not available:', err);
      setCameraAvailable(false);
    }
  };

  /**
   * Initialise le service WalletConnect s'il ne l'est pas déjà.
   */
  const initWalletConnect = async () => {
    try {
      const wcService = WalletConnectService.getInstance();
      if (!wcService.isInitialized()) {
        await wcService.initialize();
      }
    } catch (err) {
      console.error('Failed to initialize WalletConnect:', err);
      setError('Échec de l\'initialisation de WalletConnect');
    }
  };

  /**
   * Gère le résultat d'un scan QR.
   *
   * @param {string | null} data - Les données scannées (URI).
   */
  const handleScan = (data: string | null) => {
    if (data && !scanning) {
      setScanning(true);
      handleUri(data);
    }
  };

  /**
   * Gère les erreurs de scan.
   *
   * @param {any} err - L'erreur rencontrée.
   */
  const handleError = (err: any) => {
    console.error('QR Scan error:', err);
    setError('Erreur lors du scan QR');
  };

  /**
   * Gère la soumission manuelle de l'URI.
   */
  const handleManualSubmit = () => {
    if (manualUri.trim()) {
      handleUri(manualUri.trim());
    } else {
      Alert.alert('Erreur', 'Veuillez entrer un URI WalletConnect valide');
    }
  };

  /**
   * Traite l'URI WalletConnect (scan ou manuel).
   * Initie la connexion (pairing) via le service WalletConnect.
   *
   * @param {string} uri - L'URI WalletConnect (commence par wc:).
   */
  const handleUri = async (uri: string) => {
    try {
      setError(null);
      
      // Validate URI format
      if (!uri.startsWith('wc:')) {
        throw new Error('URI WalletConnect invalide. Doit commencer par "wc:"');
      }

      const wcService = WalletConnectService.getInstance();
      await wcService.pair(uri);
      
      Alert.alert(
        'Succès',
        'Connexion WalletConnect initiée. Veuillez approuver la demande de connexion.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err: any) {
      console.error('Failed to pair:', err);
      setError(err.message || 'Échec de la connexion');
      Alert.alert('Erreur', err.message || 'Échec de la connexion WalletConnect');
    } finally {
      setScanning(false);
      setManualUri('');
    }
  };

  /**
   * Retourne à l'écran précédent ou au tableau de bord.
   */
  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // @ts-ignore
      navigation.navigate('Dashboard');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Scanner WalletConnect</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* QR Scanner section */}
      {cameraAvailable && Platform.OS === 'web' ? (
        <View style={styles.scannerContainer}>
          <Text style={styles.scannerTitle}>Scannez le QR Code</Text>
          <View style={styles.scannerPlaceholder}>
            {/* 
              Note: react-qr-reader requires additional setup for web
              For now, we'll show a placeholder and rely on manual input
              To fully enable QR scanning, integrate react-qr-reader component here
            */}
            <Text style={styles.placeholderText}>
              📷 Scanner QR activé
            </Text>
            <Text style={styles.placeholderSubtext}>
              Fonctionnalité QR en cours de développement
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.noCameraContainer}>
          <Text style={styles.noCameraText}>
            📷 Caméra non disponible
          </Text>
          <Text style={styles.noCameraSubtext}>
            Utilisez la saisie manuelle ci-dessous
          </Text>
        </View>
      )}

      {/* Manual input section */}
      <View style={styles.manualSection}>
        <Text style={styles.manualTitle}>Ou entrez l'URI manuellement</Text>
        <TextInput
          style={styles.input}
          placeholder="wc:..."
          placeholderTextColor="#999"
          value={manualUri}
          onChangeText={setManualUri}
          autoCapitalize="none"
          autoCorrect={false}
          multiline
          numberOfLines={3}
        />
        <TouchableOpacity
          style={[styles.connectButton, !manualUri.trim() && styles.connectButtonDisabled]}
          onPress={handleManualSubmit}
          disabled={!manualUri.trim() || scanning}
        >
          <Text style={styles.connectButtonText}>
            {scanning ? 'Connexion...' : 'Connecter'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>Comment utiliser :</Text>
        <Text style={styles.instructionsText}>
          1. Ouvrez l'application DApp (ex: Uniswap) dans votre navigateur
        </Text>
        <Text style={styles.instructionsText}>
          2. Cliquez sur "Connect Wallet" et sélectionnez "WalletConnect"
        </Text>
        <Text style={styles.instructionsText}>
          3. Scannez le QR code affiché ou copiez l'URI
        </Text>
        <Text style={styles.instructionsText}>
          4. Approuvez la connexion dans le modal qui apparaîtra
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  errorContainer: {
    backgroundColor: '#FFE6E6',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '500',
  },
  scannerContainer: {
    marginBottom: 30,
  },
  scannerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  scannerPlaceholder: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 250,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 24,
    color: '#333',
    marginBottom: 10,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  noCameraContainer: {
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  noCameraText: {
    fontSize: 18,
    color: '#F57C00',
    marginBottom: 8,
    fontWeight: '600',
  },
  noCameraSubtext: {
    fontSize: 14,
    color: '#E65100',
    textAlign: 'center',
  },
  manualSection: {
    marginBottom: 30,
  },
  manualTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    fontSize: 14,
    fontFamily: 'monospace',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  connectButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 15,
  },
  connectButtonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  instructions: {
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1565C0',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#1976D2',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default ScanScreen;
