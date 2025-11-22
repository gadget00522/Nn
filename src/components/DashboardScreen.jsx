import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView,
  Modal, Alert, Platform
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { useWalletStore, SUPPORTED_NETWORKS } from '../store/walletStore';
import { useTranslation } from 'react-i18next';

/**
 * Écran principal du tableau de bord (Dashboard).
 * Affiche le solde, la liste des tokens, et les actions principales (Envoyer, Recevoir, Échanger).
 * Permet également de changer de réseau et de verrouiller le portefeuille.
 *
 * @returns {JSX.Element} L'interface utilisateur du tableau de bord.
 */
function DashboardScreen() {
  // const { t } = useTranslation(); // Désactivé pour éviter les erreurs si pas configuré
  const navigation = useNavigation();

  const address = useWalletStore((state) => state.address);
  const balance = useWalletStore((state) => state.balance);
  const tokenBalances = useWalletStore((state) => state.tokenBalances);
  const currentNetwork = useWalletStore((state) => state.currentNetwork);
  const fetchData = useWalletStore((state) => state.actions.fetchData);
  const switchNetwork = useWalletStore((state) => state.actions.switchNetwork);
  const lockWallet = useWalletStore((state) => state.actions.lockWallet);

  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('tokens');

  /**
   * Récupère les données du portefeuille (solde, tokens) à chaque changement d'adresse ou de réseau.
   */
  useEffect(() => {
    if (address) {
      fetchData();
    }
  }, [address, currentNetwork]);

  const assets = [
    {
      symbol: currentNetwork?.symbol || 'ETH',
      balance: balance,
      logo: null,
      contractAddress: null,
      decimals: 18,
    },
    ...tokenBalances,
  ];

  /**
   * Copie l'adresse du portefeuille dans le presse-papiers.
   */
  const handleCopyAddress = async () => {
    if (!address) return;
    try {
      if (Platform.OS === 'web' && navigator.clipboard) {
        await navigator.clipboard.writeText(address);
        Toast.show({ type: 'success', text1: 'Copié', text2: 'Adresse copiée' });
      } else {
        const { Clipboard } = await import('react-native');
        Clipboard.setString(address);
        Alert.alert('Succès', 'Adresse copiée');
      }
    } catch {
      Alert.alert('Erreur', "Copie impossible");
    }
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleReceive = () => navigation.navigate('Receive');
  const handleSend = () => navigation.navigate('Send', { asset: assets[0] });
  const handleScan = () => navigation.navigate('Scan');
  const handleSwap = () => console.log("Swap bientôt");

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleSettings}>
          <Text style={styles.menuIcon}>⚙️</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.accountBadge} onPress={handleCopyAddress}>
          <Text style={styles.accountName}>Account 1</Text>
          <Text style={styles.accountAddress}>
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.networkIcon}>🌐</Text>
        </TouchableOpacity>
      </View>

      <Modal transparent visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
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
                    currentNetwork && item.chainId === currentNetwork.chainId && styles.networkItemSelected,
                  ]}
                  onPress={() => {
                    switchNetwork(item);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.networkItemName}>{item.name}</Text>
                  <Text style={styles.networkItemSymbol}>{item.symbol}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={[styles.modalCloseButton, { marginTop: 10, padding: 12, borderRadius: 10 }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.scrollView}>
        <View style={styles.networkBadge}>
          <Text style={styles.networkBadgeText}>{currentNetwork?.name || 'Réseau'} - Testnet</Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.label}>Adresse :</Text>
          <View style={styles.addressContainer}>
            <Text style={styles.address} selectable>
              {address}
            </Text>
          </View>
          <TouchableOpacity style={styles.copyButton} onPress={handleCopyAddress}>
            <Text style={styles.copyButtonText}>📋 Copier l'adresse</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Solde principal :</Text>
          <Text style={styles.balancePlain}>
            {balance} {currentNetwork?.symbol}
          </Text>
        </View>

        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Solde total</Text>
          <Text style={styles.balanceValue}>
            {parseFloat(balance || '0').toFixed(4)} {currentNetwork?.symbol}
          </Text>
          <Text style={styles.balanceUSD}>~ 0,00 $US (Testnet)</Text>
        </View>

        <View style={styles.actionButtons}>
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

          <TouchableOpacity style={styles.actionButton} onPress={lockWallet}>
            <View style={[styles.actionIcon, { backgroundColor: '#E53935' }]}>
              <Text style={styles.actionIconText}>🔒</Text>
            </View>
            <Text style={styles.actionText}>Verrouiller</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'tokens' && styles.tabActive]}
            onPress={() => setActiveTab('tokens')}
          >
            <Text style={[styles.tabText, activeTab === 'tokens' && styles.tabTextActive]}>
              Jetons
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'defi' && styles.tabActive]}
            onPress={() => setActiveTab('defi')}
          >
            <Text style={[styles.tabText, activeTab === 'defi' && styles.tabTextActive]}>
              DeFi
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'nft' && styles.tabActive]}
            onPress={() => setActiveTab('nft')}
          >
            <Text style={[styles.tabText, activeTab === 'nft' && styles.tabTextActive]}>
              NFT
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'tokens' && (
          <View style={styles.tokenList}>
            {assets.map((a, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.tokenItem}
                onPress={() => navigation.navigate('Send', { asset: a })}
              >
                <View style={styles.tokenIcon}>
                  <Text style={styles.tokenIconText}>{a.symbol ? a.symbol[0] : '?'}</Text>
                </View>
                <View style={styles.tokenInfo}>
                  <Text style={styles.tokenSymbol}>{a.symbol}</Text>
                  <Text style={styles.tokenName}>Asset</Text>
                </View>
                <View style={styles.tokenBalance}>
                  <Text style={styles.tokenBalanceAmount}>{a.balance}</Text>
                  <Text style={styles.tokenBalanceSymbol}>{a.symbol}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {/* Placeholders DeFi et NFT retirés pour raccourcir, mais tu peux les garder */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#24272A' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#3C4043' },
  menuIcon: { fontSize: 24, color: '#FFFFFF' },
  accountBadge: { backgroundColor: '#141618', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#3C4043' },
  accountName: { color: '#FFFFFF', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  accountAddress: { color: '#8B92A6', fontSize: 10, fontFamily: 'monospace', textAlign: 'center' },
  networkIcon: { fontSize: 24, color: '#FFFFFF' },
  scrollView: { flex: 1 },
  networkBadge: { backgroundColor: '#2D3748', marginHorizontal: 15, marginTop: 15, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start' },
  networkBadgeText: { color: '#F7931A', fontSize: 12, fontWeight: '600' },
  infoBox: { backgroundColor: '#141618', marginHorizontal: 15, marginTop: 15, padding: 15, borderRadius: 12 },
  label: { color: '#8B92A6', fontSize: 12, marginBottom: 6 },
  addressContainer: { backgroundColor: '#1F2224', borderRadius: 8, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#3C4043' },
  address: { fontSize: 12, color: '#FFFFFF', fontFamily: 'monospace', lineHeight: 18 },
  copyButton: { backgroundColor: '#4CAF50', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  copyButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  balancePlain: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginTop: 4 },
  balanceSection: { alignItems: 'center', paddingVertical: 30 },
  balanceLabel: { color: '#8B92A6', fontSize: 14, marginBottom: 8 },
  balanceValue: { color: '#FFFFFF', fontSize: 36, fontWeight: 'bold', marginBottom: 4 },
  balanceUSD: { color: '#8B92A6', fontSize: 16 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 15, marginBottom: 30 },
  actionButton: { alignItems: 'center', flex: 1 },
  actionIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#037DD6', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionIconText: { fontSize: 24 },
  actionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#3C4043', marginBottom: 15 },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#037DD6' },
  tabText: { color: '#8B92A6', fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#037DD6' },
  tokenList: { paddingHorizontal: 15, paddingBottom: 20 },
  tokenItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141618', borderRadius: 12, padding: 15, marginBottom: 10 },
  tokenIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2D3748', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  tokenIconText: { fontSize: 20, color: '#FFFFFF' },
  tokenInfo: { flex: 1 },
  tokenSymbol: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginBottom: 2 },
  tokenName: { color: '#8B92A6', fontSize: 12 },
  tokenBalance: { alignItems: 'flex-end' },
  tokenBalanceAmount: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginBottom: 2 },
  tokenBalanceSymbol: { color: '#8B92A6', fontSize: 12 },
  placeholderContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  placeholderEmoji: { fontSize: 60, marginBottom: 20 },
  placeholderTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  placeholderSubtitle: { color: '#8B92A6', fontSize: 14, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#24272A', borderRadius: 20, padding: 20, width: '85%', maxHeight: '60%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#FFFFFF' },
  networkItem: { backgroundColor: '#141618', borderRadius: 10, padding: 15, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  networkItemSelected: { backgroundColor: '#2D3748', borderWidth: 2, borderColor: '#037DD6' },
  networkItemName: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  networkItemSymbol: { fontSize: 14, color: '#037DD6', fontWeight: 'bold' },
  modalCloseButton: { backgroundColor: '#037DD6', alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

export default DashboardScreen;
