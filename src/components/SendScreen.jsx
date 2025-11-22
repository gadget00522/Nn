import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import useWalletStore from '../store/walletStore';
import { useTranslation } from 'react-i18next';

/**
 * Écran d'envoi de transactions (ETH ou tokens).
 *
 * @returns {JSX.Element} L'interface utilisateur pour envoyer des fonds.
 */
function SendScreen() {
  const { t } = useTranslation();
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount]       = useState('');

  const isSending      = useWalletStore((s) => s.isSending);
  const sendError      = useWalletStore((s) => s.sendError);
  const assetToSend    = useWalletStore((s) => s.assetToSend);
  const sendTransaction= useWalletStore((s) => s.actions.sendTransaction);
  const setScreen      = useWalletStore((s) => s.actions.setScreen);
  const hasBackedUp    = useWalletStore((s) => s.hasBackedUp);
  const isUnlocked     = useWalletStore((s) => s.isWalletUnlocked);

  // Définit l'actif à envoyer, par défaut ETH
  const asset = assetToSend || { symbol: 'ETH', balance: '0', decimals: 18 };

  // Détermine si le bouton d'envoi doit être désactivé
  const disabledReason = !isUnlocked
    ? t('wallet.send_disabled_locked')
    : !hasBackedUp
      ? t('wallet.send_disabled_backup')
      : (!toAddress.trim() || !amount.trim())
        ? 'Champs requis'
        : null;

  /**
   * Déclenche la transaction si toutes les conditions sont réunies.
   */
  const handleSend = () => {
    if (disabledReason === null) {
      sendTransaction(toAddress.trim(), amount.trim());
    }
  };

  /**
   * Retourne au tableau de bord.
   */
  const handleBack = () => setScreen('dashboard', null);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Envoyer {asset.symbol}</Text>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Solde : {asset.balance} {asset.symbol}</Text>

        <Text style={styles.label}>Adresse destinataire</Text>
        <TextInput
          style={styles.input}
          placeholder="0x..."
          value={toAddress}
          onChangeText={setToAddress}
          editable={!isSending && disabledReason === null}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Montant ({asset.symbol})</Text>
        <TextInput
          style={styles.input}
          placeholder="0.0"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          editable={!isSending && disabledReason === null}
        />

        {disabledReason && (
          <View style={styles.noticeContainer}>
            <Text style={styles.noticeText}>{disabledReason}</Text>
          </View>
        )}

        {sendError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{sendError}</Text>
          </View>
        )}

        {isSending ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Envoi en cours...</Text>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.button, disabledReason !== null && styles.buttonDisabled]}
              onPress={handleSend}
              disabled={disabledReason !== null}
            >
              <Text style={styles.buttonText}>Confirmer & Envoyer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleBack}
            >
              <Text style={styles.secondaryButtonText}>Retour</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#24272A' },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 30, color: '#FFFFFF', textAlign: 'center' },
  formContainer: { flex: 1 },
  label: { fontSize: 16, color: '#D6D9DC', marginBottom: 8, fontWeight: '600' },
  input: {
    backgroundColor: '#141618', borderRadius: 10, padding: 15,
    fontSize: 16, color: '#FFFFFF', marginBottom: 20,
    borderWidth: 1, borderColor: '#3C4043'
  },
  button: {
    backgroundColor: '#037DD6', paddingVertical: 15, borderRadius: 10,
    alignItems: 'center', marginBottom: 15
  },
  buttonDisabled: { backgroundColor: '#4A5568', opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  secondaryButton: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#037DD6' },
  secondaryButtonText: { color: '#037DD6', fontSize: 18, fontWeight: '600' },
  errorContainer: {
    backgroundColor: '#5C2A2A', borderRadius: 10, padding: 15,
    marginBottom: 20, borderWidth: 1, borderColor: '#D32F2F'
  },
  errorText: { color: '#FF6B6B', fontSize: 14 },
  loadingContainer: { alignItems: 'center', marginTop: 30 },
  loadingText: { marginTop: 15, fontSize: 16, color: '#8B92A6' },
  noticeContainer: {
    backgroundColor: '#2D3748', borderRadius: 10, padding: 12,
    marginBottom: 20, borderLeftWidth: 4, borderLeftColor: '#F59E0B'
  },
  noticeText: { color: '#D6D9DC', fontSize: 13 }
});

export default SendScreen;
