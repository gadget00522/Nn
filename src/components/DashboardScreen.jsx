import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import useWalletStore from '../store/walletStore';

function DashboardScreen() {
  const address = useWalletStore((state) => state.address);
  const balance = useWalletStore((state) => state.balance);
  const lockWallet = useWalletStore((state) => state.actions.lockWallet);
  const wipeWallet = useWalletStore((state) => state.actions.wipeWallet);
  const fetchBalance = useWalletStore((state) => state.actions.fetchBalance);
  const setScreen = useWalletStore((state) => state.actions.setScreen);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const handleWipeWallet = () => {
    Alert.alert(
      'Effacer le portefeuille',
      'Êtes-vous sûr de vouloir effacer définitivement votre portefeuille ? Cette action est irréversible.',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: wipeWallet,
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mon Portefeuille</Text>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Adresse :</Text>
        <Text style={styles.address} numberOfLines={1} ellipsizeMode="middle">
          {address}
        </Text>

        <Text style={styles.label}>Solde :</Text>
        <Text style={styles.balance}>{balance} ETH</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => setScreen('send')}>
        <Text style={styles.buttonText}>Envoyer</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={lockWallet}>
        <Text style={styles.buttonText}>Verrouiller</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.dangerButton]}
        onPress={handleWipeWallet}>
        <Text style={styles.buttonText}>Effacer Portefeuille</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 20,
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    marginTop: 10,
  },
  address: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
    marginBottom: 15,
  },
  balance: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default DashboardScreen;
