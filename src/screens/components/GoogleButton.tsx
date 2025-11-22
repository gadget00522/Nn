import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  Platform,
} from 'react-native';
import Toast from 'react-native-toast-message';
import {
  loginWithGoogle,
  linkWalletAddressToUser,
  mapGoogleAuthError,
} from '../../services/authService';
import useWalletStore from '../../store/walletStore';

/**
 * Composant Logo Google G.
 * Affiche le logo officiel "G" de Google en utilisant un SVG en ligne (Web) ou un texte (fallback natif).
 *
 * @returns {JSX.Element} Le logo Google.
 */
function GoogleGLogo() {
  // For web, render an inline SVG
  if (Platform.OS === 'web') {
    const svgString = `<svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>`;
    
    return (
      <View
        style={{ width: 18, height: 18 }}
        // @ts-ignore - dangerouslySetInnerHTML is web-only
        dangerouslySetInnerHTML={{ __html: svgString }}
      />
    );
  }
  
  // Fallback for native (shouldn't be used, but just in case)
  return <Text style={{ fontSize: 18 }}>G</Text>;
}

interface GoogleButtonProps {
  /** Désactive le bouton si true. */
  disabled?: boolean;
  /** Fonction de rappel appelée après une connexion réussie. */
  onAfterSuccess?: () => void;
}

/**
 * Composant Bouton de Connexion Google.
 * Implémente le design officiel du bouton Google avec un flux popup/redirection.
 * Gère la connexion, la liaison du portefeuille et les retours visuels (Toast).
 *
 * @param {GoogleButtonProps} props - Les propriétés du composant.
 * @returns {JSX.Element} Le bouton de connexion Google.
 */
export default function GoogleButton({ disabled = false, onAfterSuccess }: GoogleButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const walletStore = useWalletStore();

  /**
   * Gère le processus de connexion Google.
   * 1. Tente de se connecter avec Google.
   * 2. Si succès, lie le portefeuille local s'il existe.
   * 3. Affiche les messages de succès ou d'erreur.
   */
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    try {
      const user = await loginWithGoogle();
      
      // If user is null, redirect flow was started
      if (user === null) {
        Toast.show({
          type: 'info',
          text1: 'Redirection en cours',
          text2: 'Vous allez être redirigé vers Google...',
        });
        return;
      }
      
      // Success - user signed in via popup
      Toast.show({
        type: 'success',
        text1: 'Connecté avec Google',
        text2: `Bienvenue ${user.email}`,
      });

      // Check if a wallet exists locally
      const hasWallet = walletStore.isWalletCreated;
      const walletAddress = walletStore.address;

      // If wallet exists and has address, link it to the user
      if (hasWallet && walletAddress) {
        await linkWalletAddressToUser(user.uid, walletAddress);
        Toast.show({
          type: 'success',
          text1: 'Portefeuille lié',
          text2: 'Votre portefeuille a été lié à votre compte Google.',
        });
      } else {
        // No wallet exists - show message to create or import
        Toast.show({
          type: 'info',
          text1: 'Aucun portefeuille trouvé',
          text2: 'Crée ou importe ton portefeuille.',
        });
      }

      // Appelle le callback de succès si fourni
      if (onAfterSuccess) {
        onAfterSuccess();
      }

    } catch (error: any) {
      console.error('Google sign-in error:', error);
      
      const errorMessage = error?.code 
        ? mapGoogleAuthError(error.code)
        : 'Impossible de se connecter avec Google.';
      
      Toast.show({
        type: 'error',
        text1: 'Erreur Google',
        text2: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, (disabled || isLoading) && styles.buttonDisabled]}
      onPress={handleGoogleSignIn}
      disabled={disabled || isLoading}
      accessibilityLabel="Se connecter avec Google"
      accessibilityRole="button"
    >
      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#24272A" />
        ) : (
          <GoogleGLogo />
        )}
        <Text style={styles.text}>
          {isLoading ? 'Connexion...' : 'Continuer avec Google'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#3C4043',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#24272A',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
  },
});

export default GoogleButton;
