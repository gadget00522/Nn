import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import useWalletStore from '../store/walletStore';
import { useNavigation } from '@react-navigation/native';
import { ethers } from 'ethers';

function SwapScreen() {
  const navigation = useNavigation();
  const [amount, setAmount] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  
  const address = useWalletStore((state) => state.address);
  const balance = useWalletStore((state) => state.balance);
  const mnemonic = useWalletStore((state) => state.mnemonic);
  const currentNetwork = useWalletStore((state) => state.currentNetwork);
  const fetchData = useWalletStore((state) => state.actions.fetchData);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSwap = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Montant invalide',
        text2: 'Veuillez entrer un montant valide',
      });
      return;
    }

    if (parseFloat(amount) > parseFloat(balance)) {
      Toast.show({
        type: 'error',
        text1: 'Solde insuffisant',
        text2: 'Vous n\'avez pas assez de fonds',
      });
      return;
    }

    setIsSwapping(true);
    
    try {
      // DEMO SWAP: Effectue une transaction de test vers la même adresse
      // Cela simule un swap en effectuant une vraie transaction on-chain
      const provider = new ethers.providers.JsonRpcProvider(currentNetwork.rpcUrl);
      const wallet = ethers.Wallet.fromPhrase(mnemonic);
      const connectedWallet = wallet.connect(provider);
      
      // Transaction vers soi-même (demo swap)
      const txValue = ethers.utils.parseEther(amount);
      const tx = {
        to: address, // Envoie à soi-même pour la démo
        value: txValue,
      };
      
      Toast.show({
        type: 'info',
        text1: 'Swap en cours',
        text2: 'Transaction en cours d\'envoi...',
      });
      
      const txResponse = await connectedWallet.sendTransaction(tx);
      
      Toast.show({
        type: 'info',
        text1: 'Confirmation en cours',
        text2: 'En attente de confirmation...',
      });
      
      await txResponse.wait();
      
      Toast.show({
        type: 'success',
        text1: 'Swap réussi',
        text2: `Transaction confirmée: ${txResponse.hash.slice(0, 10)}...`,
      });
      
      // Rafraîchir les données
      await fetchData();
      
      // Retour au dashboard
      setTimeout(() => {
        navigation.navigate('Dashboard');
      }, 2000);
      
    } catch (error) {
      console.error('Swap error:', error);
      Toast.show({
        type: 'error',
        text1: 'Échec du swap',
        text2: error.message || 'Une erreur est survenue',
      });
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
        <View style={styles.demoBadge}>
          <Text style={styles.demoBadgeText}>🧪 SWAP DE TEST - {currentNetwork.name}</Text>
        </View>

        <Text style={styles.infoText}>
          Cette fonctionnalité effectue une transaction de test sur le testnet {currentNetwork.name}. 
          Les fonds sont envoyés à votre propre adresse pour simuler un swap.
        </Text>

        <View style={styles.swapBox}>
          <View style={styles.tokenSection}>
            <Text style={styles.sectionLabel}>De</Text>
            <View style={styles.tokenRow}>
              <View style={styles.tokenInfo}>
                <Text style={styles.tokenIcon}>💎</Text>
                <Text style={styles.tokenSymbol}>{currentNetwork.symbol}</Text>
              </View>
              <Text style={styles.tokenBalance}>Solde: {parseFloat(balance).toFixed(4)}</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="0.0"
              placeholderTextColor="#8B92A6"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              editable={!isSwapping}
            />
          </View>

          <View style={styles.swapIconContainer}>
            <Text style={styles.swapIcon}>🔄</Text>
          </View>

          <View style={styles.tokenSection}>
            <Text style={styles.sectionLabel}>Vers</Text>
            <View style={styles.tokenRow}>
              <View style={styles.tokenInfo}>
                <Text style={styles.tokenIcon}>💎</Text>
                <Text style={styles.tokenSymbol}>{currentNetwork.symbol}</Text>
              </View>
              <Text style={styles.tokenBalance}>Test Swap</Text>
            </View>
            <View style={styles.outputBox}>
              <Text style={styles.outputText}>
                {amount || '0.0'}
              </Text>
            </View>
          </View>
        </View>

        {isSwapping ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#037DD6" />
            <Text style={styles.loadingText}>Swap en cours...</Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.swapButton, (!amount || parseFloat(amount) <= 0) && styles.buttonDisabled]} 
            onPress={handleSwap}
            disabled={!amount || parseFloat(amount) <= 0}>
            <Text style={styles.swapButtonText}>Confirmer le swap de test</Text>
          </TouchableOpacity>
        )}

        <View style={styles.warningBox}>
          <Text style={styles.warningIcon}>ℹ️</Text>
          <Text style={styles.warningText}>
            Ceci est un swap de démonstration sur testnet. Une transaction réelle sera effectuée 
            mais les fonds seront simplement renvoyés à votre adresse.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#24272A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#3C4043',
  },
  backButton: {
    color: '#037DD6',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  demoBadge: {
    backgroundColor: '#2D3748',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 15,
  },
  demoBadgeText: {
    color: '#F7931A',
    fontSize: 12,
    fontWeight: '600',
  },
  infoText: {
    color: '#8B92A6',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  swapBox: {
    backgroundColor: '#141618',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  tokenSection: {
    marginBottom: 15,
  },
  sectionLabel: {
    color: '#8B92A6',
    fontSize: 12,
    marginBottom: 10,
    fontWeight: '600',
  },
  tokenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tokenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  tokenSymbol: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  tokenBalance: {
    color: '#8B92A6',
    fontSize: 12,
  },
  input: {
    backgroundColor: '#24272A',
    borderRadius: 10,
    padding: 15,
    fontSize: 24,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3C4043',
  },
  swapIconContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  swapIcon: {
    fontSize: 30,
  },
  outputBox: {
    backgroundColor: '#24272A',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#3C4043',
  },
  outputText: {
    fontSize: 24,
    color: '#8B92A6',
  },
  swapButton: {
    backgroundColor: '#037DD6',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#4A5568',
    opacity: 0.6,
  },
  swapButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#8B92A6',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#2D3748',
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#037DD6',
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  warningText: {
    flex: 1,
    color: '#037DD6',
    fontSize: 12,
    lineHeight: 18,
  },
});

export default SwapScreen;
