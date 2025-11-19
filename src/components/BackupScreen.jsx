import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useWalletStore from '../store/walletStore';

function BackupScreen() {
  const [isChecked, setIsChecked] = useState(false);
  const mnemonic = useWalletStore((state) => state.mnemonic);
  const setScreen = useWalletStore((state) => state.actions.setScreen);

  const navigation = useNavigation();

  const handleContinue = () => {
    // Pour l’ancienne logique (App.jsx)
    setScreen('backupVerify');

    // Pour la navigation (App.tsx / web)
    try {
      if (navigation && typeof navigation.navigate === 'function') {
        navigation.navigate('BackupVerify');
      }
    } catch (e) {
      console.log('Navigation to BackupVerify failed or not available:', e);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Sauvegardez votre phrase de récupération</Text>

      <View style={styles.alertBox}>
        <Text style={styles.alertTitle}>⚠️ IMPORTANT</Text>
        <Text style={styles.alertText}>
          Cette phrase est la SEULE façon de récupérer votre portefeuille.
          {'\n\n'}
          • Ne la partagez JAMAIS avec personne{'\n'}
          • Conservez-la en lieu sûr{'\n'}
          • Toute personne avec cette phrase peut accéder à vos fonds{'\n'}
        </Text>
      </View>

      <View style={styles.mnemonicBox}>
        <Text style={styles.mnemonic}>{mnemonic}</Text>
      </View>

      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => setIsChecked(!isChecked)}>
        <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
          {isChecked && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>
          J'ai sauvegardé ma phrase en lieu sûr
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, !isChecked && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={!isChecked}>
        <Text style={styles.buttonText}>Continuer vers la vérification</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#24272A',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  alertBox: {
    backgroundColor: '#3D2E1F',
    borderWidth: 2,
    borderColor: '#F7931A',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F7931A',
    marginBottom: 10,
  },
  alertText: {
    fontSize: 14,
    color: '#F7931A',
    lineHeight: 20,
  },
  mnemonicBox: {
    backgroundColor: '#141618',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#3C4043',
  },
  mnemonic: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    textAlign: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#037DD6',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#037DD6',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#D6D9DC',
    flex: 1,
  },
  button: {
    backgroundColor: '#037DD6',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#4A5568',
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default BackupScreen;