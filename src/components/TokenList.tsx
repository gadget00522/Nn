import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import useWalletStore from '../store/walletStore';

/**
 * Composant affichant la liste des tokens et permettant d'en ajouter manuellement.
 *
 * @returns {JSX.Element} L'interface utilisateur pour la liste des tokens.
 */
const TokenList = () => {
  const tokenBalances = useWalletStore(s => s.tokenBalances);
  const addCustomToken = useWalletStore(s => s.actions.addCustomToken);

  const [addr, setAddr] = useState('');
  const [symbol, setSymbol] = useState('');
  const [decimals, setDecimals] = useState('');

  /**
   * Ajoute un token personnalisé à la liste surveillée.
   */
  const handleAdd = () => {
    if (!addr.startsWith('0x') || addr.length !== 42) return;
    const d = parseInt(decimals || '18', 10);
    addCustomToken({ address: addr, symbol: symbol || 'CUST', decimals: d });
    setAddr(''); setSymbol(''); setDecimals('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tokens</Text>
      {tokenBalances.map(t => (
        <Text key={t.contractAddress} style={styles.item}>
          {t.symbol}: {t.balance}
        </Text>
      ))}

      <View style={styles.form}>
        <Text style={styles.subtitle}>Ajouter un token</Text>
        <TextInput style={styles.input} placeholder="Adresse (0x...)" value={addr} onChangeText={setAddr} />
        <TextInput style={styles.input} placeholder="Symbol" value={symbol} onChangeText={setSymbol} />
        <TextInput style={styles.input} placeholder="Decimals" value={decimals} onChangeText={setDecimals} keyboardType="numeric" />
        <TouchableOpacity style={styles.button} onPress={handleAdd}>
          <Text style={styles.buttonText}>Ajouter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container:{ marginTop:20 },
  title:{ fontSize:18, fontWeight:'bold', color:'#fff', marginBottom:10 },
  item:{ color:'#ccc', marginBottom:6 },
  form:{ marginTop:16 },
  subtitle:{ color:'#fff', marginBottom:8 },
  input:{ backgroundColor:'#141618', color:'#fff', padding:10, borderRadius:8, marginBottom:8, borderWidth:1, borderColor:'#3C4043' },
  button:{ backgroundColor:'#037DD6', padding:12, alignItems:'center', borderRadius:8 },
  buttonText:{ color:'#fff', fontWeight:'600' },
});

export default TokenList;
