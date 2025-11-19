import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList, Linking, Modal, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useWalletStore, { SUPPORTED_NETWORKS } from '../store/walletStore';

function DashboardScreen() {
  const address = useWalletStore((state) => state.address);
  const balance = useWalletStore((state) => state.balance);
  const transactions = useWalletStore((state) => state.transactions);
  const tokenBalances = useWalletStore((state) => state.tokenBalances);
  const currentNetwork = useWalletStore((state) => state.currentNetwork);
  const lockWallet = useWalletStore((state) => state.actions.lockWallet);
  const wipeWallet = useWalletStore((state) => state.actions.wipeWallet);
  const fetchData = useWalletStore((state) => state.actions.fetchData);
  const setScreen = useWalletStore((state) => state.actions.setScreen);
  const switchNetwork = useWalletStore((state) => state.actions.switchNetwork);

  const [modalVisible, setModalVisible] = useState(false);
  
  // Use React Navigation when available (web/App.tsx)
  let navigation = null;
  try {
    navigation = useNavigation();
  } catch (e) {
    // Navigation not available (App.jsx), will use store-based navigation
  }

  useEffect(() => {
    if (address) {
      fetchData();
    }
  }, [address, currentNetwork, fetchData]);

  // Créer une liste d'actifs unifiée
  const assets = [
    { symbol: currentNetwork.symbol, balance: balance, logo: null, contractAddress: null, decimals: 18 }, // Actif natif du réseau
    ...tokenBalances
  ];

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

  const handleReceive = () => {
    // For store-based navigation (App.jsx)
    setScreen('receive');
    
    // For React Navigation (App.tsx / web)
    if (navigation && typeof navigation.navigate === 'function') {
      try {
        navigation.navigate('Receive');
      } catch (e) {
        console.log('Navigation to Receive failed:', e);
      }
    }
  };

  const handleSend = (asset) => {
    // For store-based navigation (App.jsx)
    setScreen('send', asset);
    
    // For React Navigation (App.tsx / web)
    if (navigation && typeof navigation.navigate === 'function') {
      try {
        navigation.navigate('Send');
      } catch (e) {
        console.log('Navigation to Send failed:', e);
      }
    }
  };

  const handleCopyAddress = async () => {
    try {
      // Try web clipboard API first
      if (Platform.OS === 'web' && navigator.clipboard) {
        await navigator.clipboard.writeText(address);
        Alert.alert('Succès', 'Adresse copiée dans le presse-papiers');
      } else {
        // Fallback to React Native Clipboard (will be imported dynamically)
        const { default: Clipboard } = await import('react-native').then(rn => ({ default: rn.Clipboard }));
        Clipboard.setString(address);
        Alert.alert('Succès', 'Adresse copiée dans le presse-papiers');
      }
    } catch (error) {
      console.log('Failed to copy address:', error);
      Alert.alert('Erreur', 'Impossible de copier l\'adresse');
    }
  };

  const handleBuy = () => {
    Alert.alert('Acheter', 'Fonctionnalité à venir : achat de crypto avec carte bancaire.');
  };

  const handleSell = () => {
    Alert.alert('Vendre', 'Fonctionnalité à venir : vente de crypto vers compte bancaire.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mon Portefeuille</Text>

      <TouchableOpacity 
        style={styles.networkSelector}
        onPress={() => setModalVisible(true)}>
        <Text style={styles.networkLabel}>Réseau actif :</Text>
        <Text style={styles.networkName}>{currentNetwork.name}</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sélectionner un réseau</Text>
            <FlatList
              data={SUPPORTED_NETWORKS}
              keyExtractor={(item) => item.chainId.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.networkItem,
                    item.chainId === currentNetwork.chainId && styles.networkItemSelected
                  ]}
                  onPress={() => {
                    switchNetwork(item);
                    setModalVisible(false);
                  }}>
                  <Text style={styles.networkItemName}>{item.name}</Text>
                  <Text style={styles.networkItemSymbol}>{item.symbol}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.infoBox}>
        <Text style={styles.label}>Adresse :</Text>
        <View style={styles.addressContainer}>
          <Text style={styles.address} selectable={true}>
            {address}
          </Text>
        </View>
        <TouchableOpacity style={styles.copyButton} onPress={handleCopyAddress}>
          <Text style={styles.copyButtonText}>📋 Copier l'adresse</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Solde total :</Text>
        <Text style={styles.balance}>{balance} {currentNetwork.symbol}</Text>
      </View>

      <Text style={styles.sectionTitle}>Mes Actifs</Text>

      <FlatList
        data={assets}
        keyExtractor={(item) => item.contractAddress || 'ETH'}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.assetItem}
            onPress={() => handleSend(item)}>
            <View style={styles.assetInfo}>
              {item.logo ? (
                <Text style={styles.assetLogo}>🪙</Text>
              ) : (
                <Text style={styles.assetLogo}>💎</Text>
              )}
              <View style={styles.assetDetails}>
                <Text style={styles.assetSymbol}>{item.symbol}</Text>
                <Text style={styles.assetBalance}>{item.balance}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        style={styles.assetsList}
      />

      <Text style={styles.sectionTitle}>Actions</Text>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionButton, styles.primaryAction]} onPress={handleReceive}>
          <Text style={styles.actionIcon}>📥</Text>
          <Text style={styles.actionButtonText}>Recevoir</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.primaryAction]} onPress={handleBuy}>
          <Text style={styles.actionIcon}>💳</Text>
          <Text style={styles.actionButtonText}>Acheter</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={[styles.actionButton, styles.disabledAction]} onPress={handleSell}>
          <Text style={styles.actionIcon}>💰</Text>
          <Text style={styles.actionButtonText}>Vendre</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.primaryAction]} onPress={() => {
          if (navigation && typeof navigation.navigate === 'function') {
            try {
              navigation.navigate('Scan');
            } catch (e) {
              console.log('Navigation to Scan failed:', e);
            }
          }
        }}>
          <Text style={styles.actionIcon}>📱</Text>
          <Text style={styles.actionButtonText}>Scan</Text>
        </TouchableOpacity>
      </View>

      {Platform.OS !== 'web' && (
        <TouchableOpacity style={styles.button} onPress={lockWallet}>
          <Text style={styles.buttonText}>Verrouiller</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.button, styles.dangerButton]}
        onPress={handleWipeWallet}>
        <Text style={styles.buttonText}>Effacer Portefeuille</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Historique des transactions</Text>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.hash}
        renderItem={({ item }) => {
          const isSent = item.from.toLowerCase() === address.toLowerCase();
          const direction = isSent ? 'Envoyé' : 'Reçu';
          
          return (
            <TouchableOpacity
              style={styles.transactionItem}
              onPress={() => Linking.openURL(`${currentNetwork.explorerUrl}/tx/${item.hash}`)}>
              <View style={styles.transactionRow}>
                <Text style={styles.transactionAmount}>
                  {item.value} {item.asset}
                </Text>
                <Text style={styles.transactionDate}>
                  {new Date(item.metadata.blockTimestamp).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.transactionDirection}>{direction}</Text>
              <Text style={styles.transactionAddress} numberOfLines={1}>
                De: {item.from.slice(0, 6)}...{item.from.slice(-4)}
              </Text>
              <Text style={styles.transactionAddress} numberOfLines={1}>
                À: {item.to.slice(0, 6)}...{item.to.slice(-4)}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Aucune transaction</Text>
        }
      />
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
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  networkSelector: {
    backgroundColor: '#E8F4FD',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  networkLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  networkName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '85%',
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  networkItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  networkItemSelected: {
    backgroundColor: '#E8F4FD',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  networkItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  networkItemSymbol: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  modalCloseButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  addressContainer: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  address: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  copyButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 15,
    color: '#333',
  },
  assetsList: {
    maxHeight: 200,
    marginBottom: 20,
  },
  assetItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  assetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetLogo: {
    fontSize: 32,
    marginRight: 15,
  },
  assetDetails: {
    flex: 1,
  },
  assetSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  assetBalance: {
    fontSize: 16,
    color: '#007AFF',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
    flexDirection: 'column',
  },
  primaryAction: {
    backgroundColor: '#007AFF',
  },
  disabledAction: {
    backgroundColor: '#B0BEC5',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  transactionItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  transactionDate: {
    fontSize: 14,
    color: '#666',
  },
  transactionDirection: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  transactionAddress: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 20,
  },
});

export default DashboardScreen;
