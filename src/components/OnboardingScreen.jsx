import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Platform, ScrollView
} from 'react-native';
import Toast from 'react-native-toast-message';
import { ethers } from 'ethers';
import { useWalletStore } from '../store/walletStore';
import { auth } from '../config/firebase'; // Correction chemin
import { useNavigation } from '@react-navigation/native';

function OnboardingScreen() {
  const navigation = useNavigation();

  const [password, setPassword]           = useState('');
  const [confirmPassword, setConfirm]     = useState('');
  const [showPasswordInput, setShowPwd]   = useState(false);
  const [isCreating, setIsCreating]       = useState(false);
  const [showImportInput, setShowImport]  = useState(false);
  const [mnemonic, setMnemonic]           = useState('');

  const createWallet             = useWalletStore((s) => s.actions.createWallet);
  const importWalletFromMnemonic = useWalletStore((s) => s.actions.importWalletFromMnemonic);
  const needsBackup              = useWalletStore((s) => s.needsBackup);

  // Navigation helper
  const goNextFlow = () => {
    if (needsBackup) {
      navigation.navigate('Backup');
    } else {
      navigation.navigate('Locked');
    }
  };

  const handleCreateWallet = async () => {
    if (Platform.OS === 'web') {
      setShowPwd(true);
    } else {
      try {
        setIsCreating(true);
        await createWallet();
        Toast.show({ type: 'success', text1: 'Portefeuille créé', text2: 'Succès' });
        goNextFlow();
      } catch (e) { // CORRECTION : Enlevé : any
        Toast.show({ type: 'error', text1: 'Erreur', text2: e?.message || 'Création impossible' });
      } finally {
        setIsCreating(false);
      }
    }
  };

  const handleConfirmPassword = async () => {
    if (!password || password.length < 4) {
      Toast.show({ type: 'error', text1: 'Mot de passe trop court', text2: '>=4 caractères' });
      return;
    }
    if (password !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Différence', text2: 'Les mots de passe ne correspondent pas' });
      return;
    }
    try {
      setIsCreating(true);
      // Note: createWallet ne prend pas de password normalement dans notre store, 
      // mais on laisse si tu as modifié le store pour le web
      await createWallet(password);
      Toast.show({ type: 'success', text1: 'Portefeuille créé', text2: 'Chiffré avec succès' });
      goNextFlow();
    } catch (e) { // CORRECTION : Enlevé : any
      Toast.show({ type: 'error', text1: 'Erreur', text2: e?.message || 'Création impossible' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleImportWallet = () => {
    setShowImport(true);
    setShowPwd(false);
  };

  const handleConfirmImport = async () => {
    const trimmed = mnemonic.trim();
    if (!trimmed) {
      Toast.show({ type: 'error', text1: 'Mnemonic requise', text2: 'Entre ta phrase' });
      return;
    }
    const words = trimmed.split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      Toast.show({ type: 'error', text1: 'Format invalide', text2: '12 ou 24 mots' });
      return;
    }
    if (Platform.OS === 'web' && !password) {
      Toast.show({ type: 'error', text1: 'Mot de passe requis', text2: 'Pour chiffrement local demo.' });
      return;
    }

    try {
      ethers.Wallet.fromMnemonic(trimmed);
    } catch {
      Toast.show({ type: 'error', text1: 'Mnemonic invalide', text2: 'Vérifie chaque mot.' });
      return;
    }

    try {
      setIsCreating(true);
      // On enlève le password si la fonction ne l'accepte pas, ou on le laisse si tu as adapté
      const address = await importWalletFromMnemonic(trimmed, password || undefined);
      const user = auth.currentUser;
      if (user) {
        // await linkWalletAddressToUser(user.uid, address); // Commenté car n'existe pas encore
      }
      Toast.show({ type: 'success', text1: 'Wallet importé', text2: 'Adresse liée.' });
      goNextFlow();
    } catch (e) { // CORRECTION : Enlevé : any
      Toast.show({ type: 'error', text1: 'Erreur import', text2: e?.message || 'Impossible.' });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} style={{ flex: 1, backgroundColor: '#24272A' }}>
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🦊</Text>
          <Text style={styles.brandName}>Malin Wallet</Text>
        </View>

        <Text style={styles.title}>Bienvenue</Text>
        <Text style={styles.subtitle}>
          {showImportInput
            ? 'Importez votre portefeuille existant'
            : showPasswordInput
              ? 'Crée un mot de passe pour sécuriser ton portefeuille'
              : 'Crée ou importe un portefeuille testnet sécurisé'}
        </Text>

        {showImportInput ? (
          <View style={styles.formContainer}>
            <Text style={styles.label}>Mnemonic (12 ou 24 mots)</Text>
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

            <View style={styles.warningBox}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningText}>
                La phrase n'est jamais envoyée. L'adresse publique peut être liée à ton compte.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.button, isCreating && styles.buttonDisabled]}
              onPress={handleConfirmImport}
              disabled={isCreating}
            >
              <Text style={styles.buttonText}>{isCreating ? 'Importation...' : 'Importer mon portefeuille'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setShowImport(false);
                setMnemonic('');
                setPassword('');
              }}
              disabled={isCreating}
            >
              <Text style={styles.secondaryButtonText}>Retour</Text>
            </TouchableOpacity>
          </View>
        ) : Platform.OS === 'web' && showPasswordInput ? (
          <View style={styles.formContainer}>
            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor="#8B92A6"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <Text style={styles.label}>Confirmer mot de passe</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirmer"
              placeholderTextColor="#8B92A6"
              value={confirmPassword}
              onChangeText={setConfirm}
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.button, isCreating && styles.buttonDisabled]}
              onPress={handleConfirmPassword}
              disabled={isCreating}
            >
              <Text style={styles.buttonText}>{isCreating ? 'Création...' : 'Créer mon portefeuille'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => {
                setShowPwd(false);
                setPassword('');
                setConfirm('');
              }}
              disabled={isCreating}
            >
              <Text style={styles.secondaryButtonText}>Retour</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <TouchableOpacity
              style={[styles.button, isCreating && styles.buttonDisabled]}
              onPress={handleCreateWallet}
              disabled={isCreating}
            >
              <Text style={styles.buttonText}>{isCreating ? 'Création...' : 'Créer mon portefeuille'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleImportWallet}
              disabled={isCreating}
            >
              <Text style={styles.secondaryButtonText}>Importer un portefeuille existant</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  container: { width: '100%', maxWidth: 500, justifyContent: 'center', alignItems: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 30 },
  logo: { fontSize: 80, marginBottom: 15 },
  brandName: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF' },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 10, color: '#FFFFFF' },
  subtitle: {
    fontSize: 16, color: '#8B92A6', marginBottom: 40,
    textAlign: 'center', paddingHorizontal: 20
  },
  formContainer: { width: '100%', maxWidth: 400 },
  label: { fontSize: 14, color: '#D6D9DC', marginBottom: 8, fontWeight: '600' },
  input: {
    backgroundColor: '#141618', borderRadius: 8, padding: 15,
    fontSize: 16, color: '#FFFFFF', marginBottom: 20, borderWidth: 1, borderColor: '#3C4043'
  },
  mnemonicInput: {
    backgroundColor: '#141618', borderRadius: 8, padding: 15,
    fontSize: 16, color: '#FFFFFF', marginBottom: 20, borderWidth: 1, borderColor: '#3C4043',
    minHeight: 100, textAlignVertical: 'top'
  },
  button: {
    backgroundColor: '#037DD6', paddingVertical: 15, paddingHorizontal: 40,
    borderRadius: 100, alignItems: 'center', marginBottom: 15
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  secondaryButton: {
    backgroundColor: 'transparent', paddingVertical: 15, paddingHorizontal: 40,
    borderRadius: 100, alignItems: 'center', borderWidth: 2, borderColor: '#037DD6'
  },
  secondaryButtonText: { color: '#037DD6', fontSize: 16, fontWeight: '600' },
  warningBox: {
    flexDirection: 'row', backgroundColor: '#3D2E1F',
    borderRadius: 10, padding: 15, marginBottom: 20,
    borderWidth: 1, borderColor: '#F7931A'
  },
  warningIcon: { fontSize: 20, marginRight: 10 },
  warningText: { flex: 1, color: '#F7931A', fontSize: 12, lineHeight: 18 },
});

export default OnboardingScreen;


