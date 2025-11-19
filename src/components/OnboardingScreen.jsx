import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import useWalletStore from '../store/walletStore';

function OnboardingScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const createWallet = useWalletStore((state) => state.actions.createWallet);

  const handleCreateWallet = async () => {
    if (Platform.OS === 'web') {
      setShowPasswordInput(true);
    } else {
      await createWallet();
    }
  };

  const handleConfirmPassword = async () => {
    if (!password || password.length < 4) {
      Toast.show({
        type: 'error',
        text1: 'Mot de passe trop court',
        text2: 'Le mot de passe doit contenir au moins 4 caractères',
      });
      return;
    }

    if (password !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Mots de passe différents',
        text2: 'Les mots de passe ne correspondent pas',
      });
      return;
    }

    await createWallet(password);
    Toast.show({
      type: 'success',
      text1: 'Portefeuille créé',
      text2: 'Votre portefeuille a été créé avec succès',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>🦊</Text>
        <Text style={styles.brandName}>Malin Wallet</Text>
      </View>
      
      <Text style={styles.title}>Bienvenue</Text>
      <Text style={styles.subtitle}>
        {showPasswordInput 
          ? 'Créez un mot de passe pour sécuriser votre portefeuille'
          : 'Créez votre portefeuille sécurisé pour les testnets'}
      </Text>

      {Platform.OS === 'web' && showPasswordInput ? (
        <View style={styles.formContainer}>
          <Text style={styles.label}>Mot de passe</Text>
          <TextInput
            style={styles.input}
            placeholder="Entrez votre mot de passe"
            placeholderTextColor="#8B92A6"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <Text style={styles.label}>Confirmer le mot de passe</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirmez votre mot de passe"
            placeholderTextColor="#8B92A6"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.warningBox}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>
              DEMO UNIQUEMENT: Ce système de mot de passe n'est pas sécurisé pour la production. Utilisez uniquement pour les tests.
            </Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleConfirmPassword}>
            <Text style={styles.buttonText}>Créer mon portefeuille</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={() => setShowPasswordInput(false)}>
            <Text style={styles.secondaryButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleCreateWallet}>
          <Text style={styles.buttonText}>Créer mon portefeuille</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#24272A',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    fontSize: 80,
    marginBottom: 15,
  },
  brandName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#8B92A6',
    marginBottom: 40,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  label: {
    fontSize: 14,
    color: '#D6D9DC',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#141618',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#3C4043',
  },
  button: {
    backgroundColor: '#037DD6',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 100,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 100,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#037DD6',
  },
  secondaryButtonText: {
    color: '#037DD6',
    fontSize: 16,
    fontWeight: '600',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#3D2E1F',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
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

export default OnboardingScreen;
