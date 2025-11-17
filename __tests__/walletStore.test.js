/**
 * @format
 */

import * as Keychain from 'react-native-keychain';

// Mock the dependencies
jest.mock('react-native-keychain');

// Create mock functions for ethers
const mockCreateRandom = jest.fn();
const mockFromPhrase = jest.fn();

jest.mock('ethers', () => ({
  ethers: {
    Wallet: {
      createRandom: mockCreateRandom,
      fromPhrase: mockFromPhrase,
    },
  },
}));

// Import after mocks are defined
const useWalletStore = require('../src/store/walletStore').default;

describe('WalletStore', () => {
  let store;

  beforeEach(() => {
    // Reset the store state before each test
    store = useWalletStore.getState();
    useWalletStore.setState({
      mnemonic: null,
      address: null,
      isWalletCreated: false,
      isWalletUnlocked: false,
      needsBackup: false,
      balance: '0',
    });
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      store = useWalletStore.getState();
      
      expect(store.mnemonic).toBeNull();
      expect(store.address).toBeNull();
      expect(store.isWalletCreated).toBe(false);
      expect(store.isWalletUnlocked).toBe(false);
      expect(store.needsBackup).toBe(false);
      expect(store.balance).toBe('0');
      expect(store.transactions).toEqual([]);
    });

    it('should have actions object', () => {
      store = useWalletStore.getState();
      
      expect(store.actions).toBeDefined();
      expect(typeof store.actions.checkStorage).toBe('function');
      expect(typeof store.actions.createWallet).toBe('function');
      expect(typeof store.actions.verifyBackup).toBe('function');
      expect(typeof store.actions.unlockWallet).toBe('function');
      expect(typeof store.actions.lockWallet).toBe('function');
      expect(typeof store.actions.wipeWallet).toBe('function');
      expect(typeof store.actions.fetchBalance).toBe('function');
      expect(typeof store.actions.fetchTransactionHistory).toBe('function');
    });
  });

  describe('checkStorage', () => {
    it('should set isWalletCreated to true when credentials exist', async () => {
      Keychain.getGenericPassword.mockResolvedValue({
        username: 'wallet',
        password: 'test mnemonic phrase',
      });

      await useWalletStore.getState().actions.checkStorage();
      store = useWalletStore.getState();

      expect(store.isWalletCreated).toBe(true);
    });

    it('should set isWalletCreated to false when no credentials exist', async () => {
      Keychain.getGenericPassword.mockResolvedValue(false);

      await useWalletStore.getState().actions.checkStorage();
      store = useWalletStore.getState();

      expect(store.isWalletCreated).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      Keychain.getGenericPassword.mockRejectedValue(new Error('Storage error'));

      await useWalletStore.getState().actions.checkStorage();
      store = useWalletStore.getState();

      expect(store.isWalletCreated).toBe(false);
    });
  });

  describe('createWallet', () => {
    it('should create a new wallet and update state', async () => {
      const mockMnemonic = 'test mnemonic phrase word word word word word word word word word';
      const mockAddress = '0x1234567890123456789012345678901234567890';
      
      const mockWallet = {
        address: mockAddress,
        mnemonic: {
          phrase: mockMnemonic,
        },
      };

      mockCreateRandom.mockReturnValue(mockWallet);
      Keychain.setGenericPassword.mockResolvedValue(true);

      const returnedPhrase = await useWalletStore.getState().actions.createWallet();
      store = useWalletStore.getState();

      expect(mockCreateRandom).toHaveBeenCalled();
      expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
        'wallet',
        mockMnemonic,
        {
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
        }
      );
      expect(store.mnemonic).toBe(mockMnemonic);
      expect(store.address).toBe(mockAddress);
      expect(store.isWalletCreated).toBe(true);
      expect(store.isWalletUnlocked).toBe(false);
      expect(store.needsBackup).toBe(true);
      expect(returnedPhrase).toBe(mockMnemonic);
    });
  });

  describe('verifyBackup', () => {
    it('should verify backup and unlock wallet', () => {
      // First set up state as if wallet was just created
      useWalletStore.setState({
        mnemonic: 'test mnemonic',
        address: '0x123',
        isWalletCreated: true,
        isWalletUnlocked: false,
        needsBackup: true,
      });

      // Call verifyBackup
      useWalletStore.getState().actions.verifyBackup();
      store = useWalletStore.getState();

      expect(store.needsBackup).toBe(false);
      expect(store.isWalletUnlocked).toBe(true);
      expect(store.currentScreen).toBe('dashboard');
    });
  });

  describe('unlockWallet', () => {
    it('should unlock wallet with valid credentials', async () => {
      const mockMnemonic = 'test mnemonic phrase word word word word word word word word word';
      const mockAddress = '0x1234567890123456789012345678901234567890';
      
      const mockWallet = {
        address: mockAddress,
      };

      Keychain.getGenericPassword.mockResolvedValue({
        username: 'wallet',
        password: mockMnemonic,
      });
      mockFromPhrase.mockReturnValue(mockWallet);

      await useWalletStore.getState().actions.unlockWallet();
      store = useWalletStore.getState();

      expect(Keychain.getGenericPassword).toHaveBeenCalledWith({
        authenticationPrompt: {
          title: 'Déverrouiller le portefeuille',
        },
      });
      expect(mockFromPhrase).toHaveBeenCalledWith(mockMnemonic);
      expect(store.mnemonic).toBe(mockMnemonic);
      expect(store.address).toBe(mockAddress);
      expect(store.isWalletUnlocked).toBe(true);
    });

    it('should handle cancelled authentication', async () => {
      Keychain.getGenericPassword.mockRejectedValue(new Error('User cancelled'));
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await useWalletStore.getState().actions.unlockWallet();
      store = useWalletStore.getState();

      expect(store.mnemonic).toBeNull();
      expect(store.address).toBeNull();
      expect(store.isWalletUnlocked).toBe(false);
      
      consoleSpy.mockRestore();
    });

    it('should handle no credentials returned', async () => {
      Keychain.getGenericPassword.mockResolvedValue(false);

      await useWalletStore.getState().actions.unlockWallet();
      store = useWalletStore.getState();

      expect(store.mnemonic).toBeNull();
      expect(store.address).toBeNull();
      expect(store.isWalletUnlocked).toBe(false);
    });
  });

  describe('lockWallet', () => {
    it('should lock the wallet and clear sensitive data', () => {
      // First set some data
      useWalletStore.setState({
        mnemonic: 'test mnemonic',
        address: '0x123',
        isWalletUnlocked: true,
        balance: '1.5',
      });

      // Then lock the wallet
      useWalletStore.getState().actions.lockWallet();
      store = useWalletStore.getState();

      expect(store.mnemonic).toBeNull();
      expect(store.address).toBeNull();
      expect(store.isWalletUnlocked).toBe(false);
      expect(store.balance).toBe('0');
    });
  });

  describe('wipeWallet', () => {
    it('should wipe wallet and reset all state', async () => {
      Keychain.resetGenericPassword.mockResolvedValue(true);

      // First set some data
      useWalletStore.setState({
        mnemonic: 'test mnemonic',
        address: '0x123',
        isWalletCreated: true,
        isWalletUnlocked: true,
        balance: '1.5',
      });

      // Then wipe the wallet
      await useWalletStore.getState().actions.wipeWallet();
      store = useWalletStore.getState();

      expect(Keychain.resetGenericPassword).toHaveBeenCalled();
      expect(store.mnemonic).toBeNull();
      expect(store.address).toBeNull();
      expect(store.isWalletCreated).toBe(false);
      expect(store.isWalletUnlocked).toBe(false);
      expect(store.balance).toBe('0');
    });
  });

  describe('fetchBalance', () => {
    it('should handle when no address is available', async () => {
      useWalletStore.setState({ address: null });

      await useWalletStore.getState().actions.fetchBalance();
      store = useWalletStore.getState();

      expect(store.balance).toBe('0');
    });

    it('should handle fetch balance errors', async () => {
      useWalletStore.setState({ address: '0x123' });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await useWalletStore.getState().actions.fetchBalance();
      store = useWalletStore.getState();

      expect(store.balance).toBe('0');
      consoleSpy.mockRestore();
    });
  });

  describe('fetchTransactionHistory', () => {
    it('should have transactions in initial state', () => {
      store = useWalletStore.getState();
      expect(store.transactions).toBeDefined();
      expect(Array.isArray(store.transactions)).toBe(true);
    });

    it('should not fetch when no address is available', async () => {
      useWalletStore.setState({ address: null, transactions: [] });

      await useWalletStore.getState().actions.fetchTransactionHistory();
      store = useWalletStore.getState();

      expect(store.transactions).toEqual([]);
    });

    it('should fetch transactions successfully', async () => {
      const mockTransactions = [
        {
          hash: '0xabc123',
          from: '0x1234567890123456789012345678901234567890',
          to: '0x0987654321098765432109876543210987654321',
          value: '1000000000000000000',
          timeStamp: '1234567890',
        },
      ];

      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({ result: mockTransactions }),
        })
      );

      useWalletStore.setState({ address: '0x123' });

      await useWalletStore.getState().actions.fetchTransactionHistory();
      store = useWalletStore.getState();

      expect(store.transactions).toEqual(mockTransactions);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('api-sepolia.etherscan.io')
      );
    });

    it('should handle fetch transaction history errors', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      useWalletStore.setState({ address: '0x123' });

      await useWalletStore.getState().actions.fetchTransactionHistory();
      store = useWalletStore.getState();

      expect(store.transactions).toEqual([]);
      consoleSpy.mockRestore();
    });

    it('should handle empty result from API', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({ result: null }),
        })
      );

      useWalletStore.setState({ address: '0x123' });

      await useWalletStore.getState().actions.fetchTransactionHistory();
      store = useWalletStore.getState();

      expect(store.transactions).toEqual([]);
    });
  });
});
