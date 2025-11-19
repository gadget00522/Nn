import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { signupWithEmail, loginWithEmail, requestPasswordReset, loginWithGoogle } from '../services/authService';
import useWalletStore from '../store/walletStore';
import { auth } from '../firebaseConfig';
import { linkWalletAddressToUser } from '../services/authService';

type Mode = 'signup' | 'login' | 'reset';

function AuthScreen() {
  const [mode, setMode] = useState<Mode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const createWallet = useWalletStore((state) => state.actions.createWallet);
  const walletStore = useWalletStore();

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      Toast.show({ type: 'error', text1: 'Champs manquants', text2: 'Email et mot de passe sont requis.' });
      return;
    }
    if (password !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Mots de passe différents', text2: 'Les mots de passe ne correspondent pas.' });
      return;
    }
    setIsLoading(true);
    try {
      await signupWithEmail(email.trim(), password);
      Toast.show({ type: 'success', text1: 'Compte créé', text2: 'Un email de vérification a été envoyé.' });
      // créer wallet localement (web : password -> demo storage)
      if (Platform.OS === 'web') {
        await createWallet(password);
      } else {
        await createWallet();
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: err?.message || "Impossible de créer le compte." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({ type: 'error', text1: 'Champs manquants', text2: 'Email et mot de passe sont requis.' });
      return;
    }
    setIsLoading(true);
    try {
      const user = await loginWithEmail(email.trim(), password);
      if (!user.emailVerified) {
        Toast.show({ type: 'info', text1: 'Email non vérifié', text2: 'Vérifie ta boîte mail avant de continuer.' });
      } else {
        Toast.show({ type: 'success', text1: 'Connecté', text2: `Bienvenue ${user.email}` });
        // leave navigation / unlock logic to App.tsx (observeAuthState)
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Erreur de connexion', text2: err?.message || 'Identifiants invalides.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email) {
      Toast.show({ type: 'error', text1: 'Email requis', text2: 'Veuillez entrer votre email.' });
      return;
    }
    setIsLoading(true);
    try {
      await requestPasswordReset(email.trim());
      Toast.show({ type: 'success', text1: 'Email envoyé', text2: 'Si un compte existe, un lien de réinitialisation a été envoyé.' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: err?.message || 'Impossible d’envoyer l’email.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    // Check platform - Google sign-in only supported on web initially
    if (Platform.OS !== 'web') {
      Toast.show({ 
        type: 'info', 
        text1: 'Non disponible', 
        text2: 'La connexion Google n\'est pas encore disponible sur cette plateforme.' 
      });
      return;
    }

    setIsGoogleLoading(true);
    try {
      const user = await loginWithGoogle();
      Toast.show({ 
        type: 'success', 
        text1: 'Connecté avec Google', 
        text2: `Bienvenue ${user.email}` 
      });

      // Check if a wallet exists locally
      const hasWallet = walletStore.isWalletCreated;
      const walletAddress = walletStore.address;

      // If wallet exists and has address, link it to the user
      if (hasWallet && walletAddress) {
        await linkWalletAddressToUser(user.uid, walletAddress);
        Toast.show({ 
          type: 'success', 
          text1: 'Wallet lié', 
          text2: 'Votre wallet a été lié à votre compte Google.' 
        });
      } else {
        // No wallet exists - show message to create or import
        Toast.show({ 
          type: 'info', 
          text1: 'Créez votre wallet', 
          text2: 'Vous devez créer ou importer un wallet pour continuer.' 
        });
      }
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      let errorMessage = 'Impossible de se connecter avec Google.';
      
      // Handle common errors
      if (err?.code === 'auth/popup-closed-by-user') {
        errorMessage = 'La fenêtre de connexion a été fermée.';
      } else if (err?.code === 'auth/popup-blocked') {
        errorMessage = 'La fenêtre popup a été bloquée par le navigateur.';
      } else if (err?.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Demande de connexion annulée.';
      }
      
      Toast.show({ 
        type: 'error', 
        text1: 'Erreur Google', 
        text2: errorMessage 
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const renderForm = () => {
    if (mode === 'signup') {
      return (
        <View style={styles.formContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} placeholder="email@exemple.com" placeholderTextColor="#8B92A6" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <Text style={styles.label}>Mot de passe</Text>
          <TextInput style={styles.input} placeholder="Mot de passe" placeholderTextColor="#8B92A6" value={password} onChangeText={setPassword} secureTextEntry />
          <Text style={styles.label}>Confirmer le mot de passe</Text>
          <TextInput style={styles.input} placeholder="Confirmez le mot de passe" placeholderTextColor="#8B92A6" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
          <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleSignup} disabled={isLoading}>
            <Text style={styles.buttonText}>{isLoading ? 'Création...' : 'Créer mon compte'}</Text>
          </TouchableOpacity>
          
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OU</Text>
            <View style={styles.divider} />
          </View>

          {Platform.OS === 'web' && (
            <TouchableOpacity 
              style={[styles.googleButton, isGoogleLoading && styles.buttonDisabled]} 
              onPress={handleGoogleSignIn} 
              disabled={isGoogleLoading}
            >
              <Text style={styles.googleButtonText}>
                {isGoogleLoading ? 'Connexion...' : '🔍 Continuer avec Google'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    if (mode === 'login') {
      return (
        <View style={styles.formContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} placeholder="email@exemple.com" placeholderTextColor="#8B92A6" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <Text style={styles.label}>Mot de passe</Text>
          <TextInput style={styles.input} placeholder="Mot de passe" placeholderTextColor="#8B92A6" value={password} onChangeText={setPassword} secureTextEntry />
          <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleLogin} disabled={isLoading}>
            <Text style={styles.buttonText}>{isLoading ? 'Connexion...' : 'Se connecter'}</Text>
          </TouchableOpacity>
          
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OU</Text>
            <View style={styles.divider} />
          </View>

          {Platform.OS === 'web' && (
            <TouchableOpacity 
              style={[styles.googleButton, isGoogleLoading && styles.buttonDisabled]} 
              onPress={handleGoogleSignIn} 
              disabled={isGoogleLoading}
            >
              <Text style={styles.googleButtonText}>
                {isGoogleLoading ? 'Connexion...' : '🔍 Continuer avec Google'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    // reset
    return (
      <View style={styles.formContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} placeholder="email@exemple.com" placeholderTextColor="#8B92A6" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleReset} disabled={isLoading}>
          <Text style={styles.buttonText}>{isLoading ? 'Envoi...' : 'Envoyer un email de réinitialisation'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}><Text style={styles.logo}>🦊</Text><Text style={styles.brandName}>Malin Wallet</Text></View>
      <View style={styles.modeTabs}>
        <TouchableOpacity style={[styles.modeTab, mode === 'signup' && styles.modeTabActive]} onPress={() => setMode('signup')}><Text style={[styles.modeTabText, mode === 'signup' && styles.modeTabTextActive]}>Créer un compte</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.modeTab, mode === 'login' && styles.modeTabActive]} onPress={() => setMode('login')}><Text style={[styles.modeTabText, mode === 'login' && styles.modeTabTextActive]}>Se connecter</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.modeTab, mode === 'reset' && styles.modeTabActive]} onPress={() => setMode('reset')}><Text style={[styles.modeTabText, mode === 'reset' && styles.modeTabTextActive]}>Mot de passe oublié</Text></TouchableOpacity>
      </View>
      {renderForm()}
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
  input: { backgroundColor: '#141618', borderRadius: 8, padding: 12, fontSize: 16, color: '#FFFFFF', marginBottom: 16, borderWidth: 1, borderColor: '#3C4043' },
  button: { backgroundColor: '#037DD6', paddingVertical: 14, borderRadius: 999, alignItems: 'center', marginBottom: 10 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divider: { flex: 1, height: 1, backgroundColor: '#3C4043' },
  dividerText: { color: '#8B92A6', fontSize: 13, marginHorizontal: 12, fontWeight: '500' },
  googleButton: { backgroundColor: '#FFFFFF', paddingVertical: 14, borderRadius: 999, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#3C4043' },
  googleButtonText: { color: '#24272A', fontSize: 15, fontWeight: '600' },
});

export default AuthScreen;
