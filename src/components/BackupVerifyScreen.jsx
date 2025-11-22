import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import useWalletStore from '../store/walletStore';

/**
 * Écran de vérification de la phrase de récupération.
 * Demande à l'utilisateur de saisir 3 mots aléatoires de sa phrase pour confirmer qu'il l'a bien sauvegardée.
 *
 * @returns {JSX.Element} L'interface utilisateur de vérification.
 */
function BackupVerifyScreen() {
  const mnemonic = useWalletStore((state) => state.mnemonic);
  const verifyBackup = useWalletStore((state) => state.actions.verifyBackup);
  const setScreen = useWalletStore((state) => state.actions.setScreen);
  
  const [wordsToVerify, setWordsToVerify] = useState([]);
  const [userInputs, setUserInputs] = useState({});
  const [error, setError] = useState('');

  /**
   * Initialise les mots à vérifier lors du chargement du composant.
   * Sélectionne 3 indices aléatoires.
   */
  useEffect(() => {
    if (mnemonic) {
      const words = mnemonic.split(' ');
      // Select 3 random words to verify
      const indices = [];
      while (indices.length < 3) {
        const randomIndex = Math.floor(Math.random() * words.length);
        if (!indices.includes(randomIndex)) {
          indices.push(randomIndex);
        }
      }
      indices.sort((a, b) => a - b);
      
      setWordsToVerify(
        indices.map(index => ({
          index: index,
          word: words[index],
          position: index + 1, // Human-readable position (1-based)
        }))
      );
    }
  }, [mnemonic]);

  /**
   * Gère le changement de texte dans les champs de saisie.
   *
   * @param {number} index - L'index du mot dans la phrase mnémonique.
   * @param {string} value - La valeur saisie par l'utilisateur.
   */
  const handleInputChange = (index, value) => {
    setUserInputs({
      ...userInputs,
      [index]: value.trim().toLowerCase(),
    });
    setError('');
  };

  /**
   * Vérifie si les mots saisis correspondent à la phrase originale.
   * Si tout est correct, valide la sauvegarde et déverrouille le portefeuille.
   */
  const handleVerify = () => {
    // Check if all inputs are filled
    const allFilled = wordsToVerify.every(item => userInputs[item.index]);
    if (!allFilled) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    // Verify each word
    const allCorrect = wordsToVerify.every(
      item => userInputs[item.index] === item.word.toLowerCase()
    );

    if (allCorrect) {
      verifyBackup();
    } else {
      setError('Les mots saisis ne correspondent pas. Veuillez réessayer.');
    }
  };

  /**
   * Retourne à l'écran de sauvegarde pour revoir la phrase.
   */
  const handleBack = () => {
    setScreen('backup');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Vérification de la phrase de récupération</Text>

      <View style={styles.instructionBox}>
        <Text style={styles.instructionText}>
          Pour confirmer que vous avez bien sauvegardé votre phrase, veuillez entrer les mots demandés ci-dessous.
        </Text>
      </View>

      {wordsToVerify.map((item) => (
        <View key={item.index} style={styles.inputGroup}>
          <Text style={styles.label}>Mot n°{item.position}</Text>
          <TextInput
            style={styles.input}
            placeholder={`Entrez le mot n°${item.position}`}
            value={userInputs[item.index] || ''}
            onChangeText={(value) => handleInputChange(item.index, value)}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      ))}

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <TouchableOpacity style={styles.button} onPress={handleVerify}>
        <Text style={styles.buttonText}>Vérifier</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backButtonText}>Retour à la phrase</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#24272A',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  instructionBox: {
    backgroundColor: '#2D3748',
    borderRadius: 10,
    padding: 15,
    marginBottom: 30,
  },
  instructionText: {
    fontSize: 14,
    color: '#037DD6',
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D6D9DC',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#3C4043',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#141618',
    color: '#FFFFFF',
  },
  errorBox: {
    backgroundColor: '#5C2A2A',
    borderWidth: 1,
    borderColor: '#D32F2F',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#037DD6',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#037DD6',
  },
  backButtonText: {
    color: '#037DD6',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BackupVerifyScreen;
