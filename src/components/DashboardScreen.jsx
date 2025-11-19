import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, Modal } from 'react-native';
import Toast from 'react-native-toast-message';
import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList, Linking, Modal, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useWalletStore, { SUPPORTED_NETWORKS } from '../store/walletStore';
import { useNavigation } from '@react-navigation/native';

function DashboardScreen() {
  const navigation = useNavigation();
  const address = useWalletStore((state) => state.address);
  const balance = useWalletStore((state) => state.balance);
  const tokenBalances = useWalletStore((state) => state.tokenBalances);
  const currentNetwork = useWalletStore((state) => state.currentNetwork);
  const fetchData = useWalletStore((state) => state.actions.fetchData);
  const switchNetwork = useWalletStore((state) => state.actions.switchNetwork);
  const setScreen = useWalletStore((state) => state.actions.setScreen);

  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('tokens');
  
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
    { symbol: currentNetwork.symbol, balance: balance, logo: null, contractAddress: null, decimals: 18 },
    ...tokenBalances
  ];

  const handleBuy = () => {
    Toast.show({
      type: 'info',
      text1: 'Fonctionnalité bientôt disponible',
      text2: 'L\'achat de crypto sera disponible prochainement',
    });
  };

  const handleSwap = () => {
    navigation.navigate('Swap');
  };

  const handleSend = () => {
    setScreen('send', null);
    navigation.navigate('Send');
  };

  const handleReceive = () => {
    setScreen('receive');
    navigation.navigate('Receive');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleCopyAddress = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(address);
      Toast.show({
        type: 'success',
        text1: 'Adresse copiée',
        text2: 'L\'adresse a été copiée dans le presse-papiers',
      });
    }
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
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleSettings}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.accountBadge}
          onPress={handleCopyAddress}>
          <Text style={styles.accountName}>Account 1</Text>
          <Text style={styles.accountAddress}>
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.networkIcon}>🌐</Text>
        </TouchableOpacity>
      </View>

      {/* Network Modal */}
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

      <ScrollView style={styles.scrollView}>
        {/* Network Badge */}
        <View style={styles.networkBadge}>
          <Text style={styles.networkBadgeText}>{currentNetwork.name} - Testnet</Text>
        </View>
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

        {/* Balance Section */}
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Solde total</Text>
          <Text style={styles.balance}>
            {parseFloat(balance).toFixed(4)} {currentNetwork.symbol}
          </Text>
          <Text style={styles.balanceUSD}>≈ 0,00 $US (Testnet)</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleBuy}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>💳</Text>
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
            <Text style={styles.actionText}>Acheter</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleSwap}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>🔄</Text>
            </View>
            <Text style={styles.actionText}>Échanger</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleSend}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>📤</Text>
            </View>
            <Text style={styles.actionText}>Envoyer</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleReceive}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>📥</Text>
            </View>
            <Text style={styles.actionText}>Recevoir</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'tokens' && styles.tabActive]}
            onPress={() => setActiveTab('tokens')}>
            <Text style={[styles.tabText, activeTab === 'tokens' && styles.tabTextActive]}>
              Jetons
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'defi' && styles.tabActive]}
            onPress={() => setActiveTab('defi')}>
            <Text style={[styles.tabText, activeTab === 'defi' && styles.tabTextActive]}>
              DeFi
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'nft' && styles.tabActive]}
            onPress={() => setActiveTab('nft')}>
            <Text style={[styles.tabText, activeTab === 'nft' && styles.tabTextActive]}>
              NFT
            </Text>
          </TouchableOpacity>
        </View>
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
      </View>

      {Platform.OS !== 'web' && (
        <TouchableOpacity style={styles.button} onPress={lockWallet}>
          <Text style={styles.buttonText}>Verrouiller</Text>
        </TouchableOpacity>
      )}

        {/* Token List */}
        {activeTab === 'tokens' && (
          <View style={styles.tokenList}>
            {assets.map((item, index) => (
              <TouchableOpacity
                key={item.contractAddress || index}
                style={styles.tokenItem}
                onPress={() => {
                  setScreen('send', item);
                  navigation.navigate('Send');
                }}>
                <View style={styles.tokenIcon}>
                  <Text style={styles.tokenIconText}>
                    {item.contractAddress ? '🪙' : '💎'}
                  </Text>
                </View>
                <View style={styles.tokenInfo}>
                  <Text style={styles.tokenSymbol}>{item.symbol}</Text>
                  <Text style={styles.tokenName}>{item.contractAddress ? 'Token' : currentNetwork.name}</Text>
                </View>
                <View style={styles.tokenBalance}>
                  <Text style={styles.tokenBalanceAmount}>
                    {parseFloat(item.balance).toFixed(4)}
                  </Text>
                  <Text style={styles.tokenBalanceSymbol}>{item.symbol}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 'defi' && (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>🏦</Text>
            <Text style={styles.placeholderTitle}>DeFi bientôt disponible</Text>
            <Text style={styles.placeholderSubtitle}>
              Les fonctionnalités DeFi seront disponibles prochainement
            </Text>
          </View>
        )}

        {activeTab === 'nft' && (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>🖼️</Text>
            <Text style={styles.placeholderTitle}>NFT bientôt disponibles</Text>
            <Text style={styles.placeholderSubtitle}>
              Vos NFT seront affichés ici prochainement
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#24272A',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3C4043',
  },
  menuIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  accountBadge: {
    backgroundColor: '#141618',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3C4043',
  },
  accountName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  accountAddress: {
    color: '#8B92A6',
    fontSize: 10,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  networkIcon: {
    fontSize: 24,
  },
  scrollView: {
    flex: 1,
  },
  networkBadge: {
    backgroundColor: '#2D3748',
    marginHorizontal: 15,
    marginTop: 15,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  networkBadgeText: {
    color: '#F7931A',
    fontSize: 12,
    fontWeight: '600',
  },
  balanceSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  balanceLabel: {
    color: '#8B92A6',
    fontSize: 14,
    marginBottom: 8,
  },
  balance: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  balanceUSD: {
    color: '#8B92A6',
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 15,
    marginBottom: 30,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#037DD6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionIconText: {
    fontSize: 24,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#3C4043',
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#037DD6',
  },
  tabText: {
    color: '#8B92A6',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#037DD6',
  },
  tokenList: {
    paddingHorizontal: 15,
  },
  tokenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141618',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2D3748',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tokenIconText: {
    fontSize: 20,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenSymbol: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  tokenName: {
    color: '#8B92A6',
    fontSize: 12,
  },
  tokenBalance: {
    alignItems: 'flex-end',
  },
  tokenBalanceAmount: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
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
  tokenBalanceSymbol: {
    color: '#8B92A6',
    fontSize: 12,
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  placeholderText: {
    fontSize: 60,
    marginBottom: 20,
  },
  placeholderTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  placeholderSubtitle: {
    color: '#8B92A6',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#24272A',
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
    color: '#FFFFFF',
  },
  networkItem: {
    backgroundColor: '#141618',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  networkItemSelected: {
    backgroundColor: '#2D3748',
    borderWidth: 2,
    borderColor: '#037DD6',
  },
  networkItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  networkItemSymbol: {
    fontSize: 14,
    color: '#037DD6',
    fontWeight: 'bold',
  },
  modalCloseButton: {
    backgroundColor: '#037DD6',
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
    marginTop: 10,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DashboardScreen;
