import React, { useEffect, useState, useRef } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import Toast from 'react-native-toast-message';

// i18n init
import './src/i18n/index';

import OnboardingScreen from './src/components/OnboardingScreen.jsx';
import BackupScreen from './src/components/BackupScreen.jsx';
import BackupVerifyScreen from './src/components/BackupVerifyScreen.jsx';
import LockedScreen from './src/components/LockedScreen.jsx';
import DashboardScreen from './src/components/DashboardScreen.jsx';
import SendScreen from './src/components/SendScreen.jsx';
import ReceiveScreen from './src/components/ReceiveScreen.jsx';
import ScanScreen from './src/screens/ScanScreen';
import SettingsScreen from './src/screens/SettingsScreen.tsx';
import WalletConnectModal from './src/components/WalletConnectModal';
import AuthScreen from './src/screens/AuthScreen';
import useWalletStore from './src/store/walletStore';
import {
  observeAuthState,
  AuthUser,
  handleRedirectResultOnLoad,
  linkWalletAddressToUser
} from './src/services/authService';
import './src/firebaseConfig';
import { DarkTheme, LightTheme } from './src/theme';

const Stack = createNativeStackNavigator();

/**
 * Composant racine de l'application.
 * Gère la navigation principale, l'état d'authentification (Firebase/Web), le thème et les redirections globales.
 *
 * @returns {JSX.Element} L'application principale.
 */
export default function App() {
  const navRef = useRef<NavigationContainerRef<any>>(null);

  const isWalletCreated  = useWalletStore((s) => s.isWalletCreated);
  const isWalletUnlocked = useWalletStore((s) => s.isWalletUnlocked);
  const needsBackup      = useWalletStore((s) => s.needsBackup);
  const hasBackedUp      = useWalletStore((s) => s.hasBackedUp);
  const walletAddress    = useWalletStore((s) => s.address);
  const checkStorage     = useWalletStore((s) => s.actions.checkStorage);
  const themeMode        = useWalletStore((s) => s.themeMode);
  const walletStore      = useWalletStore();

  const [firebaseUser, setFirebaseUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading]   = useState(true);

  // Initial storage check
  useEffect(() => {
    checkStorage();
  }, [checkStorage]);

  // Preferences + auto-lock watcher
  useEffect(() => {
    walletStore.actions.initializePreferences?.();
    walletStore.actions.applyAutoLockWatcher?.();
  }, []);

  // Handle Google redirect (web)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      handleRedirectResultOnLoad()
        .then((user) => {
          if (user) {
            Toast.show({
              type: 'success',
              text1: 'Connecté',
              text2: user.email || ''
            });
            const addr = walletStore.address;
            if (walletStore.isWalletCreated && addr) {
              linkWalletAddressToUser(user.uid, addr).catch(() => {});
            }
          }
        })
        .catch(() => {
          Toast.show({
            type: 'error',
            text1: 'Erreur',
            text2: 'Connexion Google impossible'
          });
        });
    }
  }, []);

  // Observe Firebase auth on web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const unsub = observeAuthState((user) => {
        setFirebaseUser(user);
        setAuthLoading(false);
      });
      return unsub;
    } else {
      setAuthLoading(false);
    }
  }, []);

  // Central redirections
  useEffect(() => {
    if (authLoading) return;

    const needsAuth = Platform.OS === 'web' && (!firebaseUser || !firebaseUser.emailVerified);

    if (needsAuth) {
      if (navRef.current?.getCurrentRoute()?.name !== 'Auth') {
        navRef.current?.reset({ index: 0, routes: [{ name: 'Auth' }] });
      }
      return;
    }

    if (!isWalletCreated) {
      if (navRef.current?.getCurrentRoute()?.name !== 'Onboarding') {
        navRef.current?.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
      }
      return;
    }

    if (needsBackup && !hasBackedUp) {
      if (navRef.current?.getCurrentRoute()?.name !== 'Backup') {
        navRef.current?.reset({ index: 0, routes: [{ name: 'Backup' }] });
      }
      return;
    }

    if (!isWalletUnlocked) {
      if (navRef.current?.getCurrentRoute()?.name !== 'Locked') {
        navRef.current?.reset({ index: 0, routes: [{ name: 'Locked' }] });
      }
      return;
    }

    if (navRef.current?.getCurrentRoute()?.name !== 'Dashboard') {
      navRef.current?.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
    }
  }, [
    authLoading,
    firebaseUser,
    firebaseUser?.emailVerified,
    isWalletCreated,
    needsBackup,
    hasBackedUp,
    isWalletUnlocked
  ]);

  if (authLoading && Platform.OS === 'web') return null;

  const paperTheme =
    themeMode === 'dark'
      ? DarkTheme
      : themeMode === 'light'
        ? LightTheme
        : (Platform.OS === 'web'
            ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
              ? DarkTheme
              : LightTheme)
            : DarkTheme);

  return (
    <PaperProvider theme={paperTheme}>
      <NavigationContainer ref={navRef}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Backup" component={BackupScreen} />
          <Stack.Screen name="BackupVerify" component={BackupVerifyScreen} />
          <Stack.Screen name="Locked" component={LockedScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Send" component={SendScreen} />
          <Stack.Screen name="Receive" component={ReceiveScreen} />
          <Stack.Screen name="Scan" component={ScanScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
        <WalletConnectModal />
        <Toast />
      </NavigationContainer>
    </PaperProvider>
  );
}
