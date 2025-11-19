import { create } from 'zustand';
import { ethers } from 'ethers';
import * as Keychain from 'react-native-keychain';
import { Alchemy } from 'alchemy-sdk';
import { Platform } from 'react-native';

// DEMO ONLY - NOT SECURE FOR PRODUCTION
// Simple password-based storage for web demo purposes.
// In production, use proper secure storage and encryption.
const webStorage = {
  getItem: (key) => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  },
  setItem: (key, value) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  removeItem: (key) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  },
};

const SUPPORTED_NETWORKS = [
  {
    name: 'Ethereum Sepolia',
    symbol: 'ETH',
    rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/6E1MABBp0KS-gBCc5zXk7',
    chainId: 11155111,
    explorerUrl: 'https://sepolia.etherscan.io',
    alchemyNetwork: 'eth-sepolia',
  },
  {
    name: 'Polygon Mumbai',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-mumbai.g.alchemy.com/v2/6E1MABBp0KS-gBCc5zXk7',
    chainId: 80001,
    explorerUrl: 'https://mumbai.polygonscan.com',
    alchemyNetwork: 'polygon-mumbai',
  },
];

const useWalletStore = create((set, get) => ({
  // État initial
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
  
  // WalletConnect state
  walletConnectRequest: null, // Stores pending WalletConnect requests (session proposals, sign requests, etc.)

  // Actions
  actions: {
    // Vérifie si un portefeuille existe dans le stockage
    checkStorage: async () => {
      try {
        const credentials = await Keychain.getGenericPassword();
        const walletExists = !!credentials;
        
        // On web, check for additional persisted state
        if (Platform.OS === 'web') {
          // Load persisted backup status
          const needsBackupStored = localStorage.getItem('wallet_needsBackup');
          const needsBackup = needsBackupStored === 'true';
          
          set({ 
            isWalletCreated: walletExists,
            needsBackup: needsBackup 
          });
          
          // Auto-unlock if wallet exists and backup is completed
          if (walletExists && credentials && !needsBackup) {
            const wallet = ethers.Wallet.fromPhrase(credentials.password);
            set({
              mnemonic: credentials.password,
              address: wallet.address,
              isWalletUnlocked: true,
            });
          }
        } else {
          set({ isWalletCreated: walletExists });
        }
      } catch (error) {
        console.log('checkStorage error:', error);
        set({ isWalletCreated: false });
      }
    },

    // Crée un nouveau portefeuille
    createWallet: async (password = null) => {
      const wallet = ethers.Wallet.createRandom();
      const phrase = wallet.mnemonic.phrase;

      if (Platform.OS === 'web') {
        // DEMO ONLY - NOT SECURE
        const demoPassword = password || 'demo1234';
        webStorage.setItem('wallet_mnemonic', phrase);
        webStorage.setItem('wallet_password', demoPassword);
      } else {
        await Keychain.setGenericPassword('wallet', phrase, {
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
        });
      }

      // On web, persist backup status
      if (Platform.OS === 'web') {
        localStorage.setItem('wallet_needsBackup', 'true');
      }

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
      // On web, persist backup completion
      if (Platform.OS === 'web') {
        localStorage.setItem('wallet_needsBackup', 'false');
      }
      
      set({
        needsBackup: false,
        isWalletUnlocked: true,
        currentScreen: 'dashboard',
      });
    },

    // Déverrouille le portefeuille avec mot de passe (web) ou biométrie (native)
    unlockWallet: async (password = null) => {
      try {
        if (Platform.OS === 'web') {
          // DEMO ONLY - NOT SECURE
          const storedPassword = webStorage.getItem('wallet_password');
          const storedMnemonic = webStorage.getItem('wallet_mnemonic');

          if (!storedMnemonic || !storedPassword) {
            throw new Error('Aucun portefeuille trouvé');
          }

          if (password && password !== storedPassword) {
            throw new Error('Mot de passe incorrect');
          }

          const wallet = ethers.Wallet.fromPhrase(storedMnemonic);
          set({
            mnemonic: storedMnemonic,
            address: wallet.address,
            isWalletUnlocked: true,
          });
          return true;
        }

        // Native : biométrie via Keychain
        const credentials = await Keychain.getGenericPassword({
          authenticationPrompt: {
            title: 'Déverrouiller le portefeuille',
          },
        });

        if (!credentials) {
          throw new Error('Échec de l’authentification ou annulée');
        }

        const wallet = ethers.Wallet.fromPhrase(credentials.password);
        set({
          mnemonic: credentials.password,
          address: wallet.address,
          isWalletUnlocked: true,
        });
        return true;
      } catch (error) {
        console.log('Unlock cancelled or failed:', error);
        throw error;
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
      
      // On web, clear all persisted data
      if (Platform.OS === 'web') {
        localStorage.removeItem('wallet_needsBackup');
      }
      
      set({
        mnemonic: null,
        address: null,
        isWalletCreated: false,
        isWalletUnlocked: false,
        balance: '0',
        transactions: [],
        tokenBalances: [],
      });
    },

    // Récupère le solde et l'historique des transactions via Alchemy
    fetchData: async () => {
      try {
        const { address, currentNetwork } = get();

        if (!address) {
          return;
        }

        const settings = {
          apiKey: '6E1MABBp0KS-gBCc5zXk7',
          network: currentNetwork.alchemyNetwork,
        };
        const alchemy = new Alchemy(settings);

        // Solde ETH
        const balanceWei = await alchemy.core.getBalance(address);
        const balanceEth = ethers.utils.formatEther(balanceWei);

        // Soldes tokens
        const tokenBalancesResponse = await alchemy.core.getTokenBalances(address);

        const tokensWithBalance = tokenBalancesResponse.tokenBalances.filter(
          (token) => token.tokenBalance !== '0' && token.tokenBalance !== null,
        );

        const tokenMetadataPromises = tokensWithBalance.map((token) =>
          alchemy.core.getTokenMetadata(token.contractAddress),
        );
        const tokenMetadataList = await Promise.all(tokenMetadataPromises);

        const finalTokenList = tokensWithBalance
          .map((token, index) => {
            const metadata = tokenMetadataList[index];
            if (!metadata.symbol) return null;

            const balance =
              parseInt(token.tokenBalance, 16) / Math.pow(10, metadata.decimals);
            return {
              symbol: metadata.symbol,
              balance: balance.toFixed(4),
              contractAddress: token.contractAddress,
              decimals: metadata.decimals,
              logo: metadata.logo,
            };
          })
          .filter((token) => token !== null);

        // Transactions envoyées
        const sentTransfers = await alchemy.core.getAssetTransfers({
          fromBlock: '0x0',
          toBlock: 'latest',
          fromAddress: address,
          category: ['external'],
          order: 'desc',
          withMetadata: true,
          maxCount: 20,
        });

        // Transactions reçues
        const receivedTransfers = await alchemy.core.getAssetTransfers({
          fromBlock: '0x0',
          toBlock: 'latest',
          toAddress: address,
          category: ['external'],
          order: 'desc',
          withMetadata: true,
          maxCount: 20,
        });

        const allTransfers = [...sentTransfers.transfers, ...receivedTransfers.transfers];
        allTransfers.sort((a, b) => {
          const dateA = new Date(a.metadata.blockTimestamp);
          const dateB = new Date(b.metadata.blockTimestamp);
          return dateB - dateA;
        });

        set({
          balance: balanceEth,
          transactions: allTransfers.slice(0, 40),
          tokenBalances: finalTokenList,
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
        assetToSend: asset,
      });
    },

    // Change le réseau actif
    switchNetwork: (network) => {
      set({
        currentNetwork: network,
        balance: '0',
        tokenBalances: [],
        transactions: [],
      });
    },

    // Envoie une transaction ETH ou ERC-20
    sendTransaction: async (toAddress, amount) => {
      set({ isSending: true, sendError: null });

      try {
        const { mnemonic, assetToSend, currentNetwork } = get();

        if (!mnemonic) {
          throw new Error(
            'Mnémonique non disponible. Veuillez déverrouiller le portefeuille.',
          );
        }

        const provider = new ethers.providers.JsonRpcProvider(currentNetwork.rpcUrl);
        const wallet = ethers.Wallet.fromPhrase(mnemonic);
        const connectedWallet = wallet.connect(provider);

        if (!ethers.utils.isAddress(toAddress)) {
          throw new Error("Adresse du destinataire invalide.");
        }

        if (assetToSend && assetToSend.contractAddress) {
          // Token ERC-20
          const tokenAbi = ['function transfer(address to, uint256 amount)'];
          const tokenContract = new ethers.Contract(
            assetToSend.contractAddress,
            tokenAbi,
            connectedWallet,
          );

          const amountToSend = ethers.utils.parseUnits(amount, assetToSend.decimals);
          const tx = await tokenContract.transfer(toAddress, amountToSend);
          await tx.wait();
        } else {
          // ETH
          const txValue = ethers.utils.parseEther(amount);
          const tx = {
            to: toAddress,
            value: txValue,
          };
          const txResponse = await connectedWallet.sendTransaction(tx);
          await txResponse.wait();
        }

        // Rafraîchir données
        await get().actions.fetchData();

        // Retour dashboard
        get().actions.setScreen('dashboard');
      } catch (error) {
        console.log('sendTransaction error:', error);
        set({ sendError: error.message });
      } finally {
        set({ isSending: false });
      }
    },

    // WalletConnect Actions
    
    /**
     * Store a WalletConnect request (session proposal or sign request)
     * @param request - The WalletConnect request object
     */
    setWalletConnectRequest: (request) => {
      set({ walletConnectRequest: request });
    },

    /**
     * Clear the current WalletConnect request
     */
    clearWalletConnectRequest: () => {
      set({ walletConnectRequest: null });
    },

    /**
     * Approve a WalletConnect session proposal
     * Requires WalletConnectService to be initialized
     */
    approveSession: async () => {
      const { walletConnectRequest, address, currentNetwork } = get();
      
      if (!walletConnectRequest || walletConnectRequest.type !== 'session_proposal') {
        console.error('No session proposal to approve');
        return;
      }

      try {
        const WalletConnectService = (await import('../services/WalletConnectService')).default;
        const wcService = WalletConnectService.getInstance();
        
        // Format account as CAIP-10 format: eip155:chainId:address
        const accounts = [`eip155:${currentNetwork.chainId}:${address}`];
        
        await wcService.approveSession(
          walletConnectRequest.id,
          accounts,
          currentNetwork.chainId
        );
        
        // Clear the request after approval
        set({ walletConnectRequest: null });
      } catch (error) {
        console.error('Failed to approve session:', error);
        throw error;
      }
    },

    /**
     * Reject a WalletConnect session proposal
     */
    rejectSession: async () => {
      const { walletConnectRequest } = get();
      
      if (!walletConnectRequest || walletConnectRequest.type !== 'session_proposal') {
        console.error('No session proposal to reject');
        return;
      }

      try {
        const WalletConnectService = (await import('../services/WalletConnectService')).default;
        const wcService = WalletConnectService.getInstance();
        
        await wcService.rejectSession(walletConnectRequest.id);
        
        // Clear the request after rejection
        set({ walletConnectRequest: null });
      } catch (error) {
        console.error('Failed to reject session:', error);
        throw error;
      }
    },

    /**
     * Approve a WalletConnect request (sign transaction/message)
     * Signs the data with the wallet's private key
     */
    approveRequest: async () => {
      const { walletConnectRequest, mnemonic, currentNetwork } = get();
      
      if (!walletConnectRequest || walletConnectRequest.type !== 'session_request') {
        console.error('No session request to approve');
        return;
      }

      if (!mnemonic) {
        throw new Error('Wallet not unlocked');
      }

      try {
        const WalletConnectService = (await import('../services/WalletConnectService')).default;
        const wcService = WalletConnectService.getInstance();
        
        // Recreate wallet from mnemonic
        const wallet = ethers.Wallet.fromPhrase(mnemonic);
        const provider = new ethers.providers.JsonRpcProvider(currentNetwork.rpcUrl);
        const connectedWallet = wallet.connect(provider);
        
        const { topic, id, params } = walletConnectRequest;
        const { request } = params;
        
        let result;
        
        // Handle different request methods
        switch (request.method) {
          case 'eth_sign':
          case 'personal_sign':
            // Sign a message
            const message = request.params[0];
            result = await connectedWallet.signMessage(
              ethers.utils.isHexString(message) 
                ? ethers.utils.arrayify(message) 
                : message
            );
            break;
            
          case 'eth_signTypedData':
          case 'eth_signTypedData_v4':
            // Sign typed data
            const typedData = JSON.parse(request.params[1]);
            result = await connectedWallet._signTypedData(
              typedData.domain,
              typedData.types,
              typedData.message
            );
            break;
            
          case 'eth_sendTransaction':
          case 'eth_signTransaction':
            // Sign or send transaction
            const txRequest = request.params[0];
            
            // Format transaction
            const tx = {
              to: txRequest.to,
              value: txRequest.value ? ethers.BigNumber.from(txRequest.value) : undefined,
              data: txRequest.data,
              gasLimit: txRequest.gas ? ethers.BigNumber.from(txRequest.gas) : undefined,
              gasPrice: txRequest.gasPrice ? ethers.BigNumber.from(txRequest.gasPrice) : undefined,
            };
            
            if (request.method === 'eth_sendTransaction') {
              // Send the transaction
              const txResponse = await connectedWallet.sendTransaction(tx);
              result = txResponse.hash;
            } else {
              // Just sign the transaction
              const signedTx = await connectedWallet.signTransaction(tx);
              result = signedTx;
            }
            break;
            
          default:
            throw new Error(`Unsupported method: ${request.method}`);
        }
        
        // Respond with the result
        await wcService.respondRequest(topic, id, result);
        
        // Clear the request after approval
        set({ walletConnectRequest: null });
        
        // Refresh balance if transaction was sent
        if (request.method === 'eth_sendTransaction') {
          await get().actions.fetchData();
        }
      } catch (error) {
        console.error('Failed to approve request:', error);
        throw error;
      }
    },

    /**
     * Reject a WalletConnect request
     */
    rejectRequest: async () => {
      const { walletConnectRequest } = get();
      
      if (!walletConnectRequest || walletConnectRequest.type !== 'session_request') {
        console.error('No session request to reject');
        return;
      }

      try {
        const WalletConnectService = (await import('../services/WalletConnectService')).default;
        const wcService = WalletConnectService.getInstance();
        
        await wcService.rejectRequest(walletConnectRequest.topic, walletConnectRequest.id);
        
        // Clear the request after rejection
        set({ walletConnectRequest: null });
      } catch (error) {
        console.error('Failed to reject request:', error);
        throw error;
      }
    },
  },
}));

export { SUPPORTED_NETWORKS };
export default useWalletStore;