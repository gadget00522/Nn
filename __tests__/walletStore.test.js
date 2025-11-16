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
    });

    it('should have actions object', () => {
      store = useWalletStore.getState();
      
      expect(store.actions).toBeDefined();
      expect(typeof store.actions.checkStorage).toBe('function');
      expect(typeof store.actions.createWallet).toBe('function');
      expect(typeof store.actions.unlockWallet).toBe('function');
      expect(typeof store.actions.lockWallet).toBe('function');
      expect(typeof store.actions.wipeWallet).toBe('function');
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
      expect(store.isWalletUnlocked).toBe(true);
      expect(returnedPhrase).toBe(mockMnemonic);
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
      });

      // Then lock the wallet
      useWalletStore.getState().actions.lockWallet();
      store = useWalletStore.getState();

      expect(store.mnemonic).toBeNull();
      expect(store.address).toBeNull();
      expect(store.isWalletUnlocked).toBe(false);
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
      });

      // Then wipe the wallet
      await useWalletStore.getState().actions.wipeWallet();
      store = useWalletStore.getState();

      expect(Keychain.resetGenericPassword).toHaveBeenCalled();
      expect(store.mnemonic).toBeNull();
      expect(store.address).toBeNull();
      expect(store.isWalletCreated).toBe(false);
      expect(store.isWalletUnlocked).toBe(false);
    });
  });
});
