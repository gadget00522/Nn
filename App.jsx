/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import useWalletStore from './src/store/walletStore';
import OnboardingScreen from './src/components/OnboardingScreen';
import BackupScreen from './src/components/BackupScreen';
import LockedScreen from './src/components/LockedScreen';
import DashboardScreen from './src/components/DashboardScreen';
import SendScreen from './src/components/SendScreen';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const [showBackup, setShowBackup] = useState(false);
  const [mnemonic, setMnemonic] = useState(null);
  
  const isWalletCreated = useWalletStore((state) => state.isWalletCreated);
  const isWalletUnlocked = useWalletStore((state) => state.isWalletUnlocked);
  const currentScreen = useWalletStore((state) => state.currentScreen);
  const checkStorage = useWalletStore((state) => state.actions.checkStorage);

  useEffect(() => {
    checkStorage();
  }, [checkStorage]);

  const handleWalletCreated = (mnemonicPhrase) => {
    setMnemonic(mnemonicPhrase);
    setShowBackup(true);
  };

  const handleBackupContinue = () => {
    setShowBackup(false);
    setMnemonic(null);
  };

  let screen;
  if (!isWalletCreated) {
    screen = <OnboardingScreen onWalletCreated={handleWalletCreated} />;
  } else if (showBackup && mnemonic) {
    screen = <BackupScreen mnemonic={mnemonic} onContinue={handleBackupContinue} />;
  } else if (!isWalletUnlocked) {
    screen = <LockedScreen />;
  } else {
    // Wallet is unlocked, show screen based on currentScreen state
    if (currentScreen === 'send') {
      screen = <SendScreen />;
    } else {
      screen = <DashboardScreen />;
    }
  }

  return (
    <View style={styles.container}>
      {screen}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
