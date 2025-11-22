import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Platform, ScrollView
} from 'react-native';
import Toast from 'react-native-toast-message';
import { ethers } from 'ethers';
import useWalletStore from '../store/walletStore';
import { auth } from '../firebaseConfig';
import { linkWalletAddressToUser } from '../services/authService';
import { useNavigation } from '@react-navigation/native';

/**
 * Écran permettant à l'utilisateur d'importer un portefeuille existant via sa phrase de récupération.
 * Gère la validation de la mnémonique, le chiffrement local et le lien avec le compte utilisateur.
 *
 * @param {any} props - Les propriétés du composant (navigation).
 * @returns {JSX.Element} L'interface utilisateur pour l'importation.
 */
function ImportWalletScreen({ navigation: navProp }: any) {
  const navigation = useNavigation();
  const [mnemonic, setMnemonic] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const importWalletFromMnemonic = useWalletStore((s) => s.actions.importWalletFromMnemonic);

  /**
   * Valide la phrase mnémonique et le mot de passe, puis lance l'importation.
   * Lie également l'adresse du portefeuille au compte utilisateur Firebase si connecté.
   */
  const validateAndImportWallet = async () => {
    const trimmed = mnemonic.trim();

    if (!trimmed) {
      Toast.show({ type: 'error', text1: 'Mnemonic requise', text2: 'Entrer la phrase.' });
      return;
    }

    const words = trimmed.split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      Toast.show({ type: 'error', text1: 'Format invalide', text2: '12 ou 24 mots.' });
      return;
    }

    if (Platform.OS === 'web' && !password) {
      Toast.show({ type: 'error', text1: 'Mot de passe requis', text2: 'Pour chiffrement local demo.' });
      return;
    }

    setIsLoading(true);

    try {
      ethers.Wallet.fromMnemonic(trimmed);
    } catch {
      setIsLoading(false);
      Toast.show({ type: 'error', text1: 'Mnemonic invalide', text2: 'Vérifie chaque mot.' });
      return;
    }

    try {
      const address = await importWalletFromMnemonic(trimmed, password || undefined);

      const currentUser = auth.currentUser;
      if (currentUser) {
        await linkWalletAddressToUser(currentUser.uid, address);
        Toast.show({
          type: 'success',
          text1: 'Wallet importé',
          text2: 'Adresse liée à ton compte.'
        });
      } else {
        Toast.show({
          type: 'success',
          text1: 'Wallet importé',
          text2: 'Tu peux l’utiliser maintenant.'
        });
      }

      // Aller sur Locked (doit déverrouiller)
      navigation.navigate('Locked');
    } catch (e: any) {
      console.error('Import error:', e);
      Toast.show({
        type: 'error',
        text1: "Erreur d'importation",
        text2: e?.message || "Import impossible."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Importer un wallet</Text>
        <Text style={styles.subtitle}>Entrez votre phrase (12 ou 24 mots)</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Phrase de récupération</Text>
        <TextInput
          style={styles.mnemonicInput}
          placeholder="mots séparés par des espaces"
          placeholderTextColor="#8B92A6"
          value={mnemonic}
          onChangeText={setMnemonic}
          multiline
          numberOfLines={4}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {Platform.OS === 'web' && (
          <>
            <Text style={styles.label}>Mot de passe (chiffrement local)</Text>
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor="#8B92A6"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </>
        )}

        <View style={styles.securityWarning}>
          <Text style={styles.warningTitle}>⚠️ Sécurité</Text>
          <Text style={styles.warningText}>• Phrase jamais envoyée au serveur</Text>
          <Text style={styles.warningText}>• Adresse publique seule stockée (Firestore)</Text>
          <Text style={styles.warningText}>• Phrase chiffrée localement</Text>
          {Platform.OS === 'web' && <Text style={styles.warningText}>• Version web: stockage démo</Text>}
        </View>

        <TouchableOpacity
          style={[styles.importButton, isLoading && styles.buttonDisabled]}
          onPress={validateAndImportWallet}
          disabled={isLoading}
        >
          <Text style={styles.importButtonText}>
            {isLoading ? 'Importation...' : 'Importer le wallet'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#24272A' },
  contentContainer: { padding: 20 },
  header: { marginBottom: 30, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#8B92A6', textAlign: 'center' },
  form: { width: '100%' },
  label: { fontSize: 14, color: '#D6D9DC', marginBottom: 8, fontWeight: '600' },
  mnemonicInput: {
    backgroundColor: '#141618', borderRadius: 8, padding: 12,
    fontSize: 16, color: '#FFFFFF', marginBottom: 16,
    borderWidth: 1, borderColor: '#3C4043', minHeight: 100, textAlignVertical: 'top'
  },
  input: {
    backgroundColor: '#141618', borderRadius: 8, padding: 12,
    fontSize: 16, color: '#FFFFFF', marginBottom: 16,
    borderWidth: 1, borderColor: '#3C4043'
  },
  securityWarning: {
    backgroundColor: '#2D3748', borderRadius: 8, padding: 16,
    marginBottom: 24, borderLeftWidth: 4, borderLeftColor: '#F59E0B'
  },
  warningTitle: { fontSize: 16, fontWeight: 'bold', color: '#F59E0B', marginBottom: 8 },
  warningText: { fontSize: 13, color: '#D6D9DC', marginBottom: 4 },
  importButton: {
    backgroundColor: '#037DD6', paddingVertical: 14, borderRadius: 999,
    alignItems: 'center', marginBottom: 12
  },
  buttonDisabled: { opacity: 0.6 },
  importButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  cancelButton: {
    backgroundColor: 'transparent', paddingVertical: 14, borderRadius: 999,
    alignItems: 'center', borderWidth: 1, borderColor: '#3C4043'
  },
  cancelButtonText: { color: '#8B92A6', fontSize: 15, fontWeight: '600' },
});

export default ImportWalletScreen;
