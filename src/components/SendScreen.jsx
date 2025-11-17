import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import useWalletStore from '../store/walletStore';

function SendScreen() {
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  
  const isSending = useWalletStore((state) => state.isSending);
  const sendError = useWalletStore((state) => state.sendError);
  const sendTransaction = useWalletStore((state) => state.actions.sendTransaction);
  const setScreen = useWalletStore((state) => state.actions.setScreen);

  const handleSend = () => {
    if (!toAddress.trim() || !amount.trim()) {
      return;
    }
    sendTransaction(toAddress.trim(), amount.trim());
  };

  const handleBack = () => {
    setScreen('dashboard');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Envoyer ETH</Text>

      <View style={styles.formContainer}>
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

        <Text style={styles.label}>Montant (ETH) :</Text>
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
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
});

export default SendScreen;
