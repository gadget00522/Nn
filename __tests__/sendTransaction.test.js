/**
 * @format
 */

// Mock the dependencies
jest.mock('react-native-keychain');

// Create mock functions for ethers
const mockCreateRandom = jest.fn();
const mockFromPhrase = jest.fn();
const mockConnect = jest.fn();
const mockSendTransaction = jest.fn();
const mockWait = jest.fn();
const mockGetBalance = jest.fn();
const mockIsAddress = jest.fn();
const mockParseEther = jest.fn();
const mockFormatEther = jest.fn();

jest.mock('ethers', () => ({
  ethers: {
    Wallet: {
      createRandom: mockCreateRandom,
      fromPhrase: mockFromPhrase,
    },
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      getBalance: mockGetBalance,
    })),
    isAddress: mockIsAddress,
    parseEther: mockParseEther,
    formatEther: mockFormatEther,
  },
}));

// Import after mocks are defined
const useWalletStore = require('../src/store/walletStore').default;

describe('WalletStore - Send Transaction Features', () => {
  let store;

  beforeEach(() => {
    // Reset the store state before each test
    store = useWalletStore.getState();
    useWalletStore.setState({
      mnemonic: null,
      address: null,
      isWalletCreated: false,
      isWalletUnlocked: false,
      balance: '0',
      currentScreen: 'dashboard',
      isSending: false,
      sendError: null,
    });
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Initial State - New Fields', () => {
    it('should have new currentScreen state set to dashboard', () => {
      store = useWalletStore.getState();
      expect(store.currentScreen).toBe('dashboard');
    });

    it('should have new isSending state set to false', () => {
      store = useWalletStore.getState();
      expect(store.isSending).toBe(false);
    });

    it('should have new sendError state set to null', () => {
      store = useWalletStore.getState();
      expect(store.sendError).toBeNull();
    });
  });

  describe('setScreen action', () => {
    it('should update currentScreen to send', () => {
      useWalletStore.getState().actions.setScreen('send');
      store = useWalletStore.getState();
      
      expect(store.currentScreen).toBe('send');
    });

    it('should update currentScreen to dashboard', () => {
      useWalletStore.setState({ currentScreen: 'send' });
      
      useWalletStore.getState().actions.setScreen('dashboard');
      store = useWalletStore.getState();
      
      expect(store.currentScreen).toBe('dashboard');
    });

    it('should have setScreen function defined', () => {
      store = useWalletStore.getState();
      expect(typeof store.actions.setScreen).toBe('function');
    });
  });

  describe('sendTransaction action', () => {
    beforeEach(() => {
      // Setup common mocks for sendTransaction
      mockIsAddress.mockReturnValue(true);
      mockParseEther.mockReturnValue('1000000000000000000'); // 1 ETH in wei
      mockFormatEther.mockReturnValue('1.0');
      mockGetBalance.mockResolvedValue('2000000000000000000');
      mockWait.mockResolvedValue({ status: 1 });
      mockSendTransaction.mockResolvedValue({
        wait: mockWait,
        hash: '0xabcdef',
      });
      mockConnect.mockReturnValue({
        sendTransaction: mockSendTransaction,
      });
      mockFromPhrase.mockReturnValue({
        connect: mockConnect,
      });
    });

    it('should have sendTransaction function defined', () => {
      store = useWalletStore.getState();
      expect(typeof store.actions.sendTransaction).toBe('function');
    });

    it('should set isSending to true when starting transaction', async () => {
      useWalletStore.setState({ 
        mnemonic: 'test mnemonic phrase word word word word word word word word word',
        address: '0x123',
      });

      const promise = useWalletStore.getState().actions.sendTransaction(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
        '1.0'
      );
      
      // Check immediately after calling (should be true before promise resolves)
      store = useWalletStore.getState();
      expect(store.isSending).toBe(true);
      
      await promise;
    });

    it('should set isSending to false after transaction completes', async () => {
      useWalletStore.setState({ 
        mnemonic: 'test mnemonic phrase word word word word word word word word word',
        address: '0x123',
      });

      await useWalletStore.getState().actions.sendTransaction(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
        '1.0'
      );
      
      store = useWalletStore.getState();
      expect(store.isSending).toBe(false);
    });

    it('should clear sendError when starting transaction', async () => {
      useWalletStore.setState({ 
        mnemonic: 'test mnemonic phrase word word word word word word word word word',
        address: '0x123',
        sendError: 'Previous error',
      });

      const promise = useWalletStore.getState().actions.sendTransaction(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
        '1.0'
      );
      
      // Check that error is cleared when starting
      store = useWalletStore.getState();
      expect(store.sendError).toBeNull();
      
      await promise;
    });

    it('should throw error when mnemonic is null', async () => {
      useWalletStore.setState({ 
        mnemonic: null,
        address: '0x123',
      });

      await useWalletStore.getState().actions.sendTransaction(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
        '1.0'
      );
      
      store = useWalletStore.getState();
      expect(store.sendError).toBeTruthy();
      expect(store.sendError).toContain('Mnémonique non disponible');
    });

    it('should validate recipient address', async () => {
      mockIsAddress.mockReturnValue(false);
      
      useWalletStore.setState({ 
        mnemonic: 'test mnemonic phrase word word word word word word word word word',
        address: '0x123',
      });

      await useWalletStore.getState().actions.sendTransaction(
        'invalid-address',
        '1.0'
      );
      
      store = useWalletStore.getState();
      expect(store.sendError).toBeTruthy();
      expect(store.sendError).toContain('invalide');
    });

    it('should navigate back to dashboard on successful transaction', async () => {
      useWalletStore.setState({ 
        mnemonic: 'test mnemonic phrase word word word word word word word word word',
        address: '0x123',
        currentScreen: 'send',
      });

      await useWalletStore.getState().actions.sendTransaction(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
        '1.0'
      );
      
      store = useWalletStore.getState();
      expect(store.currentScreen).toBe('dashboard');
    });

    it('should refresh balance after successful transaction', async () => {
      useWalletStore.setState({ 
        mnemonic: 'test mnemonic phrase word word word word word word word word word',
        address: '0x123',
        balance: '5.0',
      });

      await useWalletStore.getState().actions.sendTransaction(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
        '1.0'
      );
      
      // Verify getBalance was called to refresh
      expect(mockGetBalance).toHaveBeenCalled();
    });

    it('should handle transaction errors gracefully', async () => {
      mockSendTransaction.mockRejectedValue(new Error('Insufficient funds'));
      
      useWalletStore.setState({ 
        mnemonic: 'test mnemonic phrase word word word word word word word word word',
        address: '0x123',
      });

      await useWalletStore.getState().actions.sendTransaction(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
        '10.0'
      );
      
      store = useWalletStore.getState();
      expect(store.sendError).toBe('Insufficient funds');
      expect(store.isSending).toBe(false);
    });

    it('should set isSending to false even if transaction fails', async () => {
      mockSendTransaction.mockRejectedValue(new Error('Network error'));
      
      useWalletStore.setState({ 
        mnemonic: 'test mnemonic phrase word word word word word word word word word',
        address: '0x123',
      });

      await useWalletStore.getState().actions.sendTransaction(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
        '1.0'
      );
      
      store = useWalletStore.getState();
      expect(store.isSending).toBe(false);
    });
  });
});
