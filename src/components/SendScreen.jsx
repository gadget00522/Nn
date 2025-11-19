import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import useWalletStore from '../store/walletStore';

function SendScreen() {
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  
  const isSending = useWalletStore((state) => state.isSending);
  const sendError = useWalletStore((state) => state.sendError);
  const assetToSend = useWalletStore((state) => state.assetToSend);
  const sendTransaction = useWalletStore((state) => state.actions.sendTransaction);
  const setScreen = useWalletStore((state) => state.actions.setScreen);

  const handleSend = () => {
    if (!toAddress.trim() || !amount.trim()) {
      return;
    }
    sendTransaction(toAddress.trim(), amount.trim());
  };

  const handleBack = () => {
    setScreen('dashboard', null);
  };

  // Utiliser l'actif sélectionné ou ETH par défaut
  const asset = assetToSend || { symbol: 'ETH', balance: '0', decimals: 18 };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Envoyer {asset.symbol}</Text>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Solde disponible : {asset.balance} {asset.symbol}</Text>
        
        <Text style={styles.label}>Adresse du destinataire :</Text>
        <TextInput
          style={styles.input}
          placeholder="0x..."
          value={toAddress}
          onChangeText={setToAddress}
          editable={!isSending}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Montant ({asset.symbol}) :</Text>
        <TextInput
          style={styles.input}
          placeholder="0.0"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          editable={!isSending}
        />

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
              style={[styles.button, (!toAddress.trim() || !amount.trim()) && styles.buttonDisabled]} 
              onPress={handleSend}
              disabled={!toAddress.trim() || !amount.trim()}>
              <Text style={styles.buttonText}>Confirmer & Envoyer</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]} 
              onPress={handleBack}>
              <Text style={styles.secondaryButtonText}>Retour</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#24272A',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    color: '#D6D9DC',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#141618',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#3C4043',
  },
  button: {
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
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#037DD6',
  },
  secondaryButtonText: {
    color: '#037DD6',
    fontSize: 18,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#5C2A2A',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D32F2F',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#8B92A6',
  },
});

export default SendScreen;
