import { create } from 'zustand';
import { ethers } from 'ethers';
import * as Keychain from 'react-native-keychain';
import { Alchemy } from 'alchemy-sdk';

const SUPPORTED_NETWORKS = [
  { 
    name: 'Ethereum Sepolia', 
    symbol: 'ETH',
    rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/6E1MABBp0KS-gBCc5zXk7',
    chainId: 11155111,
    explorerUrl: 'https://sepolia.etherscan.io',
    alchemyNetwork: 'eth-sepolia', // Nom pour Alchemy SDK
  },
  { 
    name: 'Polygon Mumbai', 
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-mumbai.g.alchemy.com/v2/6E1MABBp0KS-gBCc5zXk7',
    chainId: 80001,
    explorerUrl: 'https://mumbai.polygonscan.com',
    alchemyNetwork: 'polygon-mumbai', // Nom pour Alchemy SDK
  },
];

const useWalletStore = create((set, get) => ({
  // État initial du store
  mnemonic: null,
  address: null,
  isWalletCreated: false,
  isWalletUnlocked: false,
  needsBackup: false,
  balance: '0',
  currentScreen: 'dashboard',
  isSending: false,
  sendError: null,
  transactions: [],
  tokenBalances: [],
  assetToSend: null,
  currentNetwork: SUPPORTED_NETWORKS[0],

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
        isWalletUnlocked: false,
        needsBackup: true,
      });

      return phrase;
    },

    // Vérifie la sauvegarde et déverrouille le portefeuille
    verifyBackup: () => {
      set({
        needsBackup: false,
        isWalletUnlocked: true,
        currentScreen: 'dashboard',
      });
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

    // Récupère le solde et l'historique des transactions via Alchemy
    fetchData: async () => {
      try {
        const { address, currentNetwork } = get();
        
        if (!address) {
          return;
        }
        
        // Configure le client Alchemy
        const settings = {
          apiKey: "6E1MABBp0KS-gBCc5zXk7",
          network: currentNetwork.alchemyNetwork,
        };
        const alchemy = new Alchemy(settings);
        
        // Récupère le solde
        const balanceWei = await alchemy.core.getBalance(address);
        const balanceEth = ethers.utils.formatEther(balanceWei);
        
        // --- Récupérer les soldes des tokens ---
        const tokenBalancesResponse = await alchemy.core.getTokenBalances(address);

        // Filtrer les tokens sans solde ou sans métadonnées pour éviter le spam
        const tokensWithBalance = tokenBalancesResponse.tokenBalances.filter(token =>
          token.tokenBalance !== "0" && token.tokenBalance !== null
        );

        // Récupérer les métadonnées pour chaque token
        const tokenMetadataPromises = tokensWithBalance.map(token =>
          alchemy.core.getTokenMetadata(token.contractAddress)
        );
        const tokenMetadataList = await Promise.all(tokenMetadataPromises);

        // Formater les données pour un affichage propre
        const finalTokenList = tokensWithBalance.map((token, index) => {
          const metadata = tokenMetadataList[index];
          if (!metadata.symbol) return null;
          
          // Le solde est en hexadécimal, il faut le convertir
          const balance = (parseInt(token.tokenBalance, 16) / Math.pow(10, metadata.decimals)).toFixed(4);
          return {
            symbol: metadata.symbol,
            balance: balance,
            contractAddress: token.contractAddress,
            decimals: metadata.decimals,
            logo: metadata.logo,
          };
        }).filter(token => token !== null);
        
        // Récupère les transactions envoyées
        const sentTransfers = await alchemy.core.getAssetTransfers({
          fromBlock: "0x0",
          toBlock: "latest",
          fromAddress: address,
          category: ["external"],
          order: "desc",
          withMetadata: true,
          maxCount: 20,
        });
        
        // Récupère les transactions reçues
        const receivedTransfers = await alchemy.core.getAssetTransfers({
          fromBlock: "0x0",
          toBlock: "latest",
          toAddress: address,
          category: ["external"],
          order: "desc",
          withMetadata: true,
          maxCount: 20,
        });
        
        // Combine et trie les transactions par date
        const allTransfers = [...sentTransfers.transfers, ...receivedTransfers.transfers];
        allTransfers.sort((a, b) => {
          const dateA = new Date(a.metadata.blockTimestamp);
          const dateB = new Date(b.metadata.blockTimestamp);
          return dateB - dateA;
        });
        
        // Mettre à jour l'état avec TOUTES les nouvelles données
        set({ 
          balance: balanceEth, 
          transactions: allTransfers.slice(0, 40),
          tokenBalances: finalTokenList 
        });
      } catch (error) {
        console.log('Failed to fetch data:', error);
        set({ balance: '0', transactions: [], tokenBalances: [] });
      }
    },

    // Change l'écran actuel
    setScreen: (screenName, asset = null) => {
      set({ 
        currentScreen: screenName,
        assetToSend: asset 
      });
    },

    // Change le réseau actif
    switchNetwork: (network) => {
      set({ 
        currentNetwork: network,
        // Réinitialiser les données lors du changement de réseau
        balance: '0', 
        tokenBalances: [], 
        transactions: [] 
      });
    },

    // Envoie une transaction ETH ou ERC-20
    sendTransaction: async (toAddress, amount) => {
      set({ isSending: true, sendError: null });
      
      try {
        const { mnemonic, assetToSend, currentNetwork } = get();
        
        if (!mnemonic) {
          throw new Error('Mnémonique non disponible. Veuillez déverrouiller le portefeuille.');
        }
        
        // Créer le provider pour le réseau actif
        const provider = new ethers.providers.JsonRpcProvider(currentNetwork.rpcUrl);
        
        // Recréer le portefeuille à partir de la mnémonique
        const wallet = ethers.Wallet.fromPhrase(mnemonic);
        
        // Connecter le portefeuille au provider
        const connectedWallet = wallet.connect(provider);
        
        // Valider l'adresse du destinataire
        if (!ethers.utils.isAddress(toAddress)) {
          throw new Error('Adresse du destinataire invalide.');
        }
        
        if (assetToSend && assetToSend.contractAddress) {
          // CAS 1 : C'est un TOKEN ERC-20
          
          // Définir l'interface minimale du contrat pour un transfert
          const tokenAbi = ["function transfer(address to, uint256 amount)"];
          const tokenContract = new ethers.Contract(assetToSend.contractAddress, tokenAbi, connectedWallet);
          
          // Convertir le montant en utilisant les décimales du token
          const amountToSend = ethers.utils.parseUnits(amount, assetToSend.decimals);
          
          // Appeler la fonction `transfer` du contrat
          const tx = await tokenContract.transfer(toAddress, amountToSend);
          await tx.wait();

        } else {
          // CAS 2 : C'est de l'ETH (logique existante)
          // Convertir le montant en wei
          const txValue = ethers.utils.parseEther(amount);
          
          // Construire l'objet de transaction
          const tx = {
            to: toAddress,
            value: txValue,
          };
          
          // Envoyer la transaction
          const txResponse = await connectedWallet.sendTransaction(tx);
          
          // Attendre la confirmation
          await txResponse.wait();
        }
        
        // Rafraîchir le solde et les transactions
        await get().actions.fetchData();
        
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

export { SUPPORTED_NETWORKS };
export default useWalletStore;
