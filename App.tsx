import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import Toast from 'react-native-toast-message';

// IMPORTANT : Vérifie que ces chemins correspondent à tes fichiers sur GitHub
// D'après tes logs, tes fichiers sont dans src/components/
import OnboardingScreen from './src/components/OnboardingScreen';
import BackupScreen from './src/components/BackupScreen';
import LockedScreen from './src/components/LockedScreen';
import DashboardScreen from './src/components/DashboardScreen';
import SendScreen from './src/components/SendScreen';
// Si tu as ReceiveScreen et BackupVerifyScreen, décommente les lignes ci-dessous :
// import ReceiveScreen from './src/components/ReceiveScreen';
// import BackupVerifyScreen from './src/components/BackupVerifyScreen';

import { useWalletStore } from './src/store/walletStore';

const Stack = createNativeStackNavigator();

export default function App() {
  // On récupère l'état du portefeuille pour savoir quel écran afficher
  const isWalletCreated = useWalletStore((state) => state.isWalletCreated);
  const isWalletUnlocked = useWalletStore((state) => state.isWalletUnlocked);
  const needsBackup = useWalletStore((state) => state.needsBackup);

  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isWalletCreated ? (
            // 1. Pas de portefeuille -> Onboarding
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          ) : needsBackup ? (
            // 2. Portefeuille créé mais pas sauvegardé -> Backup
            <>
              <Stack.Screen name="Backup" component={BackupScreen} />
              {/* Ajoute BackupVerify ici si tu as le fichier */}
            </>
          ) : !isWalletUnlocked ? (
            // 3. Portefeuille verrouillé -> Écran de déverrouillage
            <Stack.Screen name="Locked" component={LockedScreen} />
          ) : (
            // 4. Tout est bon -> Dashboard et Actions
            <>
              <Stack.Screen name="Dashboard" component={DashboardScreen} />
              <Stack.Screen name="Send" component={SendScreen} />
              {/* Ajoute ReceiveScreen ici si tu as le fichier */}
            </>
          )}
        </Stack.Navigator>
        {/* Le composant Toast doit être ici pour s'afficher par-dessus tout */}
        <Toast />
      </NavigationContainer>
    </PaperProvider>
  );
}

