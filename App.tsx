import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import Toast from 'react-native-toast-message';

import OnboardingScreen from './src/components/OnboardingScreen.jsx';
import BackupScreen from './src/components/BackupScreen.jsx';
import LockedScreen from './src/components/LockedScreen.jsx';
import DashboardScreen from './src/components/DashboardScreen.jsx';
import SendScreen from './src/components/SendScreen.jsx';

import useWalletStore from './src/store/walletStore';

const Stack = createNativeStackNavigator();

export default function App() {
  const isWalletCreated = useWalletStore((state) => state.isWalletCreated);
  const isWalletUnlocked = useWalletStore((state) => state.isWalletUnlocked);
  const needsBackup = useWalletStore((state) => state.needsBackup);

  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isWalletCreated ? (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          ) : needsBackup ? (
            <Stack.Screen name="Backup" component={BackupScreen} />
          ) : !isWalletUnlocked ? (
            <Stack.Screen name="Locked" component={LockedScreen} />
          ) : (
            <>
              <Stack.Screen name="Dashboard" component={DashboardScreen} />
              <Stack.Screen name="Send" component={SendScreen} />
            </>
          )}
        </Stack.Navigator>
        <Toast />
      </NavigationContainer>
    </PaperProvider>
  );
}


