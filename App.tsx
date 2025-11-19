import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
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

import useWalletStore from './src/store/walletStore';

const Stack = createNativeStackNavigator();

export default function App() {
  const isWalletCreated = useWalletStore((state) => state.isWalletCreated);
  const isWalletUnlocked = useWalletStore((state) => state.isWalletUnlocked);
  const needsBackup = useWalletStore((state) => state.needsBackup);
  const checkStorage = useWalletStore((state) => state.actions.checkStorage);

  useEffect(() => {
    checkStorage();
  }, [checkStorage]);

  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isWalletCreated ? (
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