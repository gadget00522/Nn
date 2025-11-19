import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import useWalletStore, { SUPPORTED_NETWORKS } from '../store/walletStore';
import { useNavigation } from '@react-navigation/native';

function SettingsScreen() {
  const navigation = useNavigation();
  const [showMnemonic, setShowMnemonic] = useState(false);
  
  const mnemonic = useWalletStore((state) => state.mnemonic);
  const currentNetwork = useWalletStore((state) => state.currentNetwork);
  const lockWallet = useWalletStore((state) => state.actions.lockWallet);
  const wipeWallet = useWalletStore((state) => state.actions.wipeWallet);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleShowRecoveryPhrase = () => {
    Alert.alert(
      'Phrase de récupération',
      '⚠️ ATTENTION: Ne partagez JAMAIS votre phrase de récupération. Quiconque possède cette phrase peut accéder à vos fonds.',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'J\'ai compris, afficher',
          onPress: () => setShowMnemonic(true),
        },
      ],
    );
  };

  const handleCopyRecoveryPhrase = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(mnemonic);
      Toast.show({
        type: 'success',
        text1: 'Phrase copiée',
        text2: 'La phrase de récupération a été copiée',
      });
    }
  };

  const handleLock = () => {
    lockWallet();
  };

  const handleWipeWallet = () => {
    Alert.alert(
      'Supprimer le portefeuille',
      '⚠️ ATTENTION: Cette action est irréversible. Assurez-vous d\'avoir sauvegardé votre phrase de récupération.',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await wipeWallet();
            Toast.show({
              type: 'success',
              text1: 'Portefeuille supprimé',
              text2: 'Votre portefeuille a été supprimé',
            });
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Text style={styles.backButton}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Paramètres</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sécurité</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleShowRecoveryPhrase}>
            <Text style={styles.menuIcon}>🔑</Text>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Phrase de récupération</Text>
              <Text style={styles.menuSubtext}>Afficher votre phrase secrète</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleLock}>
            <Text style={styles.menuIcon}>🔒</Text>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Verrouiller le portefeuille</Text>
              <Text style={styles.menuSubtext}>Protégez votre portefeuille</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Network Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Réseaux</Text>
          
          <View style={styles.networkInfo}>
            <Text style={styles.networkLabel}>Réseau actif</Text>
            <Text style={styles.networkName}>{currentNetwork.name}</Text>
            <Text style={styles.networkType}>Testnet</Text>
          </View>

          <View style={styles.networkList}>
            <Text style={styles.networkListTitle}>Réseaux disponibles</Text>
            {SUPPORTED_NETWORKS.map((network) => (
              <View key={network.chainId} style={styles.networkItem}>
                <View style={styles.networkDot} />
                <View style={styles.networkItemInfo}>
                  <Text style={styles.networkItemName}>{network.name}</Text>
                  <Text style={styles.networkItemType}>Testnet - {network.symbol}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>À propos</Text>
          
          <View style={styles.menuItem}>
            <Text style={styles.menuIcon}>📱</Text>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Version</Text>
              <Text style={styles.menuSubtext}>1.1.0</Text>
            </View>
          </View>

          <View style={styles.menuItem}>
            <Text style={styles.menuIcon}>ℹ️</Text>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuText}>Malin Wallet</Text>
              <Text style={styles.menuSubtext}>Portefeuille Web3 pour testnet</Text>
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>Zone dangereuse</Text>
          
          <TouchableOpacity 
            style={[styles.menuItem, styles.dangerItem]}
            onPress={handleWipeWallet}>
            <Text style={styles.menuIcon}>🗑️</Text>
            <View style={styles.menuTextContainer}>
              <Text style={[styles.menuText, styles.dangerText]}>Supprimer le portefeuille</Text>
              <Text style={styles.menuSubtext}>Action irréversible</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Recovery Phrase Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showMnemonic}
        onRequestClose={() => setShowMnemonic(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Phrase de récupération</Text>
            
            <View style={styles.warningBox}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningText}>
                Ne partagez jamais cette phrase. Quiconque la possède peut accéder à vos fonds.
              </Text>
            </View>

            <View style={styles.mnemonicBox}>
              <Text style={styles.mnemonicText}>{mnemonic}</Text>
            </View>

            <TouchableOpacity 
              style={styles.copyButton}
              onPress={handleCopyRecoveryPhrase}>
              <Text style={styles.copyButtonText}>📋 Copier</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowMnemonic(false)}>
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    color: '#8B92A6',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 10,
    letterSpacing: 1,
  },
  dangerTitle: {
    color: '#FF6B6B',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141618',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuSubtext: {
    color: '#8B92A6',
    fontSize: 12,
  },
  menuArrow: {
    color: '#8B92A6',
    fontSize: 24,
  },
  dangerItem: {
    borderWidth: 1,
    borderColor: '#5C2A2A',
  },
  dangerText: {
    color: '#FF6B6B',
  },
  networkInfo: {
    backgroundColor: '#141618',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  networkLabel: {
    color: '#8B92A6',
    fontSize: 12,
    marginBottom: 5,
  },
  networkName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  networkType: {
    color: '#F7931A',
    fontSize: 12,
    fontWeight: '600',
  },
  networkList: {
    backgroundColor: '#141618',
    borderRadius: 10,
    padding: 15,
  },
  networkListTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  networkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 10,
  },
  networkItemInfo: {
    flex: 1,
  },
  networkItemName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  networkItemType: {
    color: '#8B92A6',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#24272A',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#3D2E1F',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F7931A',
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  warningText: {
    flex: 1,
    color: '#F7931A',
    fontSize: 13,
    lineHeight: 18,
  },
  mnemonicBox: {
    backgroundColor: '#141618',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#3C4043',
  },
  mnemonicText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  copyButton: {
    backgroundColor: '#037DD6',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  copyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#037DD6',
  },
  closeButtonText: {
    color: '#037DD6',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;
