import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import useWalletStore from '../store/walletStore';

function LockedScreen() {
  const [password, setPassword] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const unlockWallet = useWalletStore((state) => state.actions.unlockWallet);

  const handleUnlock = async () => {
    if (Platform.OS === 'web' && !password.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Veuillez entrer votre mot de passe',
      });
      return;
    }
    
    setIsUnlocking(true);
    try {
      await unlockWallet(password);
      Toast.show({
        type: 'success',
        text1: 'Déverrouillé',
        text2: 'Portefeuille déverrouillé avec succès',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Échec du déverrouillage',
      });
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleForgotPassword = () => {
    Toast.show({
      type: 'info',
      text1: 'Mot de passe oublié',
      text2: 'Veuillez restaurer votre portefeuille avec la phrase de récupération',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>🦊</Text>
        <Text style={styles.brandName}>Malin Wallet</Text>
      </View>
      
      <Text style={styles.welcomeText}>Heureux de vous revoir !</Text>
      
      {Platform.OS === 'web' ? (
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
            editable={!isUnlocking}
          />
          
          <TouchableOpacity 
            style={[styles.button, isUnlocking && styles.buttonDisabled]} 
            onPress={handleUnlock}
            disabled={isUnlocking}>
            <Text style={styles.buttonText}>
              {isUnlocking ? 'Déverrouillage...' : 'Déverrouiller'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleForgotPassword}>
            <Text style={styles.forgotPassword}>Mot de passe oublié ?</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TouchableOpacity 
            style={[styles.button, isUnlocking && styles.buttonDisabled]} 
            onPress={handleUnlock}
            disabled={isUnlocking}>
            <Text style={styles.buttonText}>
              {isUnlocking ? 'Déverrouillage...' : 'Déverrouiller'}
            </Text>
          </TouchableOpacity>
        </>
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
    marginBottom: 40,
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
  welcomeText: {
    fontSize: 20,
    color: '#D6D9DC',
    marginBottom: 40,
    textAlign: 'center',
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
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    color: '#037DD6',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default LockedScreen;
