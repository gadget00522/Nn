import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import useWalletStore from '../store/walletStore';
import Toast from 'react-native-toast-message';

function getIndicesToVerify(wordCount: number) {
  // Sélectionne 3 indices distincts
  const indices = new Set<number>();
  while (indices.size < 3) {
    indices.add(Math.floor(Math.random() * wordCount));
  }
  return Array.from(indices).sort((a,b)=>a-b);
}

const BackupVerifyScreen = ({ navigation }) => {
  const isUnlocked = useWalletStore(s => s.isWalletUnlocked);
  const encryptedPayload = useWalletStore(s => s.encryptedMnemonicPayload);
  const markBackedUp = useWalletStore(s => s.actions.markBackedUp);

  const [mnemonicWords, setMnemonicWords] = useState<string[] | null>(null);
  const [indices, setIndices] = useState<number[]>([]);
  const [inputs, setInputs] = useState<{[k:number]: string}>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // On ne peut pas déchiffrer ici sans password – on suppose l'utilisateur vient juste d'importer/déverrouiller.
    // Si tu veux redéverrouiller, il faut demander password (logic supplémentaire).
    if (!isUnlocked || !encryptedPayload) {
      Toast.show({ type: 'error', text1: 'Wallet verrouillé', text2: 'Déverrouille avant de vérifier.' });
      return;
    }
    // Hypothèse: la phrase a été importée récemment, donc on la garde en mémoire OU
    // Pour sécurité stricte, il faudrait redemander le password pour la déchiffrer (à implémenter plus tard).
    // Ici simplification: on ne la recharge pas; on n’a pas la phrase en clair -> TODO futur.
    // -> Pour rendre fonctionnel, on peut stocker temporairement la phrase en clair dans un état global lors de l'import (ex: get().tempMnemonicPlain)
    // Pour la démonstration, on met des mots factices si non disponible.
    // >>> À adapter : ajouter dans walletStore la phrase temporaire (clear après backup).
    const tempPlain = (window as any).__TEMP_MNEMONIC__; // hack temporaire
    if (!tempPlain) {
      Toast.show({ type: 'info', text1: 'Phrase inaccessible', text2: 'Implémente stockage temporaire pour vérif.' });
      return;
    }
    const words = tempPlain.split(/\s+/);
    setMnemonicWords(words);
    setIndices(getIndicesToVerify(words.length));
  }, [isUnlocked, encryptedPayload]);

  const handleChange = (idx: number, val: string) => {
    setInputs(prev => ({ ...prev, [idx]: val.trim() }));
  };

  const handleValidate = () => {
    if (!mnemonicWords) return;
    const allCorrect = indices.every(i => inputs[i] && inputs[i].toLowerCase() === mnemonicWords[i].toLowerCase());
    if (!allCorrect) {
      Toast.show({ type: 'error', text1: 'Mots incorrects', text2: 'Réessaie, certains ne correspondent pas.' });
      return;
    }
    markBackedUp();
    Toast.show({ type: 'success', text1: 'Backup confirmé', text2: 'Tu peux maintenant utiliser toutes les fonctions.' });
    if (navigation?.goBack) navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vérification de sauvegarde</Text>
      <Text style={styles.subtitle}>
        Saisis les mots aux positions suivantes pour confirmer que tu as bien sauvegardé ta phrase.
      </Text>

      {indices.map(i => (
        <View key={i} style={styles.row}>
          <Text style={styles.label}>Mot #{i+1}</Text>
          <TextInput
            style={styles.input}
            placeholder={`Mot ${i+1}`}
            onChangeText={val => handleChange(i, val)}
            autoCapitalize="none"
          />
        </View>
      ))}

      <TouchableOpacity style={styles.button} onPress={handleValidate} disabled={loading}>
        <Text style={styles.buttonText}>Confirmer</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#24272A', padding:20 },
  title: { fontSize:20, fontWeight:'bold', color:'#fff', marginBottom:10 },
  subtitle:{ color:'#ccc', marginBottom:20 },
  row:{ marginBottom:12 },
  label:{ color:'#D6D9DC', marginBottom:6 },
  input:{ backgroundColor:'#141618', color:'#fff', padding:10, borderRadius:8, borderWidth:1, borderColor:'#3C4043' },
  button:{ backgroundColor:'#037DD6', padding:14, alignItems:'center', borderRadius:999, marginTop:10 },
  buttonText:{ color:'#fff', fontWeight:'600' }
});

export default BackupVerifyScreen;
