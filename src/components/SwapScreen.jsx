import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import useWalletStore from '../store/walletStore';
import { useNavigation } from '@react-navigation/native';
import { ethers } from 'ethers';
import React, { useState } from 'react';

function SwapScreen() {
  const navigation = useNavigation();
  const [amount, setAmount] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);

  const address = useWalletStore((state) => state.address);
  const balance = useWalletStore((state) => state.balance);
  const mnemonic = useWalletStore((state) => state.mnemonic);
  const currentNetwork = useWalletStore((state) => state.currentNetwork);
  const fetchData = useWalletStore((state) => state.actions.fetchData);

  const handleBack = () => navigation.goBack();

  const handleSwap = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Toast.show({ type: 'error', text1: 'Montant invalide', text2: 'Veuillez entrer un montant valide' });
      return;
    }
    if (parseFloat(amount) > parseFloat(balance)) {
      Toast.show({ type: 'error', text1: 'Solde insuffisant', text2: 'Fonds insuffisants' });
      return;
    }
    if (!mnemonic) {
      Toast.show({ type: 'error', text1: 'Wallet verrouillé', text2: 'Déverrouillez d’abord le portefeuille' });
      return;
    }

    setIsSwapping(true);
    try {
      const provider = new ethers.providers.JsonRpcProvider(currentNetwork.rpcUrl);
      const wallet = ethers.Wallet.fromMnemonic(mnemonic);
      const connectedWallet = wallet.connect(provider);

      const txValue = ethers.utils.parseEther(amount);
      const tx = { to: address, value: txValue };

      Toast.show({ type: 'info', text1: 'Swap en cours', text2: 'Transaction envoyée...' });
      const txResponse = await connectedWallet.sendTransaction(tx);

      Toast.show({ type: 'info', text1: 'Confirmation', text2: 'En attente...' });
      await txResponse.wait();

      Toast.show({
        type: 'success',
        text1: 'Swap réussi',
        text2: `Tx: ${txResponse.hash.slice(0, 10)}...`
      });

      await fetchData();
      setTimeout(() => navigation.navigate('Dashboard'), 1500);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Échec du swap', text2: error.message || 'Erreur inconnue' });
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.backButton}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Échanger</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Montant</Text>
        <TextInput
          style={styles.input}
          placeholder="0.0"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />
        <TouchableOpacity
          style={[styles.button, isSwapping && styles.buttonDisabled]}
          onPress={handleSwap}
          disabled={isSwapping}
        >
          <Text style={styles.buttonText}>{isSwapping ? 'Swap...' : 'Confirmer le swap'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#24272A', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  backButton: { color: '#037DD6', fontSize: 16, fontWeight: '600' },
  title: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  placeholder: { width: 60 },
  content: { flex: 1 },
  label: { color: '#D6D9DC', fontSize: 14, marginBottom: 8, fontWeight: '600' },
  input: {
    backgroundColor: '#141618', borderRadius: 8, padding: 12,
    fontSize: 16, color: '#FFFFFF', marginBottom: 16, borderWidth: 1, borderColor: '#3C4043'
  },
  button: {
    backgroundColor: '#037DD6', paddingVertical: 14, borderRadius: 999,
    alignItems: 'center', marginTop: 10
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});

export default SwapScreen;
