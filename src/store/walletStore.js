import { create } from 'zustand';
import { ethers } from 'ethers';
import * as Keychain from 'react-native-keychain';

const useWalletStore = create((set, get) => ({
  // État initial du store
  mnemonic: null,
  address: null,
  isWalletCreated: false,
  isWalletUnlocked: false,
  balance: '0',
  currentScreen: 'dashboard',
  isSending: false,
  sendError: null,

  // Actions
  actions: {
    // Vérifie si un portefeuille existe dans le stockage
    checkStorage: async () => {
      try {
        const credentials = await Keychain.getGenericPassword();
        set({ isWalletCreated: !!credentials });
      } catch (error) {
        set({ isWalletCreated: false });
      }
    },

    // Crée un nouveau portefeuille
    createWallet: async () => {
      const wallet = ethers.Wallet.createRandom();
      const phrase = wallet.mnemonic.phrase;
      
      await Keychain.setGenericPassword("wallet", phrase, {
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
      });

      set({
        mnemonic: phrase,
        address: wallet.address,
        isWalletCreated: true,
        isWalletUnlocked: true,
      });

      return phrase;
    },

    // Déverrouille le portefeuille avec authentification biométrique
    unlockWallet: async () => {
      try {
        const credentials = await Keychain.getGenericPassword({
          authenticationPrompt: {
            title: "Déverrouiller le portefeuille",
          },
        });

        if (credentials) {
          const wallet = ethers.Wallet.fromPhrase(credentials.password);
          set({
            mnemonic: credentials.password,
            address: wallet.address,
            isWalletUnlocked: true,
          });
        }
      } catch (error) {
        // L'utilisateur a annulé ou l'authentification a échoué
        console.log("Unlock cancelled or failed:", error);
      }
    },

    // Verrouille le portefeuille
    lockWallet: () => {
      set({
        mnemonic: null,
        address: null,
        isWalletUnlocked: false,
        balance: '0',
      });
    },

    // Efface complètement le portefeuille
    wipeWallet: async () => {
      await Keychain.resetGenericPassword();
      set({
        mnemonic: null,
        address: null,
        isWalletCreated: false,
        isWalletUnlocked: false,
        balance: '0',
      });
    },

    // Récupère le solde du portefeuille
    fetchBalance: async () => {
      try {
        const provider = new ethers.JsonRpcProvider('https://rpc.sepolia.org');
        const { address } = get();
        
        if (address) {
          const balanceWei = await provider.getBalance(address);
          const balanceEth = ethers.formatEther(balanceWei);
          set({ balance: balanceEth });
        }
      } catch (error) {
        console.log('Failed to fetch balance:', error);
        set({ balance: '0' });
      }
    },

    // Change l'écran actuel
    setScreen: (screenName) => {
      set({ currentScreen: screenName });
    },

    // Envoie une transaction ETH
    sendTransaction: async (toAddress, amount) => {
      set({ isSending: true, sendError: null });
      
      try {
        const { mnemonic } = get();
        
        if (!mnemonic) {
          throw new Error('Mnémonique non disponible. Veuillez déverrouiller le portefeuille.');
        }
        
        // Créer le provider pour le réseau Sepolia
        const provider = new ethers.JsonRpcProvider('https://rpc.sepolia.org');
        
        // Recréer le portefeuille à partir de la mnémonique
        const wallet = ethers.Wallet.fromPhrase(mnemonic);
        
        // Connecter le portefeuille au provider
        const connectedWallet = wallet.connect(provider);
        
        // Valider l'adresse du destinataire
        if (!ethers.isAddress(toAddress)) {
          throw new Error('Adresse du destinataire invalide.');
        }
        
        // Convertir le montant en wei
        const txValue = ethers.parseEther(amount);
        
        // Construire l'objet de transaction
        const tx = {
          to: toAddress,
          value: txValue,
        };
        
        // Envoyer la transaction
        const txResponse = await connectedWallet.sendTransaction(tx);
        
        // Attendre la confirmation
        await txResponse.wait();
        
        // Rafraîchir le solde
        await get().actions.fetchBalance();
        
        // Retourner au tableau de bord
        get().actions.setScreen('dashboard');
        
      } catch (error) {
        set({ sendError: error.message });
      } finally {
        set({ isSending: false });
      }
    },
  },
}));

export default useWalletStore;
