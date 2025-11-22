import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView,
  Modal, Alert, Platform, ImageBackground
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { useWalletStore, SUPPORTED_NETWORKS } from '../store/walletStore';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

function DashboardScreen() {
  const navigation = useNavigation();
  const theme = useTheme();

  const address = useWalletStore((state) => state.address);
  const balance = useWalletStore((state) => state.balance);
  const tokenBalances = useWalletStore((state) => state.tokenBalances);
  const currentNetwork = useWalletStore((state) => state.currentNetwork);
  const fetchData = useWalletStore((state) => state.actions.fetchData);
  const switchNetwork = useWalletStore((state) => state.actions.switchNetwork);
  const lockWallet = useWalletStore((state) => state.actions.lockWallet);

  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('tokens');

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

  const handleSettings = () => navigation.navigate('Settings');
  const handleReceive = () => navigation.navigate('Receive');
  const handleSend = () => navigation.navigate('Send', { asset: assets[0] });
  const handleSwap = () => Toast.show({ type: 'info', text1: 'Bientôt', text2: 'Fonctionnalité à venir' });
  const handleAiChat = () => navigation.navigate('AiChat');

  // Dynamic Styles
  const styles = getStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleSettings} style={styles.iconButton}>
          <Icon name="cog" size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.accountBadge} onPress={handleCopyAddress}>
          <View style={[styles.statusDot, { backgroundColor: theme.colors.success }]} />
          <Text style={styles.accountName}>Account 1</Text>
          <Icon name="chevron-down" size={16} color={theme.colors.secondary} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleAiChat} style={styles.iconButton}>
             <Icon name="robot" size={24} color={theme.colors.primary} />
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
              style={[styles.modalCloseButton]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Main Card */}
        <View style={styles.mainCard}>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.networkChip}>
                <Text style={styles.networkChipText}>{currentNetwork?.name || 'Réseau'}</Text>
                <Icon name="chevron-down" size={12} color={theme.colors.onSurface} />
            </TouchableOpacity>

            <View style={styles.balanceContainer}>
                <Text style={styles.balanceValue}>
                    {parseFloat(balance || '0').toFixed(4)} {currentNetwork?.symbol}
                </Text>
                <Text style={styles.balanceUSD}>~ $0.00</Text>
            </View>

            <View style={styles.addressRow}>
                 <Text style={styles.addressText}>
                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
                  </Text>
                  <TouchableOpacity onPress={handleCopyAddress}>
                      <Icon name="content-copy" size={14} color={theme.colors.secondary} style={{marginLeft: 8}}/>
                  </TouchableOpacity>
            </View>

            <View style={styles.actionButtonsRow}>
                <ActionButton icon="arrow-up" label="Envoyer" onPress={handleSend} theme={theme} />
                <ActionButton icon="arrow-down" label="Recevoir" onPress={handleReceive} theme={theme} />
                <ActionButton icon="swap-horizontal" label="Échanger" onPress={handleSwap} theme={theme} />
                <ActionButton icon="lock" label="Verrou" onPress={lockWallet} theme={theme} color={theme.colors.error} />
            </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {['tokens', 'nft', 'activity'].map((tab) => (
             <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === 'tokens' ? 'Jetons' : tab === 'nft' ? 'NFTs' : 'Activité'}
                </Text>
              </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'tokens' && (
          <View style={styles.listContainer}>
            {assets.map((a, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.listItem}
                onPress={() => navigation.navigate('Send', { asset: a })}
              >
                <View style={[styles.tokenIcon, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <Text style={{ fontSize: 20, color: theme.colors.text }}>{a.symbol ? a.symbol[0] : '?'}</Text>
                </View>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemTitle}>{a.symbol}</Text>
                  <Text style={styles.listItemSubtitle}>Asset</Text>
                </View>
                <View style={styles.listItemEnd}>
                  <Text style={styles.listItemValue}>{parseFloat(a.balance || '0').toFixed(4)}</Text>
                  <Text style={styles.listItemSubValue}>{a.symbol}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === 'nft' && (
             <View style={styles.listContainer}>
                 <TouchableOpacity style={styles.listItem} onPress={() => navigation.navigate('NftGallery')}>
                    <View style={[styles.tokenIcon, { backgroundColor: theme.colors.primary }]}>
                        <Icon name="image" size={24} color={theme.colors.onPrimary} />
                    </View>
                    <View style={styles.listItemContent}>
                        <Text style={styles.listItemTitle}>Galerie NFT</Text>
                        <Text style={styles.listItemSubtitle}>Voir mes collections</Text>
                    </View>
                    <Icon name="chevron-right" size={24} color={theme.colors.secondary} />
                 </TouchableOpacity>
            </View>
        )}

        {activeTab === 'activity' && (
            <View style={styles.listContainer}>
                <TouchableOpacity style={styles.listItem} onPress={() => navigation.navigate('Market')}>
                    <View style={[styles.tokenIcon, { backgroundColor: theme.colors.secondary }]}>
                        <Icon name="chart-line" size={24} color={theme.colors.onPrimary} />
                    </View>
                    <View style={styles.listItemContent}>
                        <Text style={styles.listItemTitle}>Marché & Actus</Text>
                        <Text style={styles.listItemSubtitle}>Voir les tendances</Text>
                    </View>
                    <Icon name="chevron-right" size={24} color={theme.colors.secondary} />
                </TouchableOpacity>
            </View>
        )}

      </ScrollView>
    </View>
  );
}

const ActionButton = ({ icon, label, onPress, theme, color }: any) => (
    <TouchableOpacity style={localStyles.actionBtn} onPress={onPress}>
        <View style={[localStyles.actionBtnIcon, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Icon name={icon} size={24} color={color || theme.colors.primary} />
        </View>
        <Text style={[localStyles.actionBtnLabel, { color: theme.colors.secondary }]}>{label}</Text>
    </TouchableOpacity>
);

const localStyles = StyleSheet.create({
    actionBtn: { alignItems: 'center', width: 70 },
    actionBtnIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
    actionBtnLabel: { fontSize: 12, fontWeight: '500' }
});

const getStyles = (theme: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  iconButton: { padding: 8 },
  accountBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  accountName: { color: theme.colors.text, fontSize: 14, fontWeight: '600', marginRight: 4 },

  scrollView: { flex: 1 },

  mainCard: {
      alignItems: 'center',
      paddingVertical: 24,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
      backgroundColor: theme.colors.surface, // Should be a gradient ideally
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
  },
  networkChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surfaceVariant, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginBottom: 16 },
  networkChipText: { color: theme.colors.text, marginRight: 6, fontSize: 12, fontWeight: '600' },

  balanceContainer: { alignItems: 'center', marginBottom: 16 },
  balanceValue: { fontSize: 36, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  balanceUSD: { fontSize: 16, color: theme.colors.secondary },

  addressRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surfaceVariant, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 24 },
  addressText: { color: theme.colors.secondary, fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  actionButtonsRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', paddingHorizontal: 16 },

  tabsContainer: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8 },
  tab: { marginRight: 24, paddingVertical: 8 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: theme.colors.primary },
  tabText: { fontSize: 16, color: theme.colors.secondary, fontWeight: '600' },
  tabTextActive: { color: theme.colors.text },

  listContainer: { paddingHorizontal: 16 },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.surfaceVariant },
  tokenIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  listItemContent: { flex: 1 },
  listItemTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
  listItemSubtitle: { fontSize: 12, color: theme.colors.secondary },
  listItemEnd: { alignItems: 'flex-end' },
  listItemValue: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
  listItemSubValue: { fontSize: 12, color: theme.colors.secondary },

  placeholderContainer: { alignItems: 'center', paddingVertical: 48 },
  placeholderText: { marginTop: 16, color: theme.colors.secondary, fontSize: 16 },
  smallButton: { marginTop: 12, padding: 8 },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 20, width: '85%', maxHeight: '60%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: theme.colors.text },
  networkItem: { backgroundColor: theme.colors.surfaceVariant, borderRadius: 10, padding: 15, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  networkItemSelected: { borderWidth: 2, borderColor: theme.colors.primary },
  networkItemName: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
  networkItemSymbol: { fontSize: 14, color: theme.colors.primary, fontWeight: 'bold' },
  modalCloseButton: { backgroundColor: theme.colors.primary, padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  modalCloseText: { color: theme.colors.onPrimary, fontSize: 16, fontWeight: '600' },
});

export default DashboardScreen;
