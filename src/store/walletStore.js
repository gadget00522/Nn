import { create } from 'zustand';
import { ethers } from 'ethers';
import { Platform } from 'react-native';
import { Alchemy } from 'alchemy-sdk';
import {
  encryptMnemonic,
  decryptMnemonic,
  encryptMnemonicV2,
  decryptMnemonicAny,
  loadEncryptedMnemonic,
  storeEncryptedMnemonic,
  clearEncryptedMnemonic,
  isMigrationNeeded
} from '../utils/secureStorage';

let Keychain = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Keychain = require('react-native-keychain');
  } catch {
    Keychain = null;
  }
}

/**
 * Abstraction simple du stockage Web (localStorage) avec gestion des erreurs de disponibilité.
 */
const webStorage = {
  getItem: (k) => (typeof localStorage !== 'undefined' ? localStorage.getItem(k) : null),
  setItem: (k, v) => { if (typeof localStorage !== 'undefined') localStorage.setItem(k, v); },
  removeItem: (k) => { if (typeof localStorage !== 'undefined') localStorage.removeItem(k); },
};

/**
 * Liste des réseaux blockchain supportés par l'application.
 */
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

/**
 * Store Zustand principal pour la gestion de l'état du portefeuille.
 * Gère la création, le déverrouillage, les transactions, l'état de la connexion WalletConnect, etc.
 */
const useWalletStore = create((set, get) => ({
  // Core wallet state
  /** La phrase mnémonique du portefeuille (disponible uniquement si déverrouillé). */
  mnemonic: null,
  /** Le payload chiffré de la mnémonique. */
  encryptedMnemonicPayload: null,
  /** L'adresse publique du portefeuille. */
  address: null,
  /** Indique si un portefeuille a été créé ou importé. */
  isWalletCreated: false,
  /** Indique si le portefeuille est actuellement déverrouillé. */
  isWalletUnlocked: false,
  /** Indique si une sauvegarde de la phrase de récupération est nécessaire. */
  needsBackup: false,
  /** Indique si l'utilisateur a confirmé avoir sauvegardé sa phrase. */
  hasBackedUp: false,
  /** Niveau de sécurité actuel (ex: 'weak', 'strong'). */
  securityLevel: 'weak',
  /** Stockage temporaire de la mnémonique lors de la création (pour affichage). */
  tempPlainMnemonic: null,
  /** Solde du compte (en ETH ou token natif). */
  balance: '0',
  /** Historique des transactions (actuellement vide). */
  transactions: [],
  /** Liste des soldes de tokens ERC20. */
  tokenBalances: [],
  /** Liste des tokens personnalisés ajoutés par l'utilisateur. */
  customTokens: [],
  /** Actif sélectionné pour l'envoi. */
  assetToSend: null,
  /** Réseau blockchain actuellement sélectionné. */
  currentNetwork: SUPPORTED_NETWORKS[0],
  /** Requête WalletConnect en attente (proposition de session ou requête de signature/transaction). */
  walletConnectRequest: null,

  // New preferences / security
  /** Langue préférée de l'utilisateur ('auto', 'fr', 'en', etc.). */
  language: 'auto',
  /** Mode de thème ('system', 'light', 'dark'). */
  themeMode: 'system',
  /** Délai en minutes avant le verrouillage automatique (0 = désactivé). */
  autoLockMinutes: 0,
  /** Version de l'algorithme de chiffrement utilisé. */
  encryptionVersion: 1,
  /** Timestamp de la dernière interaction utilisateur. */
  lastInteraction: Date.now(),

  actions: {
    /**
     * Initialise les préférences de l'utilisateur depuis le stockage local.
     */
    initializePreferences: () => {
      if (Platform.OS === 'web') {
        const lock = localStorage.getItem('wallet.autoLock');
        if (lock) set({ autoLockMinutes: parseInt(lock, 10) || 0 });
        const lngOverride = localStorage.getItem('wallet.lang.override');
        if (lngOverride) set({ language: lngOverride });
      }
    },
    /**
     * Active l'observateur pour le verrouillage automatique en cas d'inactivité.
     */
    applyAutoLockWatcher: () => {
      if (Platform.OS === 'web') {
        window.addEventListener('click', get().actions.recordInteraction);
        window.addEventListener('keydown', get().actions.recordInteraction);
        setInterval(() => {
          const { autoLockMinutes, lastInteraction } = get();
            if (autoLockMinutes > 0 && Date.now() - lastInteraction > autoLockMinutes * 60_000) {
            get().actions.lockWallet();
          }
        }, 30_000);
      }
    },
    /**
     * Enregistre une interaction utilisateur pour repousser le verrouillage automatique.
     */
    recordInteraction: () => set({ lastInteraction: Date.now() }),
    /**
     * Définit la langue de l'application.
     * @param {string} lng - Code langue.
     */
    setLanguage: (lng) => set({ language: lng }),
    /**
     * Définit le mode de thème.
     * @param {string} mode - Mode de thème.
     */
    setThemeMode: (mode) => set({ themeMode: mode }),
    /**
     * Configure le délai de verrouillage automatique.
     * @param {number} minutes - Délai en minutes.
     */
    setAutoLock: (minutes) => {
      if (Platform.OS === 'web') localStorage.setItem('wallet.autoLock', String(minutes));
      set({ autoLockMinutes: minutes });
    },

    /**
     * Vérifie si un portefeuille existe dans le stockage (Web ou Keychain).
     * Met à jour l'état `isWalletCreated` et `needsBackup`.
     */
    checkStorage: async () => {
      try {
        let walletExists = false;
        let encryptedPayload = null;
        let needsBackup = false;
        let hasBackedUp = false;

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
          encryptedMnemonicPayload: encryptedPayload,
          needsBackup,
          hasBackedUp,
          encryptionVersion: encryptedPayload ? encryptedPayload.version : 1,
        });
      } catch {
        set({ isWalletCreated: false });
      }
    },

    /**
     * Crée un nouveau portefeuille.
     * Génère une mnémonique aléatoire, la chiffre et la stocke.
     *
     * @param {string} password - Mot de passe pour le chiffrement (Web uniquement).
     * @returns {Promise<string>} La phrase mnémonique générée.
     */
    createWallet: async (password = '') => {
      const wallet = ethers.Wallet.createRandom();
      const phrase = wallet.mnemonic?.phrase || wallet.mnemonic;

      if (Platform.OS === 'web') {
        if (!password) throw new Error('Mot de passe requis (web)');
        try {
          // Direct v2 encryption (Argon2id)
          const payload = await encryptMnemonicV2(phrase, password);
          storeEncryptedMnemonic(payload);
          set({ encryptedMnemonicPayload: payload, securityLevel: 'strong', encryptionVersion: 2 });
          localStorage.setItem('wallet_needsBackup', 'true');
          localStorage.setItem('wallet_hasBackedUp', 'false');
        } catch (e) {
          // Fallback PBKDF2
          const payload = await encryptMnemonic(phrase, password);
          storeEncryptedMnemonic(payload);
          set({ encryptedMnemonicPayload: payload, securityLevel: 'strong', encryptionVersion: 1 });
          localStorage.setItem('wallet_needsBackup', 'true');
          localStorage.setItem('wallet_hasBackedUp', 'false');
        }
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

    /**
     * Importe un portefeuille existant à partir d'une phrase mnémonique.
     *
     * @param {string} mnemonic - La phrase de récupération (12 ou 24 mots).
     * @param {string} passwordForLocalEncryption - Mot de passe pour le chiffrement local (Web).
     * @returns {Promise<string>} L'adresse du portefeuille importé.
     */
    importWalletFromMnemonic: async (mnemonic, passwordForLocalEncryption = '') => {
      try {
        const wallet = ethers.Wallet.fromMnemonic(mnemonic.trim());
        const address = wallet.address;

        if (Platform.OS === 'web') {
          if (!passwordForLocalEncryption) throw new Error('Mot de passe requis pour import (web)');
          try {
            const payload = await encryptMnemonicV2(mnemonic.trim(), passwordForLocalEncryption);
            storeEncryptedMnemonic(payload);
            set({ encryptedMnemonicPayload: payload, securityLevel: 'strong', encryptionVersion: 2 });
          } catch (e) {
            const payload = await encryptMnemonic(mnemonic.trim(), passwordForLocalEncryption);
            storeEncryptedMnemonic(payload);
            set({ encryptedMnemonicPayload: payload, securityLevel: 'strong', encryptionVersion: 1 });
          }
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

    /**
     * Migre le chiffrement vers la version la plus récente si nécessaire.
     *
     * @param {string} password - Le mot de passe actuel.
     * @returns {Promise<boolean>} True si la migration a eu lieu, sinon False.
     */
    migrateEncryption: async (password) => {
      const payload = get().encryptedMnemonicPayload;
      if (!payload) throw new Error('Aucun payload');
      if (!isMigrationNeeded(payload)) return false;
      const phrase = await decryptMnemonic(payload, password);
      const newPayload = await encryptMnemonicV2(phrase, password);
      storeEncryptedMnemonic(newPayload);
      set({ encryptedMnemonicPayload: newPayload, encryptionVersion: 2 });
      return true;
    },

    /**
     * Change le mot de passe de chiffrement du portefeuille.
     *
     * @param {string} oldPassword - L'ancien mot de passe.
     * @param {string} newPassword - Le nouveau mot de passe.
     */
    changePassword: async (oldPassword, newPassword) => {
      const payload = get().encryptedMnemonicPayload;
      if (!payload) throw new Error('Aucun payload chiffré');
      const phrase = await decryptMnemonicAny(payload, oldPassword);
      const newPayload = await encryptMnemonicV2(phrase, newPassword);
      storeEncryptedMnemonic(newPayload);
      set({ encryptedMnemonicPayload: newPayload, encryptionVersion: 2 });
    },

    /**
     * Confirme que la sauvegarde a été effectuée.
     */
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
      });
    },

    /**
     * Déverrouille le portefeuille avec le mot de passe (ou biométrie sur mobile).
     *
     * @param {string} password - Mot de passe de déchiffrement.
     * @returns {Promise<boolean>} True si déverrouillé avec succès.
     */
    unlockWallet: async (password = '') => {
      try {
        if (Platform.OS === 'web') {
          const payload = get().encryptedMnemonicPayload;
          const legacyMnemonic = webStorage.getItem('wallet_mnemonic');

          if (payload) {
            const phrase = await decryptMnemonicAny(payload, password);
            const wallet = ethers.Wallet.fromMnemonic(phrase);
            set({
              mnemonic: phrase,
              address: wallet.address,
              isWalletUnlocked: true,
              encryptionVersion: payload.version
            });
            return true;
          }
          if (legacyMnemonic) {
            const wallet = ethers.Wallet.fromMnemonic(legacyMnemonic);
            set({ mnemonic: legacyMnemonic, address: wallet.address, isWalletUnlocked: true });
            return true;
          }
          throw new Error('Aucun portefeuille trouvé');
        }

        if (Keychain) {
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

    /**
     * Verrouille le portefeuille en effaçant la mnémonique de la mémoire.
     */
    lockWallet: () => set({ mnemonic: null, isWalletUnlocked: false }),

    /**
     * Supprime complètement le portefeuille et toutes les données associées.
     */
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
        encryptionVersion: 1,
      });
    },

    /**
     * Récupère les données du portefeuille (solde, tokens) depuis la blockchain via Alchemy.
     */
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

    /**
     * Prépare l'écran d'envoi avec un actif spécifique pré-sélectionné.
     *
     * @param {string} screenName - Le nom de l'écran.
     * @param {object} asset - L'actif à envoyer.
     */
    setScreen: (screenName, asset = null) => set({ assetToSend: asset }),

    /**
     * Change le réseau blockchain actif.
     *
     * @param {object} network - Le réseau à utiliser.
     */
    switchNetwork: (network) =>
      set({
        currentNetwork: network,
        balance: '0',
        tokenBalances: [],
        transactions: [],
      }),

    /**
     * Envoie une transaction (ETH ou Token) à une adresse donnée.
     *
     * @param {string} toAddress - L'adresse du destinataire.
     * @param {string} amount - Le montant à envoyer.
     */
    sendTransaction: async (toAddress, amount) => {
      set({ isSending: true, sendError: null });
      try {
        const { mnemonic, assetToSend, currentNetwork, hasBackedUp, isWalletUnlocked } = get();
        if (!mnemonic || !isWalletUnlocked) throw new Error('Déverrouille le portefeuille.');
        if (!hasBackedUp) throw new Error('Sauvegarde requise.');

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
      } catch (e) {
        set({ sendError: e.message });
      } finally {
        set({ isSending: false });
      }
    },

    /**
     * Ajoute un token personnalisé à la liste.
     *
     * @param {object} token - Les détails du token.
     */
    addCustomToken: (token) => {
      const { customTokens } = get();
      if (customTokens.find((t) => t.address.toLowerCase() === token.address.toLowerCase())) return;
      set({ customTokens: [...customTokens, token] });
    },

    /**
     * Définit la requête WalletConnect actuelle.
     * @param {object} r - La requête.
     */
    setWalletConnectRequest: (r) => set({ walletConnectRequest: r }),
    /**
     * Efface la requête WalletConnect actuelle.
     */
    clearWalletConnectRequest: () => set({ walletConnectRequest: null }),

    /**
     * Approuve une session WalletConnect en attente.
     */
    approveSession: async () => {
      const { walletConnectRequest, address, currentNetwork } = get();
      if (!walletConnectRequest || walletConnectRequest.type !== 'session_proposal') return;
      try {
        const WalletConnectService = (await import('../services/WalletConnectService')).default;
        const wcService = WalletConnectService.getInstance();
        const accounts = [`eip155:${currentNetwork.chainId}:${address}`];
        await wcService.approveSession(walletConnectRequest.id, accounts, currentNetwork.chainId);
        set({ walletConnectRequest: null });
      } catch (e) {
        throw e;
      }
    },

    /**
     * Rejette une session WalletConnect en attente.
     */
    rejectSession: async () => {
      const { walletConnectRequest } = get();
      if (!walletConnectRequest || walletConnectRequest.type !== 'session_proposal') return;
      try {
        const WalletConnectService = (await import('../services/WalletConnectService')).default;
        const wcService = WalletConnectService.getInstance();
        await wcService.rejectSession(walletConnectRequest.id);
        set({ walletConnectRequest: null });
      } catch (e) {
        throw e;
      }
    },

    /**
     * Approuve une requête de session (sign/transaction) WalletConnect.
     */
    approveRequest: async () => {
      const { walletConnectRequest, mnemonic, currentNetwork } = get();
      if (!walletConnectRequest || walletConnectRequest.type !== 'session_request') return;
      if (!mnemonic) throw new Error('Wallet non déverrouillé');
      try {
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
      } catch (e) {
        throw e;
      }
    },

    /**
     * Rejette une requête de session WalletConnect.
     */
    rejectRequest: async () => {
      const { walletConnectRequest } = get();
      if (!walletConnectRequest || walletConnectRequest.type !== 'session_request') return;
      try {
        const WalletConnectService = (await import('../services/WalletConnectService')).default;
        const wcService = WalletConnectService.getInstance();
        await wcService.rejectRequest(walletConnectRequest.topic, walletConnectRequest.id);
        set({ walletConnectRequest: null });
      } catch (e) {
        throw e;
      }
    },
  },
}));

export { SUPPORTED_NETWORKS };
export default useWalletStore;
