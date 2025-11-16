import { create } from 'zustand';
import { ethers } from 'ethers';
import * as Keychain from 'react-native-keychain';

const useWalletStore = create((set) => ({
  // Le contenu du store sera ajouté ici
}));

export default useWalletStore;
