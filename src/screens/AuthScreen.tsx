import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Platform
} from 'react-native';
import Toast from 'react-native-toast-message';
import {
  signupWithEmail,
  loginWithEmail,
  requestPasswordReset
} from '../services/authService';
import useWalletStore from '../store/walletStore';
import GoogleButton from './components/GoogleButton';

import { useNavigation } from '@react-navigation/native';

type Mode = 'signup' | 'login' | 'reset';

/**
 * Écran d'authentification principal.
 * Permet l'inscription, la connexion et la réinitialisation de mot de passe.
 * Gère l'authentification via Email/Mot de passe et Google (Web).
 */
function AuthScreen() {
  const navigation = useNavigation();
  const [mode, setMode] = useState<Mode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const createWallet = useWalletStore((s) => s.actions.createWallet);
  const checkStorage = useWalletStore((s) => s.actions.checkStorage);

  /**
   * Rafraîchit l'état du stockage après une authentification réussie.
   * Permet à l'application de rediriger l'utilisateur vers l'écran approprié.
   */
  const triggerFlowRefresh = () => {
    checkStorage();
    // App.tsx détectera et redirigera
  };

  /**
   * Gère l'inscription d'un nouvel utilisateur.
   */
  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      Toast.show({ type: 'error', text1: 'Champs manquants', text2: 'Email et mot de passe sont requis.' });
      return;
    }
    if (password !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Mots de passe différents', text2: 'Ils ne correspondent pas.' });
      return;
    }
    setIsLoading(true);
    try {
      const user = await signupWithEmail(email.trim(), password);
      Toast.show({
        type: 'success',
        text1: 'Compte créé',
        text2: 'Email de vérification envoyé.'
      });

      // On crée le wallet de suite (web: password obligatoire)
      if (Platform.OS === 'web') {
        await createWallet(password);
      } else {
        await createWallet();
      }

      triggerFlowRefresh();
      // Si email pas encore vérifié, on reste ici mais on propose de recharger une fois vérifié
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: err?.message || "Création impossible." });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Gère la connexion d'un utilisateur existant.
   */
  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({ type: 'error', text1: 'Champs manquants', text2: 'Email + mot de passe requis.' });
      return;
    }
    setIsLoading(true);
    try {
      const user = await loginWithEmail(email.trim(), password);
      if (!user.emailVerified) {
        Toast.show({
          type: 'info',
          text1: 'Email non vérifié',
          text2: 'Clique le lien reçu puis reviens ici.'
        });
      } else {
        Toast.show({ type: 'success', text1: 'Connecté', text2: `Bienvenue ${user.email}` });
      }
      triggerFlowRefresh();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Connexion impossible', text2: err?.message || 'Identifiants invalides.' });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Gère la demande de réinitialisation de mot de passe.
   */
  const handleReset = async () => {
    if (!email) {
      Toast.show({ type: 'error', text1: 'Email requis', text2: 'Indique ton email' });
      return;
    }
    setIsLoading(true);
    try {
      await requestPasswordReset(email.trim());
      Toast.show({ type: 'success', text1: 'Email envoyé', text2: 'Si un compte existe, lien envoyé.' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: err?.message || 'Envoi impossible.' });
    } finally {
      setIsLoading(false);
    }
  };

  const renderForm = () => {
    if (mode === 'signup') {
      return (
        <View style={styles.formContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="email@exemple.com"
            placeholderTextColor="#8B92A6"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Text style={styles.label}>Mot de passe</Text>
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            placeholderTextColor="#8B92A6"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Text style={styles.label}>Confirme mot de passe</Text>
            <TextInput
            style={styles.input}
            placeholder="Confirmez"
            placeholderTextColor="#8B92A6"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>{isLoading ? 'Création...' : 'Créer mon compte'}</Text>
          </TouchableOpacity>

          <Divider />

          {Platform.OS === 'web' && <GoogleButton onAfterSuccess={triggerFlowRefresh} />}
        </View>
      );
    }
    if (mode === 'login') {
      return (
        <View style={styles.formContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="email@exemple.com"
            placeholderTextColor="#8B92A6"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Text style={styles.label}>Mot de passe</Text>
          <TextInput
            style={styles.input}
            placeholder="Mot de passe"
            placeholderTextColor="#8B92A6"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>{isLoading ? 'Connexion...' : 'Se connecter'}</Text>
          </TouchableOpacity>

          <Divider />

          {Platform.OS === 'web' && <GoogleButton onAfterSuccess={triggerFlowRefresh} />}
        </View>
      );
    }
    // reset
    return (
      <View style={styles.formContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="email@exemple.com"
          placeholderTextColor="#8B92A6"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleReset}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>{isLoading ? 'Envoi...' : 'Envoyer lien de réinitialisation'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}><Text style={styles.logo}>🦊</Text><Text style={styles.brandName}>Malin Wallet</Text></View>
      <View style={styles.modeTabs}>
        <TabButton active={mode === 'signup'} label="Inscription" onPress={() => setMode('signup')} />
        <TabButton active={mode === 'login'}  label="Connexion"  onPress={() => setMode('login')} />
        <TabButton active={mode === 'reset'}  label="Reset"      onPress={() => setMode('reset')} />
      </View>
      {renderForm()}
      <View style={{ marginTop: 20 }}>
        <Text style={styles.helperText}>
          Une fois ton email vérifié, reviens ou rafraîchis: tu seras redirigé automatiquement vers ton portefeuille ou la création.
        </Text>
      </View>
    </View>
  );
}

/**
 * Bouton d'onglet pour basculer entre les modes d'authentification.
 *
 * @param {object} props - Les propriétés du composant.
 * @param {boolean} props.active - Si l'onglet est actif.
 * @param {string} props.label - Le libellé de l'onglet.
 * @param {Function} props.onPress - La fonction à appeler lors de l'appui.
 */
function TabButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.modeTab, active && styles.modeTabActive]} onPress={onPress}>
      <Text style={[styles.modeTabText, active && styles.modeTabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

/**
 * Séparateur visuel pour l'interface utilisateur.
 */
function Divider() {
  return (
    <View style={styles.dividerContainer}>
      <View style={styles.divider} />
      <Text style={styles.dividerText}>OU</Text>
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#24272A', padding: 20, justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 20 },
  logo: { fontSize: 60, marginBottom: 10 },
  brandName: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  modeTabs: { flexDirection: 'row', marginBottom: 20, borderRadius: 999, backgroundColor: '#141618', padding: 3 },
  modeTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 999 },
  modeTabActive: { backgroundColor: '#037DD6' },
  modeTabText: { color: '#8B92A6', fontSize: 12, fontWeight: '600' },
  modeTabTextActive: { color: '#FFFFFF' },
  formContainer: { marginTop: 10 },
  label: { fontSize: 14, color: '#D6D9DC', marginBottom: 8, fontWeight: '600' },
  input: {
    backgroundColor: '#141618', borderRadius: 8, padding: 12,
    fontSize: 16, color: '#FFFFFF', marginBottom: 16, borderWidth: 1, borderColor: '#3C4043'
  },
  button: { backgroundColor: '#037DD6', paddingVertical: 14, borderRadius: 999, alignItems: 'center', marginBottom: 10 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divider: { flex: 1, height: 1, backgroundColor: '#3C4043' },
  dividerText: { color: '#8B92A6', fontSize: 13, marginHorizontal: 12, fontWeight: '500' },
  helperText: { color: '#8B92A6', fontSize: 12, textAlign: 'center', lineHeight: 16 }
});

export default AuthScreen;
