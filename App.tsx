import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';

import OnboardingScreen from './src/components/OnboardingScreen.jsx';
import BackupScreen from './src/components/BackupScreen.jsx';
import BackupVerifyScreen from './src/components/BackupVerifyScreen.jsx';
import LockedScreen from './src/components/LockedScreen.jsx';
import DashboardScreen from './src/components/DashboardScreen.jsx';
import SendScreen from './src/components/SendScreen.jsx';
import ReceiveScreen from './src/components/ReceiveScreen.jsx';
import ScanScreen from './src/screens/ScanScreen';
import WalletConnectModal from './src/components/WalletConnectModal';
import AuthScreen from './src/screens/AuthScreen';

import useWalletStore from './src/store/walletStore';
import { observeAuthState, AuthUser, handleRedirectResultOnLoad, linkWalletAddressToUser } from './src/services/authService';
// Import firebaseConfig to ensure Firebase is initialized
import './src/firebaseConfig';

const Stack = createNativeStackNavigator();

export default function App() {
  const isWalletCreated = useWalletStore((state) => state.isWalletCreated);
  const isWalletUnlocked = useWalletStore((state) => state.isWalletUnlocked);
  const needsBackup = useWalletStore((state) => state.needsBackup);
  const checkStorage = useWalletStore((state) => state.actions.checkStorage);
  const walletStore = useWalletStore();

  // Firebase auth state (only on web)
  const [firebaseUser, setFirebaseUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    checkStorage();
  }, [checkStorage]);

  // Handle redirect result on app load (web only)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      handleRedirectResultOnLoad()
        .then((user) => {
          if (user) {
            // User returned from redirect flow
            Toast.show({
              type: 'success',
              text1: 'Connecté avec Google',
              text2: `Bienvenue ${user.email}`,
            });

            // Check if wallet exists and link it
            const walletAddress = walletStore.address;
            if (walletStore.isWalletCreated && walletAddress) {
              linkWalletAddressToUser(user.uid, walletAddress)
                .then(() => {
                  Toast.show({
                    type: 'success',
                    text1: 'Portefeuille lié',
                    text2: 'Votre portefeuille a été lié à votre compte Google.',
                  });
                })
                .catch((err) => {
                  console.error('Error linking wallet after redirect:', err);
                });
            } else {
              Toast.show({
                type: 'info',
                text1: 'Aucun portefeuille trouvé',
                text2: 'Crée ou importe ton portefeuille.',
              });
            }
          }
        })
        .catch((err) => {
          console.error('Error handling redirect result:', err);
          Toast.show({
            type: 'error',
            text1: 'Erreur',
            text2: 'Impossible de finaliser la connexion Google.',
          });
        });
    }
  }, []);

  // Observe Firebase auth state on web only
  useEffect(() => {
    if (Platform.OS === 'web') {
      const unsubscribe = observeAuthState((user) => {
        setFirebaseUser(user);
        setAuthLoading(false);
      });
      return unsubscribe;
    } else {
      // On native, skip Firebase auth
      setAuthLoading(false);
    }
  }, []);

  // Show loading state while checking auth
  if (authLoading && Platform.OS === 'web') {
    return null;
  }

  // On web, require Firebase authentication before wallet flow
  const needsAuth = Platform.OS === 'web' && (!firebaseUser || !firebaseUser.emailVerified);

  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {needsAuth ? (
            <Stack.Screen name="Auth" component={AuthScreen} />
          ) : !isWalletCreated ? (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          ) : needsBackup ? (
            <>
              <Stack.Screen name="Backup" component={BackupScreen} />
              <Stack.Screen
                name="BackupVerify"
                component={BackupVerifyScreen}
              />
            </>
          ) : !isWalletUnlocked ? (
            <Stack.Screen name="Locked" component={LockedScreen} />
          ) : (
            <>
              <Stack.Screen name="Dashboard" component={DashboardScreen} />
              <Stack.Screen name="Send" component={SendScreen} />
              <Stack.Screen name="Receive" component={ReceiveScreen} />
              <Stack.Screen name="Scan" component={ScanScreen} />
            </>
          )}
        </Stack.Navigator>
        <WalletConnectModal />
        <Toast />
      </NavigationContainer>
    </PaperProvider>
  );
}