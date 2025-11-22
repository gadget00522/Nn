import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Platform, ScrollView
} from 'react-native';
import Toast from 'react-native-toast-message';
import { ethers } from 'ethers';
import useWalletStore from '../store/walletStore';
// import { auth } from '../firebaseConfig'; // Assure-toi que ce chemin existe si tu l'utilises
// import { linkWalletAddressToUser } from '../services/authService';
import { useNavigation } from '@react-navigation/native';

/**
 * Écran d'accueil (Onboarding) pour les nouveaux utilisateurs ou ceux sans portefeuille.
 * Permet de créer un nouveau portefeuille ou d'en importer un existant.
 *
 * @returns {JSX.Element} L'interface utilisateur d'onboarding.
 */
function OnboardingScreen() {
  const navigation = useNavigation();
  // États pour la gestion des entrées utilisateur et de l'interface
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirm] = useState('');
  const [showPasswordInput, setShowPwd] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showImportInput, setShowImport] = useState(false);
  const [mnemonic, setMnemonic] = useState('');

  const createWallet = useWalletStore((s) => s.actions.createWallet);
  const importWalletFromMnemonic = useWalletStore((s) => s.actions.importWalletFromMnemonic);
  const needsBackup = useWalletStore((s) => s.needsBackup);

  /**
   * Navigue vers l'étape suivante appropriée (Sauvegarde ou Déverrouillage).
   */
  const goNextFlow = () => {
    if (needsBackup) {
      navigation.navigate('Backup');
    } else {
      navigation.navigate('Locked');
    }
  };

  /**
   * Gère la création d'un nouveau portefeuille.
   * Sur Web, demande d'abord un mot de passe pour le chiffrement.
   */
  const handleCreateWallet = async () => {
    if (Platform.OS === 'web') {
      setShowPwd(true);
    } else {
      try {
        setIsCreating(true);
        await createWallet();
        Toast.show({ type: 'success', text1: 'Portefeuille créé', text2: 'Succès' });
        goNextFlow();
      } catch (e) {
        Toast.show({ type: 'error', text1: 'Erreur', text2: e?.message || 'Création impossible' });
      } finally {
        setIsCreating(false);
      }
    }
  };

  /**
   * Confirme la création du portefeuille avec le mot de passe fourni (Web uniquement).
   */
  const handleConfirmPassword = async () => {
    if (password.length < 4) {
        Toast.show({ type: 'error', text1: 'Mot de passe trop court', text2: '4 caractères min.' });
        return;
    }
    if (password !== confirmPassword) {
        Toast.show({ type: 'error', text1: 'Erreur', text2: 'Les mots de passe ne correspondent pas' });
        return;
    }

    try {
      setIsCreating(true);
      await createWallet(password);
      Toast.show({ type: 'success', text1: 'Portefeuille créé', text2: 'Chiffré avec succès' });
      goNextFlow();
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: e?.message || 'Création impossible' });
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Gère l'importation d'un portefeuille existant.
   */
  const handleConfirmImport = async () => {
    if (!mnemonic) {
        Toast.show({ type: 'error', text1: 'Erreur', text2: 'Phrase requise' });
        return;
    }
    if (Platform.OS === 'web' && !password) {
         Toast.show({ type: 'error', text1: 'Erreur', text2: 'Mot de passe requis pour le web' });
         return;
    }

    try {
      setIsCreating(true);
      await importWalletFromMnemonic(mnemonic.trim(), password || undefined);
      Toast.show({ type: 'success', text1: 'Wallet importé', text2: 'Adresse liée.' });
      goNextFlow();
    } catch (e) {
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
        <Text style={styles.subtitle}>Le portefeuille crypto sécurisé et facile à utiliser.</Text>

        {!showImportInput && !showPasswordInput && (
           <View style={styles.formContainer}>
            <TouchableOpacity style={styles.button} onPress={handleCreateWallet}>
                <Text style={styles.buttonText}>Créer mon portefeuille</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowImport(true)}>
                <Text style={styles.secondaryButtonText}>Importer un portefeuille existant</Text>
            </TouchableOpacity>
           </View>
        )}

        {showPasswordInput && !showImportInput && (
            <View style={styles.formContainer}>
                <Text style={styles.label}>Définir un mot de passe (chiffrement local)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Mot de passe"
                    placeholderTextColor="#8B92A6"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Confirmer le mot de passe"
                    placeholderTextColor="#8B92A6"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirm}
                />
                 <View style={styles.warningBox}>
                    <Text style={styles.warningIcon}>⚠️</Text>
                    <Text style={styles.warningText}>Ce mot de passe chiffre votre clé privée sur cet appareil. Ne l'oubliez pas !</Text>
                </View>
                <TouchableOpacity style={styles.button} onPress={handleConfirmPassword} disabled={isCreating}>
                    <Text style={styles.buttonText}>{isCreating ? 'Création...' : 'Confirmer'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowPwd(false)}>
                    <Text style={styles.secondaryButtonText}>Retour</Text>
                </TouchableOpacity>
            </View>
        )}

        {showImportInput && (
             <View style={styles.formContainer}>
                <Text style={styles.label}>Phrase secrète (12 ou 24 mots)</Text>
                <TextInput
                    style={styles.mnemonicInput}
                    placeholder="Entrez votre phrase de récupération..."
                    placeholderTextColor="#8B92A6"
                    multiline
                    numberOfLines={4}
                    value={mnemonic}
                    onChangeText={setMnemonic}
                    autoCapitalize="none"
                />
                {Platform.OS === 'web' && (
                    <>
                        <Text style={styles.label}>Mot de passe de protection</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Mot de passe"
                            placeholderTextColor="#8B92A6"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                        />
                    </>
                )}
                <TouchableOpacity style={styles.button} onPress={handleConfirmImport} disabled={isCreating}>
                    <Text style={styles.buttonText}>{isCreating ? 'Importation...' : 'Importer'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowImport(false)}>
                    <Text style={styles.secondaryButtonText}>Retour</Text>
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
  formContainer: { width: '100%', maxWidth: 400, width: '100%' },
  button: { backgroundColor: '#037DD6', paddingVertical: 15, borderRadius: 100, alignItems: 'center', marginBottom: 15 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  secondaryButton: { backgroundColor: 'transparent', paddingVertical: 15, borderRadius: 100, alignItems: 'center', borderWidth: 2, borderColor: '#037DD6' },
  secondaryButtonText: { color: '#037DD6', fontSize: 16, fontWeight: '600' },
  input: { backgroundColor: '#141618', borderRadius: 8, padding: 15, fontSize: 16, color: '#FFFFFF', marginBottom: 20, borderWidth: 1, borderColor: '#3C4043' },
  label: { fontSize: 14, color: '#D6D9DC', marginBottom: 8, fontWeight: '600' },
  mnemonicInput: { backgroundColor: '#141618', borderRadius: 8, padding: 15, fontSize: 16, color: '#FFFFFF', marginBottom: 20, borderWidth: 1, borderColor: '#3C4043', minHeight: 100, textAlignVertical: 'top' },
  warningBox: { flexDirection: 'row', backgroundColor: '#3D2E1F', borderRadius: 10, padding: 15, marginBottom: 20, borderWidth: 1, borderColor: '#F7931A' },
  warningIcon: { fontSize: 20, marginRight: 10 },
  warningText: { flex: 1, color: '#F7931A', fontSize: 12, lineHeight: 18 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: '#FFFFFF', marginTop: 20 },
  subtitle: { fontSize: 16, color: '#8B92A6', marginBottom: 40, textAlign: 'center', paddingHorizontal: 20 },
});

export default OnboardingScreen;
