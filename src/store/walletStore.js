import { create } from 'zustand';
import { ethers } from 'ethers';
import { Platform } from 'react-native';
import { Alchemy } from 'alchemy-sdk';
import {
  encryptMnemonic,
  decryptMnemonic,
  storeEncryptedMnemonic,
  loadEncryptedMnemonic,
  clearEncryptedMnemonic,
} from '../utils/secureStorage';

let Keychain = null;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Keychain = require('react-native-keychain');
}

const webStorage = {
  getItem: (k) => (typeof localStorage !== 'undefined' ? localStorage.getItem(k) : null),
  setItem: (k, v) => { if (typeof localStorage !== 'undefined') localStorage.setItem(k, v); },
  removeItem: (k) => { if (typeof localStorage !== 'undefined') localStorage.removeItem(k); },
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
  mnemonic: null,
  encryptedMnemonicPayload: null,
  address: null,
  isWalletCreated: false,
  isWalletUnlocked: false,
  needsBackup: false,
  hasBackedUp: false,
  securityLevel: 'weak',
  tempPlainMnemonic: null,
  balance: '0',
  currentScreen: 'dashboard',
  isSending: false,
  sendError: null,
  transactions: [],
  tokenBalances: [],
  customTokens: [],
  assetToSend: null,
  currentNetwork: SUPPORTED_NETWORKS[0],
  walletConnectRequest: null,

  actions: {
    checkStorage: async () => {
      try {
        let walletExists = false;
        let needsBackup = false;
        let hasBackedUp = false;
        let encryptedPayload = null;

        if (Platform.OS === 'web') {
          encryptedPayload = loadEncryptedMnemonic();
          const legacyMnemonic = webStorage.getItem('wallet_mnemonic');
          if (encryptedPayload || legacyMnemonic) walletExists = true;
          needsBackup = localStorage.getItem('wallet_needsBackup') === 'true';
          hasBackedUp = localStorage.getItem('wallet_hasBackedUp') === 'true';
        } else if (Keychain) {
          const credentials = await Keychain.getGenericPassword();
          walletExists = !!credentials;
          needsBackup = walletExists ? true : false;
        }

        set({
          isWalletCreated: walletExists,
          needsBackup,
          hasBackedUp,
          encryptedMnemonicPayload: encryptedPayload,
        });
      } catch {
        set({ isWalletCreated: false });
      }
    },

    createWallet: async (password = '') => {
      const wallet = ethers.Wallet.createRandom();
      const phrase = wallet.mnemonic.phrase;

      if (Platform.OS === 'web') {
        if (!password) {
          throw new Error('Mot de passe requis pour création (mode sans mocks).');
        }
        const payload = await encryptMnemonic(phrase, password);
        storeEncryptedMnemonic(payload);
        set({ encryptedMnemonicPayload: payload, securityLevel: 'strong' });
        localStorage.setItem('wallet_needsBackup', 'true');
        localStorage.setItem('wallet_hasBackedUp', 'false');
      } else if (Keychain) {
        await Keychain.setGenericPassword('wallet', phrase, {
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
        });
      }

      set({
        mnemonic: phrase,
        tempPlainMnemonic: phrase,
        address: wallet.address,
        isWalletCreated: true,
        isWalletUnlocked: false,
        needsBackup: true,
        hasBackedUp: false,
      });
      return phrase;
    },

    importWalletFromMnemonic: async (mnemonic, passwordForLocalEncryption = '') => {
      try {
        const wallet = ethers.Wallet.fromMnemonic(mnemonic.trim());
        const address = wallet.address;

        if (Platform.OS === 'web') {
          if (!passwordForLocalEncryption) {
            throw new Error('Mot de passe requis pour import (mode sans mocks).');
          }
          const payload = await encryptMnemonic(mnemonic.trim(), passwordForLocalEncryption);
          storeEncryptedMnemonic(payload);
          set({ encryptedMnemonicPayload: payload, securityLevel: 'strong' });
          localStorage.setItem('wallet_needsBackup', 'false');
          localStorage.setItem('wallet_hasBackedUp', 'true');
        } else if (Keychain) {
          await Keychain.setGenericPassword('wallet', mnemonic.trim(), {
            accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
          });
        }

        set({
          mnemonic: mnemonic.trim(),
          tempPlainMnemonic: null,
          address,
          isWalletCreated: true,
          isWalletUnlocked: true,
          needsBackup: false,
          hasBackedUp: true,
        });
        return address;
      } catch {
        throw new Error('Mnemonic invalide');
      }
    },

    verifyBackup: () => {
      if (Platform.OS === 'web') {
        localStorage.setItem('wallet_needsBackup', 'false');
        localStorage.setItem('wallet_hasBackedUp', 'true');
      }
      set({
        needsBackup: false,
        hasBackedUp: true,
        isWalletUnlocked: true,
        tempPlainMnemonic: null,
        currentScreen: 'dashboard',
      });
    },

    unlockWallet: async (password = '') => {
      try {
        if (Platform.OS === 'web') {
          const payload = get().encryptedMnemonicPayload;
          if (!payload) throw new Error('Aucun portefeuille trouvé');
          const phrase = await decryptMnemonic(payload, password);
          const wallet = ethers.Wallet.fromMnemonic(phrase);
          set({ mnemonic: phrase, address: wallet.address, isWalletUnlocked: true });
          return true;
        } else if (Keychain) {
          const credentials = await Keychain.getGenericPassword({
            authenticationPrompt: { title: 'Déverrouiller le portefeuille' },
          });
            if (!credentials) throw new Error('Authentification annulée');
          const wallet = ethers.Wallet.fromMnemonic(credentials.password);
          set({ mnemonic: credentials.password, address: wallet.address, isWalletUnlocked: true });
          return true;
        }
        throw new Error('Plateforme non supportée');
      } catch (e) {
        throw e;
      }
    },

    lockWallet: () => set({ mnemonic: null, isWalletUnlocked: false }),

    wipeWallet: async () => {
      clearEncryptedMnemonic();
      if (Keychain) await Keychain.resetGenericPassword();
      if (Platform.OS === 'web') {
        localStorage.removeItem('wallet_needsBackup');
        localStorage.removeItem('wallet_hasBackedUp');
        webStorage.removeItem('wallet_mnemonic');
      }
      set({
        mnemonic: null,
        encryptedMnemonicPayload: null,
        tempPlainMnemonic: null,
        address: null,
        isWalletCreated: false,
        isWalletUnlocked: false,
        needsBackup: false,
        hasBackedUp: false,
        balance: '0',
        transactions: [],
        tokenBalances: [],
        customTokens: [],
      });
    },

    fetchData: async () => {
      try {
        const { address, currentNetwork } = get();
        if (!address) return;
        const alchemy = new Alchemy({ apiKey: '6E1MABBp0KS-gBCc5zXk7', network: currentNetwork.alchemyNetwork });

        const balanceWei = await alchemy.core.getBalance(address);
        const balanceEth = ethers.utils.formatEther(balanceWei);

        const tokenBalancesResponse = await alchemy.core.getTokenBalances(address);
        const tokensWithBalance = tokenBalancesResponse.tokenBalances.filter(
          (t) => t.tokenBalance && t.tokenBalance !== '0',
        );

        const metadataPromises = tokensWithBalance.map((t) =>
          alchemy.core.getTokenMetadata(t.contractAddress),
        );
        const metadataList = await Promise.all(metadataPromises);

        const finalTokenList = tokensWithBalance
          .map((t, i) => {
            const meta = metadataList[i];
            if (!meta.symbol) return null;
            const rawStr = t.tokenBalance;
            const raw = rawStr.startsWith('0x') ? parseInt(rawStr, 16) : Number(rawStr);
            const decimals = meta.decimals || 18;
            const bal = raw / Math.pow(10, decimals);
            return {
              symbol: meta.symbol,
              balance: bal.toFixed(4),
              contractAddress: t.contractAddress,
              decimals,
              logo: meta.logo,
            };
          })
          .filter(Boolean);

        set({
          balance: balanceEth,
          transactions: [],
          tokenBalances: finalTokenList,
        });
      } catch {
        set({ balance: '0', transactions: [], tokenBalances: [] });
      }
    },

    setScreen: (screenName, asset = null) => set({ currentScreen: screenName, assetToSend: asset }),

    switchNetwork: (network) =>
      set({
        currentNetwork: network,
        balance: '0',
        tokenBalances: [],
        transactions: [],
      }),

    sendTransaction: async (toAddress, amount) => {
      set({ isSending: true, sendError: null });
      try {
        const { mnemonic, assetToSend, currentNetwork, hasBackedUp } = get();
        if (!mnemonic) throw new Error('Déverrouille le portefeuille.');
        if (!hasBackedUp) throw new Error('Fais le backup avant d’envoyer des fonds.');

        const provider = new ethers.providers.JsonRpcProvider(currentNetwork.rpcUrl);
        const wallet = ethers.Wallet.fromMnemonic(mnemonic);
        const connectedWallet = wallet.connect(provider);

        if (!ethers.utils.isAddress(toAddress)) throw new Error('Adresse invalide.');

        if (assetToSend && assetToSend.contractAddress) {
          const tokenAbi = ['function transfer(address to, uint256 amount)'];
          const tokenContract = new ethers.Contract(assetToSend.contractAddress, tokenAbi, connectedWallet);
          const amountToSend = ethers.utils.parseUnits(amount, assetToSend.decimals);
          const tx = await tokenContract.transfer(toAddress, amountToSend);
          await tx.wait();
        } else {
          const txValue = ethers.utils.parseEther(amount);
          const txResponse = await connectedWallet.sendTransaction({ to: toAddress, value: txValue });
          await txResponse.wait();
        }

        await get().actions.fetchData();
        get().actions.setScreen('dashboard');
      } catch (e) {
        set({ sendError: e.message });
      } finally {
        set({ isSending: false });
      }
    },

    addCustomToken: (token) => {
      const { customTokens } = get();
      if (customTokens.find((t) => t.address.toLowerCase() === token.address.toLowerCase())) return;
      set({ customTokens: [...customTokens, token] });
    },

    setWalletConnectRequest: (r) => set({ walletConnectRequest: r }),
    clearWalletConnectRequest: () => set({ walletConnectRequest: null }),

    approveSession: async () => {
      const { walletConnectRequest, address, currentNetwork } = get();
      if (!walletConnectRequest || walletConnectRequest.type !== 'session_proposal') return;
      const WalletConnectService = (await import('../services/WalletConnectService')).default;
      const wcService = WalletConnectService.getInstance();
      const accounts = [`eip155:${currentNetwork.chainId}:${address}`];
      await wcService.approveSession(walletConnectRequest.id, accounts, currentNetwork.chainId);
      set({ walletConnectRequest: null });
    },

    rejectSession: async () => {
      const { walletConnectRequest } = get();
      if (!walletConnectRequest || walletConnectRequest.type !== 'session_proposal') return;
      const WalletConnectService = (await import('../services/WalletConnectService')).default;
      const wcService = WalletConnectService.getInstance();
      await wcService.rejectSession(walletConnectRequest.id);
      set({ walletConnectRequest: null });
    },

    approveRequest: async () => {
      const { walletConnectRequest, mnemonic, currentNetwork } = get();
      if (!walletConnectRequest || walletConnectRequest.type !== 'session_request') return;
      if (!mnemonic) throw new Error('Wallet non déverrouillé');
      const WalletConnectService = (await import('../services/WalletConnectService')).default;
      const wcService = WalletConnectService.getInstance();

      const wallet = ethers.Wallet.fromMnemonic(mnemonic);
      const provider = new ethers.providers.JsonRpcProvider(currentNetwork.rpcUrl);
      const connectedWallet = wallet.connect(provider);

      const { topic, id, params } = walletConnectRequest;
      const { request } = params;
      let result;

      switch (request.method) {
        case 'eth_sign':
        case 'personal_sign': {
          const message = request.params[0];
          result = await connectedWallet.signMessage(
            ethers.utils.isHexString(message) ? ethers.utils.arrayify(message) : message,
          );
          break;
        }
        case 'eth_signTypedData':
        case 'eth_signTypedData_v4': {
          const typedData = JSON.parse(request.params[1]);
          result = await connectedWallet._signTypedData(
            typedData.domain,
            typedData.types,
            typedData.message,
          );
          break;
        }
        case 'eth_sendTransaction':
        case 'eth_signTransaction': {
          const txRequest = request.params[0];
          const tx = {
            to: txRequest.to,
            value: txRequest.value ? ethers.BigNumber.from(txRequest.value) : undefined,
            data: txRequest.data,
            gasLimit: txRequest.gas ? ethers.BigNumber.from(txRequest.gas) : undefined,
            gasPrice: txRequest.gasPrice ? ethers.BigNumber.from(txRequest.gasPrice) : undefined,
          };
          if (request.method === 'eth_sendTransaction') {
            const txResponse = await connectedWallet.sendTransaction(tx);
            result = txResponse.hash;
          } else {
            const signedTx = await connectedWallet.signTransaction(tx);
            result = signedTx;
          }
          break;
        }
        default:
          throw new Error(`Méthode non supportée: ${request.method}`);
      }

      await wcService.respondRequest(topic, id, result);
      set({ walletConnectRequest: null });
      if (request.method === 'eth_sendTransaction') {
        await get().actions.fetchData();
      }
    },

    rejectRequest: async () => {
      const { walletConnectRequest } = get();
      if (!walletConnectRequest || walletConnectRequest.type !== 'session_request') return;
      const WalletConnectService = (await import('../services/WalletConnectService')).default;
      const wcService = WalletConnectService.getInstance();
      await wcService.rejectRequest(walletConnectRequest.topic, walletConnectRequest.id);
      set({ walletConnectRequest: null });
    },
  },
}));

export { SUPPORTED_NETWORKS };
export default useWalletStore;
